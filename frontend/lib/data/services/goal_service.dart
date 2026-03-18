import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/goal_models.dart';

class GoalService {
  final ApiClient _api;

  GoalService(this._api);

  Future<ApiResponse<PaginatedGoalsResponse>> getGoals({int page = 1, int pageSize = 20}) async {
    try {
      final res = await _api.dio.get('/goals', queryParameters: {'page': page, 'pageSize': pageSize});
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: PaginatedGoalsResponse.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<GoalModel>> getGoalById(String id) async {
    try {
      final res = await _api.dio.get('/goals/$id');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null as GoalModel);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: GoalModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<GoalModel>> createGoal(CreateGoalData body) async {
    try {
      final res = await _api.dio.post('/goals', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null as GoalModel);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: GoalModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<GoalModel>> updateGoal(String id, UpdateGoalData body) async {
    try {
      final res = await _api.dio.put('/goals/$id', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null as GoalModel);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: GoalModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<void>> deleteGoal(String id) async {
    try {
      await _api.dio.delete('/goals/$id');
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
