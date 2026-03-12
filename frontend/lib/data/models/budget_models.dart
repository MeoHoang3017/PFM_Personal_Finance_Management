import 'pagination.dart';

enum BudgetPeriod { daily, weekly, monthly, yearly }

extension BudgetPeriodExt on BudgetPeriod {
  String get value => name;
  static BudgetPeriod fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'daily':
        return BudgetPeriod.daily;
      case 'weekly':
        return BudgetPeriod.weekly;
      case 'monthly':
        return BudgetPeriod.monthly;
      case 'yearly':
        return BudgetPeriod.yearly;
      default:
        return BudgetPeriod.monthly;
    }
  }
}

class BudgetModel {
  final String id;
  final double amount;
  final String category;
  final BudgetPeriod period;
  final DateTime startDate;
  final DateTime endDate;
  final String user;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  BudgetModel({
    required this.id,
    required this.amount,
    required this.category,
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.user,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    return BudgetModel(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      category: json['category'] as String? ?? '',
      period: BudgetPeriodExt.fromString(json['period'] as String?),
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'] as String) ?? DateTime.now() : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'] as String) ?? DateTime.now() : DateTime.now(),
      user: json['user'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}

class CreateBudgetData {
  final double amount;
  final String category;
  final BudgetPeriod period;
  final DateTime startDate;
  final DateTime endDate;
  final String user;
  final bool? isActive;

  CreateBudgetData({
    required this.amount,
    required this.category,
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.user,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'amount': amount,
      'category': category,
      'period': period.value,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'user': user,
    };
    if (isActive != null) m['isActive'] = isActive;
    return m;
  }
}

class UpdateBudgetData {
  final double? amount;
  final String? category;
  final BudgetPeriod? period;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool? isActive;

  UpdateBudgetData({
    this.amount,
    this.category,
    this.period,
    this.startDate,
    this.endDate,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (amount != null) m['amount'] = amount;
    if (category != null) m['category'] = category;
    if (period != null) m['period'] = period!.value;
    if (startDate != null) m['startDate'] = startDate!.toIso8601String();
    if (endDate != null) m['endDate'] = endDate!.toIso8601String();
    if (isActive != null) m['isActive'] = isActive;
    return m;
  }
}

class PaginatedBudgetsResponse {
  final List<BudgetModel> data;
  final Pagination pagination;

  PaginatedBudgetsResponse({required this.data, required this.pagination});

  factory PaginatedBudgetsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedBudgetsResponse(
      data: list.map((e) => BudgetModel.fromJson(e as Map<String, dynamic>)).toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
