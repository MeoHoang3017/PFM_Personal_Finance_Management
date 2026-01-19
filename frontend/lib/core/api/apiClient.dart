import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio = Dio(BaseOptions(baseUrl: "https://api.yourdomain.com"));
  final _storage = const FlutterSecureStorage();

  ApiClient() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Xử lý logic Refresh Token hoặc Logout tại đây
        }
        return handler.next(e);
      },
    ));
  }
}