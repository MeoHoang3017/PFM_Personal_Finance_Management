import 'package:flutter/material.dart';

import '../../data/models/auth_models.dart';
import '../../data/services/auth_service.dart';

/// Lưu và cung cấp theme + locale theo user. App đọc từ đây để áp dụng giao diện/ngôn ngữ.
class AppPreferences extends ChangeNotifier {
  AppPreferences(this._auth);

  final AuthService _auth;

  ThemeMode _themeMode = ThemeMode.system;
  Locale? _locale;

  ThemeMode get themeMode => _themeMode;
  Locale? get locale => _locale;

  /// Nạp theme/locale từ user đã lưu (gọi khi khởi động app hoặc sau khi đăng nhập).
  Future<void> loadFromStorage() async {
    final user = await _auth.getStoredUser();
    _applyUser(user);
    notifyListeners();
  }

  /// Cập nhật từ user (gọi sau khi lưu Settings) để app áp dụng theme/ngôn ngữ mới ngay.
  void updateFromUser(UserInfo? user) {
    _applyUser(user);
    notifyListeners();
  }

  void _applyUser(UserInfo? user) {
    if (user == null) {
      _themeMode = ThemeMode.system;
      _locale = null;
      return;
    }
    _themeMode = user.theme == 'dark' ? ThemeMode.dark : ThemeMode.light;
    if (user.language == 'vi') {
      _locale = const Locale('vi');
    } else if (user.language == 'en') {
      _locale = const Locale('en');
    } else {
      _locale = null;
    }
  }
}
