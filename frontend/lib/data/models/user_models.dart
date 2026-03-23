import 'pagination.dart';

class UserProfile {
  final String id;
  final String username;
  final String email;
  final String theme;
  final String language;
  final String currency;
  final String avatarUrl;
  final String? moneyFormat;
  final bool? dailyReminder;
  final String? reminderTime;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserProfile({
    required this.id,
    required this.username,
    required this.email,
    this.theme = 'light',
    this.language = 'en',
    this.currency = 'VND',
    this.avatarUrl = '',
    this.moneyFormat,
    this.dailyReminder,
    this.reminderTime,
    this.createdAt,
    this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      theme: json['theme'] as String? ?? 'light',
      language: json['language'] as String? ?? 'en',
      currency: json['currency'] as String? ?? 'VND',
      avatarUrl: json['avatarUrl'] as String? ?? '',
      moneyFormat: json['moneyFormat'] as String?,
      dailyReminder: json['dailyReminder'] as bool?,
      reminderTime: json['reminderTime'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}

class UpdateProfileData {
  final String? username;
  final String? currentPassword;
  final String? newPassword;
  final String? theme;
  final String? language;
  final String? currency;
  final String? avatarUrl;

  UpdateProfileData({
    this.username,
    this.currentPassword,
    this.newPassword,
    this.theme,
    this.language,
    this.currency,
    this.avatarUrl,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (username != null) m['username'] = username;
    if (currentPassword != null) m['currentPassword'] = currentPassword;
    if (newPassword != null) m['newPassword'] = newPassword;
    if (theme != null) m['theme'] = theme;
    if (language != null) m['language'] = language;
    if (currency != null) m['currency'] = currency;
    if (avatarUrl != null) m['avatarUrl'] = avatarUrl;
    return m;
  }
}

class UpdateUserSettingsData {
  final String? theme;
  final String? language;
  final String? currency;
  final String? avatarUrl;
  final String? moneyFormat;
  final bool? dailyReminder;
  final String? reminderTime;

  UpdateUserSettingsData({
    this.theme,
    this.language,
    this.currency,
    this.avatarUrl,
    this.moneyFormat,
    this.dailyReminder,
    this.reminderTime,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (theme != null) m['theme'] = theme;
    if (language != null) m['language'] = language;
    if (currency != null) m['currency'] = currency;
    if (avatarUrl != null) m['avatarUrl'] = avatarUrl;
    if (moneyFormat != null) m['moneyFormat'] = moneyFormat;
    if (dailyReminder != null) m['dailyReminder'] = dailyReminder;
    if (reminderTime != null) m['reminderTime'] = reminderTime;
    return m;
  }
}

class PaginatedUsersResponse {
  final List<UserProfile> data;
  final Pagination pagination;

  PaginatedUsersResponse({required this.data, required this.pagination});

  factory PaginatedUsersResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedUsersResponse(
      data: list.map((e) => UserProfile.fromJson(e as Map<String, dynamic>)).toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
