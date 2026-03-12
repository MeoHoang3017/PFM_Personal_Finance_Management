import 'package:dio/dio.dart';

/// Chuyển DioException thành thông báo lỗi thân thiện (tiếng Việt) cho người dùng.
String dioErrorMessage(DioException e, {String fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'}) {
  // Ưu tiên message từ server (response body)
  final data = e.response?.data;
  if (data is Map && data['message'] != null && (data['message'] as String).trim().isNotEmpty) {
    return data['message'] as String;
  }

  // Lỗi kết nối / mạng
  switch (e.type) {
    case DioExceptionType.connectionError:
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'Không kết nối được máy chủ. Kiểm tra backend đã chạy và địa chỉ API (mặc định: http://localhost:5000).';
    case DioExceptionType.unknown:
      final msg = e.message ?? '';
      if (msg.contains('refused') || msg.contains('Connection refused') || msg.contains('Failed host lookup')) {
        return 'Không kết nối được máy chủ. Hãy chạy backend (npm run dev trong thư mục backend) và kiểm tra địa chỉ API.';
      }
      if (msg.contains('SocketException') || msg.contains('Network')) {
        return 'Lỗi mạng. Kiểm tra kết nối internet hoặc địa chỉ máy chủ.';
      }
      break;
    case DioExceptionType.badResponse:
      final code = e.response?.statusCode;
      if (code == 401) return 'Email hoặc mật khẩu không đúng.';
      if (code == 404) return 'Không tìm thấy tài nguyên.';
      if (code != null && code >= 500) return 'Lỗi máy chủ. Vui lòng thử lại sau.';
      break;
    default:
      break;
  }

  return fallback;
}
