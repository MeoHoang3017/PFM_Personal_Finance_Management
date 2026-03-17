import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';
import '../di/injection.dart';
import '../../data/services/auth_service.dart';

class ApiClient {
  late final Dio dio;
  final _storage = const FlutterSecureStorage();

  /// Tránh gọi refresh đồng thời khi nhiều request cùng 401.
  Future<bool>? _refreshFuture;

  ApiClient({String? baseUrl}) {
    final base = baseUrl ?? AppConstants.defaultApiBaseUrl;
    dio = Dio(
      BaseOptions(
        baseUrl: '$base${AppConstants.apiPrefix}',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(
            key: AppConstants.storageKeyAccessToken,
          );
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode != 401) {
            return handler.next(e);
          }
          final path = e.requestOptions.path;
          if (path.contains('refresh-token') ||
              path.contains('/auth/login') ||
              path.contains('/auth/register') ||
              path.contains('/auth/google')) {
            return handler.next(e);
          }

          Future<bool> doRefresh() async {
            try {
              final auth = getIt<AuthService>();
              final result = await auth.refreshToken();
              return result != null &&
                  result.isSuccess &&
                  (result.result?.accessToken ?? '').isNotEmpty;
            } catch (_) {
              return false;
            }
          }

          if (_refreshFuture != null) {
            final success = await _refreshFuture!;
            if (success) {
              try {
                final response = await dio.fetch(e.requestOptions);
                return handler.resolve(response);
              } catch (_) {
                return handler.next(e);
              }
            }
            final auth = getIt<AuthService>();
            await auth.clearTokensOnly();
            return handler.next(e);
          }

          _refreshFuture = doRefresh();
          final success = await _refreshFuture!;
          _refreshFuture = null;

          if (success) {
            try {
              final response = await dio.fetch(e.requestOptions);
              return handler.resolve(response);
            } catch (_) {
              return handler.next(e);
            }
          }

          final auth = getIt<AuthService>();
          await auth.clearTokensOnly();
          return handler.next(e);
        },
      ),
    );
  }
}
