import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

class ApiClient {
  late final Dio dio;
  final _storage = const FlutterSecureStorage();

  ApiClient({String? baseUrl}) {
    final base = baseUrl ?? AppConstants.defaultApiBaseUrl;
    dio = Dio(BaseOptions(
      baseUrl: '$base${AppConstants.apiPrefix}',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: AppConstants.storageKeyAccessToken);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Có thể gọi refresh token ở đây, sau đó retry; nếu fail thì logout.
          // Hiện tại để UI xử lý redirect về login.
        }
        return handler.next(e);
      },
    ));
  }
}
