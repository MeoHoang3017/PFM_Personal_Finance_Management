import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

/// Trên Windows/Linux: mở trình duyệt tới trang đăng nhập Google (backend phục vụ),
/// lắng nghe redirect về localhost với id_token, trả về id_token hoặc null nếu hủy/hết giờ.
/// [apiBaseUrl] ví dụ: http://localhost:5000/api (baseUrl của Dio).
Future<String?> runDesktopGoogleLogin(String apiBaseUrl) async {
  HttpServer? server;
  final completer = Completer<String?>();
  Timer? timeoutTimer;

  try {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final port = server.port;
    final redirectUri = 'http://localhost:$port/callback';
    // Dùng localhost thay vì 127.0.0.1 để origin trùng với Authorized JavaScript origins trong Google Console (http://localhost:5000)
    final base = apiBaseUrl.replaceFirst('http://127.0.0.1', 'http://localhost').replaceFirst('https://127.0.0.1', 'https://localhost');
    final desktopPageUrl = '$base/auth/google/desktop?redirect_uri=${Uri.encodeComponent(redirectUri)}';

    server.listen((request) async {
      if (completer.isCompleted) return;
      final path = request.uri.path;
      final idToken = request.uri.queryParameters['id_token'];

      if (path == '/callback' && idToken != null && idToken.isNotEmpty) {
        timeoutTimer?.cancel();
        if (!completer.isCompleted) completer.complete(idToken);
        request.response
          ..statusCode = 200
          ..headers.contentType = ContentType('text', 'html', charset: 'utf-8')
          ..write('''
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Thành công</title></head>
<body style="font-family:system-ui;text-align:center;padding:40px;">
  <h2>Đăng nhập thành công</h2>
  <p>Bạn có thể đóng cửa sổ này và quay lại ứng dụng.</p>
</body></html>''');
        await request.response.close();
        await server?.close(force: true);
        server = null;
        return;
      }

      request.response.statusCode = 400;
      await request.response.close();
    });

    timeoutTimer = Timer(const Duration(minutes: 5), () {
      if (!completer.isCompleted) {
        completer.complete(null);
        server?.close(force: true);
      }
    });

    final uri = Uri.parse(desktopPageUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      debugPrint('[Desktop Google Login] Cannot open URL: $desktopPageUrl');
      if (!completer.isCompleted) completer.complete(null);
    }

    return completer.future.whenComplete(() {
      timeoutTimer?.cancel();
      server?.close(force: true);
    });
  } catch (e, st) {
    debugPrint('[Desktop Google Login] Error: $e');
    debugPrint('[Desktop Google Login] Stack: $st');
    if (!completer.isCompleted) completer.complete(null);
    timeoutTimer?.cancel();
    await server?.close(force: true);
    return completer.future;
  }
}
