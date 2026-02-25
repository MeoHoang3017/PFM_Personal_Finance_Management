import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../../core/constants/app_constants.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _api;
  final _storage = const FlutterSecureStorage();

  AuthService(this._api);

  Future<ApiResponse<TokenResponse>> login(LoginRequest request) async {
    try {
      final res = await _api.dio.post('/auth/login', data: request.toJson());
      final data = res.data as Map<String, dynamic>;
      final apiRes = ApiResponse.fromJson(data, (r) => TokenResponse.fromJson(r as Map<String, dynamic>));
      if (apiRes.isSuccess && apiRes.result != null) {
        await _storage.write(key: AppConstants.storageKeyAccessToken, value: apiRes.result!.accessToken);
        await _storage.write(key: AppConstants.storageKeyRefreshToken, value: apiRes.result!.refreshToken);
        await _storage.write(key: AppConstants.storageKeyUser, value: jsonEncode(apiRes.result!.user.toJson()));
      }
      return apiRes;
    } on DioException catch (e) {
      return _errorResponse(e);
    }
  }

  Future<ApiResponse<TokenResponse>> register(RegisterRequest request) async {
    try {
      final res = await _api.dio.post('/auth/register', data: request.toJson());
      final data = res.data as Map<String, dynamic>;
      final apiRes = ApiResponse.fromJson(data, (r) => TokenResponse.fromJson(r as Map<String, dynamic>));
      if (apiRes.isSuccess && apiRes.result != null) {
        await _storage.write(key: AppConstants.storageKeyAccessToken, value: apiRes.result!.accessToken);
        await _storage.write(key: AppConstants.storageKeyRefreshToken, value: apiRes.result!.refreshToken);
        await _storage.write(key: AppConstants.storageKeyUser, value: jsonEncode(apiRes.result!.user.toJson()));
      }
      return apiRes;
    } on DioException catch (e) {
      return _errorResponse(e);
    }
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/auth/logout');
    } catch (_) {}
    await _storage.delete(key: AppConstants.storageKeyAccessToken);
    await _storage.delete(key: AppConstants.storageKeyRefreshToken);
    await _storage.delete(key: AppConstants.storageKeyUser);
  }

  Future<String?> getAccessToken() => _storage.read(key: AppConstants.storageKeyAccessToken);

  Future<UserInfo?> getStoredUser() async {
    final raw = await _storage.read(key: AppConstants.storageKeyUser);
    if (raw == null) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>?;
      return map != null ? UserInfo.fromJson(map) : null;
    } catch (_) {
      return null;
    }
  }
}

ApiResponse<TokenResponse> _errorResponse(DioException e) {
  final code = e.response?.statusCode ?? 500;
  final data = e.response?.data;
  final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
  return ApiResponse(code: code, message: message, result: null);
}
