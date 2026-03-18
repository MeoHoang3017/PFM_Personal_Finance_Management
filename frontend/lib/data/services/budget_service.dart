import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/budget_models.dart';

class BudgetService {
  final ApiClient _api;

  BudgetService(this._api);

  Future<ApiResponse<PaginatedBudgetsResponse>> getBudgets({
    int page = 1,
    int pageSize = 20,
    String? category,
    String? period,
    bool? isActive,
  }) async {
    try {
      final q = <String, dynamic>{'page': page, 'pageSize': pageSize};
      if (category != null) q['category'] = category;
      if (period != null) q['period'] = period;
      if (isActive != null) q['isActive'] = isActive;
      final res = await _api.dio.get('/budgets', queryParameters: q);
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: PaginatedBudgetsResponse.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<BudgetModel>> getBudgetById(String id) async {
    try {
      final res = await _api.dio.get('/budgets/$id');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null as BudgetModel);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: BudgetModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<BudgetModel>> createBudget(CreateBudgetData body) async {
    try {
      final res = await _api.dio.post('/budgets', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null as BudgetModel);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: BudgetModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<BudgetModel>> updateBudget(String id, UpdateBudgetData body) async {
    try {
      final res = await _api.dio.put('/budgets/$id', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null as BudgetModel);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: BudgetModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<void>> deleteBudget(String id) async {
    try {
      await _api.dio.delete('/budgets/$id');
      return ApiResponse(code: 200, message: 'OK', result: null);
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 500;
      final data = e.response?.data;
      final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
      return ApiResponse(code: code, message: message, result: null);
    }
  }

  ApiResponse<T> _error<T>(DioException e) {
    final code = e.response?.statusCode ?? 500;
    final data = e.response?.data;
    final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
    return ApiResponse(code: code, message: message, result: null);
  }
}
