import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/dio_error_message.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _api;
  final _storage = const FlutterSecureStorage();
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;
  Future<void>? _googleInitialization;

  AuthService(this._api);

  Future<ApiResponse<TokenResponse>> login(LoginRequest request) async {
    try {
      final res = await _api.dio.post('/auth/login', data: request.toJson());
      return _persistAuthResponse(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return _errorResponse(e);
    }
  }

  Future<ApiResponse<TokenResponse>> register(RegisterRequest request) async {
    try {
      final res = await _api.dio.post('/auth/register', data: request.toJson());
      return _persistAuthResponse(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return _errorResponse(e);
    }
  }

  /// Gửi mã OTP đăng ký (POST /otp/send-register-otp). Gọi trước khi gọi register với cùng email.
  Future<ApiResponse<void>> requestRegisterOtp(String email) async {
    try {
      await _api.dio.post(
        '/otp/send-register-otp',
        data: {'email': email.trim()},
      );
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 500;
      return ApiResponse(code: code, message: dioErrorMessage(e), result: null);
    }
  }

  Future<ApiResponse<TokenResponse>> loginWithGoogle() async {
    try {
      await _ensureGoogleInitialized();
      if (!_googleSignIn.supportsAuthenticate()) {
        return ApiResponse(
          code: 400,
          message: 'Thiết bị này chưa hỗ trợ đăng nhập Google.',
          result: null,
        );
      }

      final account = await _googleSignIn.authenticate();
      final auth = account.authentication;
      final idToken = auth.idToken;

      if (idToken == null || idToken.isEmpty) {
        return ApiResponse(
          code: 400,
          message: 'Không lấy được Google ID token.',
          result: null,
        );
      }

      final res = await _api.dio.post(
        '/auth/google',
        data: {'idToken': idToken},
      );
      return _persistAuthResponse(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return _errorResponse(e);
    } on GoogleSignInException catch (e) {
      return ApiResponse(
        code: 400,
        message: _googleSignInMessage(e),
        result: null,
      );
    } catch (_) {
      return ApiResponse(
        code: 500,
        message: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        result: null,
      );
    }
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/auth/logout');
    } catch (_) {}
    try {
      await _ensureGoogleInitialized();
      await _googleSignIn.signOut();
    } catch (_) {}
    await clearTokensOnly();
  }

  /// Chỉ xóa token và user trong storage (không gọi API). Dùng khi refresh token thất bại.
  Future<void> clearTokensOnly() async {
    await _storage.delete(key: AppConstants.storageKeyAccessToken);
    await _storage.delete(key: AppConstants.storageKeyRefreshToken);
    await _storage.delete(key: AppConstants.storageKeyUser);
  }

  /// Gửi OTP quên mật khẩu (POST /otp/send-forgot-password-otp)
  Future<ApiResponse<void>> requestForgotPasswordOtp(String email) async {
    try {
      await _api.dio.post(
        '/otp/send-forgot-password-otp',
        data: {'email': email},
      );
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 500;
      return ApiResponse(code: code, message: dioErrorMessage(e), result: null);
    }
  }

  /// Đặt lại mật khẩu (POST /auth/reset-password)
  Future<ApiResponse<void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      await _api.dio.post(
        '/auth/reset-password',
        data: {'email': email, 'otp': otp, 'newPassword': newPassword},
      );
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 500;
      return ApiResponse(code: code, message: dioErrorMessage(e), result: null);
    }
  }

  /// Refresh token (POST /auth/refresh-token) - dùng khi 401.
  /// Backend có thể chỉ trả về accessToken; khi đó chỉ cập nhật accessToken, giữ nguyên refreshToken và user.
  Future<ApiResponse<TokenResponse>?> refreshToken() async {
    try {
      final refresh = await _storage.read(
        key: AppConstants.storageKeyRefreshToken,
      );
      if (refresh == null || refresh.isEmpty) return null;
      final res = await _api.dio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refresh},
      );
      final data = res.data as Map<String, dynamic>;
      final result = data['result'] as Map<String, dynamic>?;
      if (result == null) {
        return ApiResponse(
          code: data['code'] as int? ?? 200,
          message: data['message'] as String? ?? '',
          result: null,
        );
      }

      final newAccess = result['accessToken'] as String? ?? '';
      if (newAccess.isEmpty) {
        return ApiResponse(code: 401, message: 'No access token', result: null);
      }

      await _storage.write(
        key: AppConstants.storageKeyAccessToken,
        value: newAccess,
      );
      final newRefresh = result['refreshToken'] as String?;
      if (newRefresh != null && newRefresh.isNotEmpty) {
        await _storage.write(
          key: AppConstants.storageKeyRefreshToken,
          value: newRefresh,
        );
      }
      final userMap = result['user'] as Map<String, dynamic>?;
      if (userMap != null && userMap.isNotEmpty) {
        await _storage.write(
          key: AppConstants.storageKeyUser,
          value: jsonEncode(userMap),
        );
      }
      final user = userMap != null ? UserInfo.fromJson(userMap) : null;
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: TokenResponse(
          accessToken: newAccess,
          refreshToken: newRefresh ?? refresh,
          user:
              user ??
              (await getStoredUser()) ??
              UserInfo(id: '', username: '', email: ''),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<String?> getAccessToken() =>
      _storage.read(key: AppConstants.storageKeyAccessToken);

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

  /// Cập nhật thông tin user lưu local (sau khi chỉnh sửa profile/settings).
  Future<void> updateStoredUser(UserInfo user) async {
    await _storage.write(
      key: AppConstants.storageKeyUser,
      value: jsonEncode(user.toJson()),
    );
  }

  Future<void> _ensureGoogleInitialized() {
    final existing = _googleInitialization;
    if (existing != null) {
      return existing;
    }

    final clientId = AppConstants.googleClientId.trim();
    final serverClientId = AppConstants.googleServerClientId.trim();

    if (!kIsWeb &&
        defaultTargetPlatform == TargetPlatform.iOS &&
        clientId.isEmpty) {
      return Future<void>.error(
        const GoogleSignInException(
          code: GoogleSignInExceptionCode.clientConfigurationError,
          description: 'Thiếu GOOGLE_CLIENT_ID cho iOS.',
        ),
      );
    }

    _googleInitialization = _googleSignIn.initialize(
      clientId: clientId.isEmpty ? null : clientId,
      serverClientId: serverClientId.isEmpty ? null : serverClientId,
    );
    return _googleInitialization!;
  }

  Future<void> _saveAuthTokens(TokenResponse tokenResponse) async {
    await _storage.write(
      key: AppConstants.storageKeyAccessToken,
      value: tokenResponse.accessToken,
    );
    await _storage.write(
      key: AppConstants.storageKeyRefreshToken,
      value: tokenResponse.refreshToken,
    );
    await _storage.write(
      key: AppConstants.storageKeyUser,
      value: jsonEncode(tokenResponse.user.toJson()),
    );
  }

  Future<ApiResponse<TokenResponse>> _persistAuthResponse(
    Map<String, dynamic> data,
  ) async {
    final apiRes = ApiResponse.fromJson(
      data,
      (r) => TokenResponse.fromJson(r as Map<String, dynamic>),
    );
    if (apiRes.isSuccess && apiRes.result != null) {
      await _saveAuthTokens(apiRes.result!);
    }
    return apiRes;
  }
}

