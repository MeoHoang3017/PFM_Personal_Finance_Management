import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';

/// Service kiểm tra kết nối frontend – backend (gọi GET /api/health).
class ApiHealthService {
  final ApiClient _api;

  ApiHealthService(this._api);

  /// Gọi GET /api/health. Trả về true nếu backend phản hồi ok.
  Future<bool> checkConnection() async {
    try {
      final res = await _api.dio.get('/health');
      final data = res.data;
      return data is Map && (data['ok'] == true);
    } on DioException catch (_) {
      return false;
    }
  }
}
