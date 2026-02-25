import 'pagination.dart';

class Wallet {
  final String id;
  final String name;
  final double balance;
  final String user;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Wallet({
    required this.id,
    required this.name,
    required this.balance,
    required this.user,
    this.createdAt,
    this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      balance: (json['balance'] as num?)?.toDouble() ?? 0,
      user: json['user'] as String? ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}

class CreateWalletData {
  final String name;
  final double? balance;
  final String user;

  CreateWalletData({required this.name, this.balance, required this.user});

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{'name': name, 'user': user};
    if (balance != null) m['balance'] = balance;
    return m;
  }
}

class UpdateWalletData {
  final String? name;
  final double? balance;

  UpdateWalletData({this.name, this.balance});

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (name != null) m['name'] = name;
    if (balance != null) m['balance'] = balance;
    return m;
  }
}

class PaginatedWalletsResponse {
  final List<Wallet> data;
  final Pagination pagination;

  PaginatedWalletsResponse({required this.data, required this.pagination});

  factory PaginatedWalletsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedWalletsResponse(
      data: list.map((e) => Wallet.fromJson(e as Map<String, dynamic>)).toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
