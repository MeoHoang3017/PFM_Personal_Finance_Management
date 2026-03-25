import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/desktop_google_login_stub.dart'
    if (dart.library.io) '../../core/utils/desktop_google_login_impl.dart' as desktop_google;
import '../../core/utils/dio_error_message.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _api;
  final _storage = const FlutterSecureStorage();
  Future<void>? _googleSignInInit;

  AuthService(this._api);

  /// Official google_sign_in 7.x — Android, iOS, macOS, Web. Desktop (Windows/Linux) không hỗ trợ.
  GoogleSignIn get googleSignIn => GoogleSignIn.instance;

  Future<void> _ensureGoogleSignInInitialized() async {
    _googleSignInInit ??= () {
      final clientId = AppConstants.googleClientId.isEmpty
          ? null
          : AppConstants.googleClientId;
      if (kIsWeb) {
        // google_sign_in_web không hỗ trợ serverClientId.
        return GoogleSignIn.instance.initialize(
          clientId: clientId,
        );
      }
      return GoogleSignIn.instance.initialize(
        clientId: clientId,
        serverClientId: AppConstants.googleServerClientId,
      );
    }();
    await _googleSignInInit;
  }

  /// Gọi trước khi dùng authenticationEvents hoặc renderButton (ví dụ trên web). Safe to call nhiều lần.
  Future<void> ensureGoogleSignInInitialized() => _ensureGoogleSignInInitialized();

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

  /// Trên web bắt buộc dùng nút renderButton (google_sign_in_web) và stream authenticationEvents, rồi gọi [loginWithGoogleWithIdToken].
  bool get isWebGoogleSignInRequired => kIsWeb;

  /// Gửi idToken từ Google lên backend. Dùng cho web khi authenticationEvents trả về GoogleSignInAuthenticationEventSignIn.
  Future<ApiResponse<TokenResponse>> loginWithGoogleWithIdToken(String idToken) async {
    if (idToken.isEmpty) {
      debugPrint('[Google Login] idToken empty');
      return ApiResponse(code: 400, message: 'Không lấy được Google ID token.', result: null);
    }
    return _sendGoogleIdTokenToBackend(idToken);
  }

  /// Windows/Linux: mở trình duyệt → trang backend đăng nhập Google → redirect về localhost với id_token → gửi backend.
  Future<ApiResponse<TokenResponse>> _loginWithGoogleViaBrowser() async {
    try {
      final baseUrl = _api.dio.options.baseUrl;
      final idToken = await desktop_google.runDesktopGoogleLogin(baseUrl);
      if (idToken == null || idToken.isEmpty) {
        return ApiResponse(
          code: 400,
          message: 'Đăng nhập bị hủy hoặc hết thời gian. Vui lòng thử lại.',
          result: null,
        );
      }
      return _sendGoogleIdTokenToBackend(idToken);
    } on DioException catch (e) {
      return _errorResponse(e);
    } catch (e, stack) {
      debugPrint('[Google Login] Browser flow error: $e');
      debugPrint('[Google Login] Stack: $stack');
      return ApiResponse(
        code: 500,
        message: e.toString().isNotEmpty ? e.toString() : 'Đăng nhập Google thất bại.',
        result: null,
      );
    }
  }

  /// Đăng nhập Google (Android, iOS, macOS). Web: dùng nút renderButton + authenticationEvents.
  /// Desktop (Windows/Linux): mở trình duyệt tới trang backend, đăng nhập Google, redirect về app với id_token.
  Future<ApiResponse<TokenResponse>> loginWithGoogle() async {
    if (kIsWeb) {
      return ApiResponse(code: 0, message: 'WEB_USE_BUTTON', result: null);
    }
    // Trên Windows/Linux, supportsAuthenticate() có thể ném hoặc trả về false → dùng đăng nhập qua website.
    bool supportsAuth = false;
    try {
      supportsAuth = GoogleSignIn.instance.supportsAuthenticate();
    } catch (e, stack) {
      debugPrint('[Google Login] Platform không có implementation (Windows/Linux), dùng đăng nhập qua trình duyệt: $e');
      return _loginWithGoogleViaBrowser();
    }
    if (!supportsAuth) {
      debugPrint('[Google Login] Platform không hỗ trợ authenticate(), dùng đăng nhập qua trình duyệt.');
      return _loginWithGoogleViaBrowser();
    }
    try {
      await _ensureGoogleSignInInitialized();
      final account = await GoogleSignIn.instance.authenticate();
      if (account == null) {
        return ApiResponse(code: 400, message: 'Bạn đã hủy đăng nhập Google.', result: null);
      }
      final auth = account.authentication;
      final idToken = auth.idToken;
      if (idToken == null || idToken.isEmpty) {
        debugPrint('[Google Login] idToken null or empty after authenticate');
        return ApiResponse(
          code: 400,
          message: 'Không lấy được Google ID token. Thử lại hoặc dùng email/mật khẩu.',
          result: null,
        );
      }
      return _sendGoogleIdTokenToBackend(idToken);
    } on GoogleSignInException catch (e, stack) {
      debugPrint('[Google Login] GoogleSignInException: ${e.description} code=${e.code}');
      debugPrint('[Google Login] Stack: $stack');
      return ApiResponse(
        code: 400,
        message: e.description ?? 'Đăng nhập Google thất bại.',
        result: null,
      );
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final body = e.response?.data;
      final serverMessage = body is Map && body['message'] != null ? body['message'] : null;
      debugPrint('[Google Login] API error: status=$statusCode message=${e.message}');
      debugPrint('[Google Login] Response body: $body');
      if (serverMessage != null) debugPrint('[Google Login] Server message: $serverMessage');
      return _errorResponse(e);
    } catch (e, stack) {
      debugPrint('[Google Login] Error: $e');
      debugPrint('[Google Login] Stack: $stack');
      return ApiResponse(
        code: 500,
        message: e.toString().isNotEmpty ? e.toString() : 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        result: null,
      );
    }
  }

  Future<ApiResponse<TokenResponse>> _sendGoogleIdTokenToBackend(String idToken) async {
    try {
      final res = await _api.dio.post(
        '/auth/google',
        data: {'idToken': idToken},
      );
      return _persistAuthResponse(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return _errorResponse(e);
    }
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/auth/logout');
    } catch (_) {}
    try {
      await GoogleSignIn.instance.signOut();
    } catch (e) {
      debugPrint('[Google Sign-In] signOut: $e');
    }
    await clearTokensOnly();
  }

  /// Chỉ xóa token và user trong storage (không gọi API). Dùng khi refresh token thất bại.
  Future<void> clearTokensOnly() async {
    await _storage.delete(key: AppConstants.storageKeyAccessToken);
    await _storage.delete(key: AppConstants.storageKeyRefreshToken);
    await _storage.delete(key: AppConstants.storageKeyUser);
  }

  /// Gửi OTP quên mật khẩu (POST /auth/forgot-password — chặn tài khoản chỉ Google, đồng bộ backend)
  Future<ApiResponse<void>> requestForgotPasswordOtp(String email) async {
    try {
      final normalized = email.trim().toLowerCase();
      await _api.dio.post(
        '/auth/forgot-password',
        data: {'email': normalized},
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
        data: {
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
          'newPassword': newPassword,
        },
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