ApiResponse<TokenResponse> _errorResponse(DioException e) {
  final code = e.response?.statusCode ?? 500;
  final message = dioErrorMessage(
    e,
    fallback: 'Đăng nhập thất bại. Vui lòng thử lại.',
  );
  return ApiResponse(code: code, message: message, result: null);
}

String _googleSignInMessage(GoogleSignInException e) {
  return switch (e.code) {
    GoogleSignInExceptionCode.canceled => 'Bạn đã hủy đăng nhập Google.',
    GoogleSignInExceptionCode.clientConfigurationError =>
      'Google Sign-In chưa được cấu hình đúng. Kiểm tra GOOGLE_CLIENT_ID hoặc GOOGLE_SERVER_CLIENT_ID.',
    GoogleSignInExceptionCode.providerConfigurationError =>
      'Thiết bị chưa cấu hình Google Sign-In đúng cách.',
    GoogleSignInExceptionCode.uiUnavailable =>
      'Không thể mở giao diện đăng nhập Google trên thiết bị này.',
    GoogleSignInExceptionCode.interrupted =>
      'Đăng nhập Google bị gián đoạn. Vui lòng thử lại.',
    GoogleSignInExceptionCode.userMismatch =>
      'Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.',
    GoogleSignInExceptionCode.unknownError =>
      e.description?.isNotEmpty == true
          ? e.description!
          : 'Đăng nhập Google thất bại.',
  };
}
