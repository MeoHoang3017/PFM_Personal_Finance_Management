import 'package:dio/dio.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_response.dart';
import '../models/user_models.dart';

class UserService {
  final ApiClient _api;

  UserService(this._api);

  Future<ApiResponse<UserProfile>> getProfile() async {
    try {
      final res = await _api.dio.get('/users/profile');
      final data = res.data as Map<String, dynamic>;
      return ApiResponse.fromJson(data, (r) => UserProfile.fromJson(r as Map<String, dynamic>));
    } on DioException catch (e) {
      return _error(e);
    }
  }

  Future<ApiResponse<UserProfile>> updateProfile(UpdateProfileData body) async {
    try {
      final res = await _api.dio.put('/users/profile', data: body.toJson());
      final data = res.data as Map<String, dynamic>;
      return ApiResponse.fromJson(data, (r) => UserProfile.fromJson(r as Map<String, dynamic>));
    } on DioException catch (e) {
      return _error(e);
    }
  }

  ApiResponse<UserProfile> _error(DioException e) {
    final code = e.response?.statusCode ?? 500;
    final data = e.response?.data;
    final message = (data is Map && data['message'] != null) ? data['message'] as String : (e.message ?? 'Lỗi kết nối');
    return ApiResponse(code: code, message: message, result: null);
  }
}
