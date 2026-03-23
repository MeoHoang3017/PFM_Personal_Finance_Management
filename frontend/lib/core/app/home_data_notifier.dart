import 'package:flutter/foundation.dart';

/// Thông báo màn Home (Tổng quan / Giao dịch / Ngân sách) cần tải lại dữ liệu.
/// Dùng debounce ngắn để tránh nhiều lần fetch liên tiếp (ví dụ sau lưu Cài đặt).
class HomeDataNotifier extends ChangeNotifier {
  DateTime? _lastNotify;
  static const _debounce = Duration(milliseconds: 700);

  /// [force] = true (đổi tiền tệ, lưu cài đặt) — luôn broadcast.
  void requestRefresh({bool force = false}) {
    if (!force && _lastNotify != null) {
      if (DateTime.now().difference(_lastNotify!) < _debounce) return;
    }
    _lastNotify = DateTime.now();
    notifyListeners();
  }
}
