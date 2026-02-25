import 'pagination.dart';

enum TransactionType { income, expense, transfer }

extension TransactionTypeExt on TransactionType {
  String get value => name;
  static TransactionType fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'income':
        return TransactionType.income;
      case 'expense':
        return TransactionType.expense;
      case 'transfer':
        return TransactionType.transfer;
      default:
        return TransactionType.expense;
    }
  }
}

class TransactionModel {
  final String id;
  final double amount;
  final TransactionType type;
  final String category;
  final DateTime date;
  final String description;
  final String notes;
  final String wallet;
  final String user;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TransactionModel({
    required this.id,
    required this.amount,
    required this.type,
    required this.category,
    required this.date,
    this.description = '',
    this.notes = '',
    required this.wallet,
    required this.user,
    this.createdAt,
    this.updatedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      type: TransactionTypeExt.fromString(json['type'] as String?),
      category: json['category'] as String? ?? '',
      date: json['date'] != null
          ? DateTime.tryParse(json['date'] as String) ?? DateTime.now()
          : DateTime.now(),
      description: json['description'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      wallet: json['wallet'] as String? ?? '',
      user: json['user'] as String? ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}

class CreateTransactionData {
  final double amount;
  final TransactionType type;
  final String category;
  final DateTime date;
  final String? description;
  final String? notes;
  final String wallet;
  final String user;

  CreateTransactionData({
    required this.amount,
    required this.type,
    required this.category,
    required this.date,
    this.description,
    this.notes,
    required this.wallet,
    required this.user,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'type': type.value,
        'category': category,
        'date': date.toIso8601String(),
        if (description != null && description!.isNotEmpty) 'description': description,
        if (notes != null && notes!.isNotEmpty) 'notes': notes,
        'wallet': wallet,
        'user': user,
      };
}

class UpdateTransactionData {
  final double? amount;
  final TransactionType? type;
  final String? category;
  final DateTime? date;
  final String? description;
  final String? notes;
  final String? wallet;

  UpdateTransactionData({
    this.amount,
    this.type,
    this.category,
    this.date,
    this.description,
    this.notes,
    this.wallet,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (amount != null) m['amount'] = amount;
    if (type != null) m['type'] = type!.value;
    if (category != null) m['category'] = category;
    if (date != null) m['date'] = date!.toIso8601String();
    if (description != null) m['description'] = description;
    if (notes != null) m['notes'] = notes;
    if (wallet != null) m['wallet'] = wallet;
    return m;
  }
}

class PaginatedTransactionsResponse {
  final List<TransactionModel> data;
  final Pagination pagination;

  PaginatedTransactionsResponse({required this.data, required this.pagination});

  factory PaginatedTransactionsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedTransactionsResponse(
      data: list
          .map((e) => TransactionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
