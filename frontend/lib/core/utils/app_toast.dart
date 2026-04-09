import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';

/// Helper hiển thị toast thay cho SnackBar.
/// Dùng [showSuccess] cho thông báo thành công, [showError] cho lỗi.
class AppToast {
  AppToast._();

  static const _duration = Duration(seconds: 3);

  static void showSuccess(BuildContext? context, String message) {
    _show(
      context,
      type: ToastificationType.success,
      message: message,
    );
  }

  static void showError(BuildContext? context, String message) {
    _show(
      context,
      type: ToastificationType.error,
      message: message,
    );
  }

  static void showInfo(BuildContext? context, String message) {
    _show(
      context,
      type: ToastificationType.info,
      message: message,
    );
  }

  static void _show(
    BuildContext? context, {
    required ToastificationType type,
    required String message,
  }) {
    final ctx = context;
    if (ctx != null && ctx.mounted) {
      toastification.show(
        context: ctx,
        type: type,
        style: ToastificationStyle.flat,
        autoCloseDuration: _duration,
        title: Text(message),
        alignment: Alignment.topCenter,
      );
    }
  }
}
