import 'pagination.dart';

/// 1 tuần / 1 tháng / 1 năm (cửa sổ lịch) hoặc khoảng tùy chọn.
enum BudgetPeriod { weekly, monthly, yearly, custom }

extension BudgetPeriodExt on BudgetPeriod {
  String get value => name;

  /// Key dùng với `easy_localization` (`period_week`, `period_month`, …).
  String get localizationKey {
    switch (this) {
      case BudgetPeriod.weekly:
        return 'period_week';
      case BudgetPeriod.monthly:
        return 'period_month';
      case BudgetPeriod.yearly:
        return 'period_year';
      case BudgetPeriod.custom:
        return 'period_custom';
    }
  }

  static BudgetPeriod fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'weekly':
        return BudgetPeriod.weekly;
      case 'monthly':
        return BudgetPeriod.monthly;
      case 'yearly':
        return BudgetPeriod.yearly;
      case 'custom':
        return BudgetPeriod.custom;
      case 'daily':
        return BudgetPeriod.custom;
      default:
        return BudgetPeriod.monthly;
    }
  }
}

class BudgetModel {
  final String id;
  final double amount;
  /// ISO 4217 — hạn mức và spentAmount cùng đơn vị.
  final String currency;
  final String category;
  final String? categoryName;
  final String? categoryIcon;
  final String? categoryColor;
  final BudgetPeriod period;
  final DateTime startDate;
  final DateTime endDate;
  final String user;
  final bool isActive;
  final double? spentAmount;
  final bool? isOverBudget;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  BudgetModel({
    required this.id,
    required this.amount,
    this.currency = 'VND',
    required this.category,
    this.categoryName,
    this.categoryIcon,
    this.categoryColor,
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.user,
    this.isActive = true,
    this.spentAmount,
    this.isOverBudget,
    this.createdAt,
    this.updatedAt,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    return BudgetModel(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: (json['currency'] as String?)?.trim().isNotEmpty == true
          ? (json['currency'] as String).toUpperCase()
          : 'VND',
      category: json['category'] as String? ?? '',
      categoryName: json['categoryName'] as String?,
      categoryIcon: json['categoryIcon'] as String?,
      categoryColor: json['categoryColor'] as String?,
      period: BudgetPeriodExt.fromString(json['period'] as String?),
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'] as String) ?? DateTime.now() : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'] as String) ?? DateTime.now() : DateTime.now(),
      user: json['user'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      spentAmount: (json['spentAmount'] as num?)?.toDouble(),
      isOverBudget: json['isOverBudget'] as bool?,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}

class CreateBudgetData {
  final double amount;
  final String category;
  final BudgetPeriod period;
  final String? currency;
  final DateTime? startDate;
  final DateTime? endDate;
  final String user;
  final bool? isActive;

  CreateBudgetData({
    required this.amount,
    required this.category,
    required this.period,
    this.currency,
    this.startDate,
    this.endDate,
    required this.user,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'amount': amount,
      'category': category,
      'period': period.value,
      'user': user,
    };
    if (currency != null && currency!.trim().isNotEmpty) m['currency'] = currency!.toUpperCase();
    if (period == BudgetPeriod.custom) {
      if (startDate != null) m['startDate'] = startDate!.toIso8601String();
      if (endDate != null) m['endDate'] = endDate!.toIso8601String();
    }
    if (isActive != null) m['isActive'] = isActive;
    return m;
  }
}

class UpdateBudgetData {
  final double? amount;
  final String? category;
  final BudgetPeriod? period;
  final String? currency;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool? isActive;

  UpdateBudgetData({
    this.amount,
    this.category,
    this.period,
    this.currency,
    this.startDate,
    this.endDate,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (amount != null) m['amount'] = amount;
    if (category != null) m['category'] = category;
    if (currency != null && currency!.trim().isNotEmpty) m['currency'] = currency!.toUpperCase();
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
