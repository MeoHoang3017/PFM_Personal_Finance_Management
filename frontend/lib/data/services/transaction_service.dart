import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/transaction_models.dart';

class TransactionService {
  final ApiClient _api;

  TransactionService(this._api);

  Future<ApiResponse<PaginatedTransactionsResponse>> getTransactions({
    int page = 1,
    int pageSize = 20,
    String? type,
    String? wallet,
    String? category,
  }) async {
    try {
      final q = <String, dynamic>{'page': page, 'pageSize': pageSize};
      if (type != null) q['type'] = type;
      if (wallet != null) q['wallet'] = wallet;
      if (category != null) q['category'] = category;
      final res = await _api.dio.get('/transactions', queryParameters: q);
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      final parsed = PaginatedTransactionsResponse.fromJson(result as Map<String, dynamic>);
      return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: parsed);
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<TransactionModel>> getTransactionById(String id) async {
    try {
      final res = await _api.dio.get('/transactions/$id');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: TransactionModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<TransactionModel>> createTransaction(CreateTransactionData body) async {
    try {
      final res = await _api.dio.post('/transactions', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: TransactionModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<TransactionModel>> updateTransaction(String id, UpdateTransactionData body) async {
    try {
      final res = await _api.dio.put('/transactions/$id', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: TransactionModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<void>> deleteTransaction(String id) async {
    try {
      await _api.dio.delete('/transactions/$id');
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 500;
      final data = e.response?.data;
      final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
      return ApiResponse(code: code, message: message, result: null);
    }
  }

  Future<ApiResponse<TransactionModel>> duplicateTransaction(String id) async {
    try {
      final res = await _api.dio.post('/transactions/$id/duplicate');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null as TransactionModel);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: TransactionModel.fromJson(result as Map<String, dynamic>),
      );
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
