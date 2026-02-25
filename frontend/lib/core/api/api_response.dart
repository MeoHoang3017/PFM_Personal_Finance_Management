/// Định dạng response chuẩn từ backend: { code, message, result?, error? }
class ApiResponse<T> {
  final int code;
  final String message;
  final T? result;
  final ApiError? error;

  ApiResponse({
    required this.code,
    required this.message,
    this.result,
    this.error,
  });

  bool get isSuccess => code >= 200 && code < 300;
  bool get isUnauthorized => code == 401;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T? Function(dynamic)? fromJsonResult,
  ) {
    return ApiResponse(
      code: json['code'] as int? ?? 0,
      message: json['message'] as String? ?? '',
      result: json['result'] != null && fromJsonResult != null
          ? fromJsonResult(json['result'])
          : json['result'] as T?,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiError {
  final String message;
  final dynamic details;

  ApiError({required this.message, this.details});

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      message: json['message'] as String? ?? '',
      details: json['details'],
    );
  }
}
