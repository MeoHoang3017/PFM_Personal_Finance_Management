import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/category_models.dart';

class CategoryService {
  final ApiClient _api;

  CategoryService(this._api);

  /// GET /categories - public/optional auth, trả về list categories
  Future<ApiResponse<List<CategoryModel>>> getCategories() async {
    try {
      final res = await _api.dio.get('/categories');
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: const []);
      List<dynamic> list = result is List ? result : (result['data'] as List? ?? []);
      final items = list.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>)).toList();
      return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: items);
    } on DioException catch (e) {
      return _error(e);
    }
  }

  /// GET /categories/user/list - categories của user (sau khi đăng nhập).
  /// [pageSize] lớn (vd. 500) để lấy hết danh mục khi xây cây cha-con.
  Future<ApiResponse<List<CategoryModel>>> getUserCategories({int page = 1, int pageSize = 500}) async {
    try {
      final res = await _api.dio.get('/categories/user/list', queryParameters: {'page': page, 'pageSize': pageSize});
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: const []);
      List<dynamic> list = result is List ? result : (result['data'] as List? ?? []);
      final items = list.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>)).toList();
      return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: items);
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<CategoryModel>> createCategory(CreateCategoryData body) async {
    try {
      final res = await _api.dio.post('/categories', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 201, message: data['message'] as String? ?? '', result: null as CategoryModel);
      return ApiResponse(
        code: data['code'] as int? ?? 201,
        message: data['message'] as String? ?? '',
        result: CategoryModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<CategoryModel>> updateCategory(String id, UpdateCategoryData body) async {
    try {
      final res = await _api.dio.put('/categories/$id', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      final result = data['result'];
      if (result == null) return ApiResponse(code: data['code'] as int? ?? 200, message: data['message'] as String? ?? '', result: null as CategoryModel);
      return ApiResponse(
        code: data['code'] as int? ?? 200,
        message: data['message'] as String? ?? '',
        result: CategoryModel.fromJson(result as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<void>> deleteCategory(String id) async {
    try {
      await _api.dio.delete('/categories/$id');
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
