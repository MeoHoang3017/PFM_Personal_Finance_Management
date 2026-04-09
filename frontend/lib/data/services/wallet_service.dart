import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/wallet_models.dart';

class WalletService {
  final ApiClient _api;

  WalletService(this._api);

  Future<ApiResponse<PaginatedWalletsResponse>> getWallets({int page = 1, int pageSize = 20}) async {
    try {
      final res = await _api.dio.get('/wallets', queryParameters: {'page': page, 'pageSize': pageSize});
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      final parsed = PaginatedWalletsResponse.fromJson(result as Map<String, dynamic>);
      return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: parsed);
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<Wallet>> getWalletById(String id) async {
    try {
      final res = await _api.dio.get('/wallets/$id');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: Wallet.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<Wallet>> createWallet(CreateWalletData body) async {
    try {
      final res = await _api.dio.post('/wallets', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: Wallet.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<Wallet>> updateWallet(String id, UpdateWalletData body) async {
    try {
      final res = await _api.dio.put('/wallets/$id', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: Wallet.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<void>> deleteWallet(String id) async {
    try {
      await _api.dio.delete('/wallets/$id');
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      return _error(e);
    }
  }

  ApiResponse<T> _error<T>(DioException e) {
    final code = e.response?.statusCode ?? 500;
    final data = e.response?.data;
    final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
    return ApiResponse(code: code, message: message, result: null);
  }
}
