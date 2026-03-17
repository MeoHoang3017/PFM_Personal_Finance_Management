/// Base URL cho API backend.
/// Có thể override khi build: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
/// - Chạy app trên máy: http://localhost:5000
/// - Android Emulator: http://10.0.2.2:5000
/// - Thiết bị thật: `http://<IP_may>:5000` (cùng mạng LAN)
class AppConstants {
  static const String defaultApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5000',
  );
  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '',
  );
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue:
        '371279773491-v0q45qucn22adg7j4907jdh6ig44oug4.apps.googleusercontent.com',
  );
  static const String apiPrefix = '/api';
  static const String storageKeyAccessToken = 'access_token';
  static const String storageKeyRefreshToken = 'refresh_token';
  static const String storageKeyUser = 'user';
}
