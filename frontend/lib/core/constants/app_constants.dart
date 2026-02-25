/// Base URL cho API backend. Ưu tiên từ .env (API_URL).
class AppConstants {
  static const String defaultApiBaseUrl = 'http://localhost:3000';
  static const String apiPrefix = '/api';
  static const String storageKeyAccessToken = 'access_token';
  static const String storageKeyRefreshToken = 'refresh_token';
  static const String storageKeyUser = 'user';
}
