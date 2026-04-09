class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

class RegisterRequest {
  final String username;
  final String email;
  final String password;
  final String? otp;

  RegisterRequest({
    required this.username,
    required this.email,
    required this.password,
    this.otp,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{'username': username, 'email': email, 'password': password};
    if (otp != null) m['otp'] = otp;
    return m;
  }
}

class UserInfo {
  final String id;
  final String username;
  final String email;
  final String theme;
  final String language;
  final String currency;
  final String avatarUrl;

  UserInfo({
    required this.id,
    required this.username,
    required this.email,
    this.theme = 'light',
    this.language = 'en',
    this.currency = 'VND',
    this.avatarUrl = '',
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      theme: json['theme'] as String? ?? 'light',
      language: json['language'] as String? ?? 'en',
      currency: json['currency'] as String? ?? 'VND',
      avatarUrl: json['avatarUrl'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'theme': theme,
        'language': language,
        'currency': currency,
        'avatarUrl': avatarUrl,
      };
}

class TokenResponse {
  final String accessToken;
  final String refreshToken;
  final UserInfo user;

  TokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      user: UserInfo.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }
}
