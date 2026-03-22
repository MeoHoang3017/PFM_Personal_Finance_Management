import 'pagination.dart';

enum TransactionType { income, expense, exchange }

extension TransactionTypeExt on TransactionType {
  String get value => name;
  static TransactionType fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'income':
        return TransactionType.income;
      case 'expense':
        return TransactionType.expense;
      case 'exchange':
        return TransactionType.exchange;
      case 'transfer':
        return TransactionType.exchange;
      default:
        return TransactionType.expense;
    }
  }
}

class TransactionModel {
  final String id;
  final double amount;
  /// Currency code captured at creation time (e.g. USD, VND).
  final String? currency;
  final TransactionType type;
  /// Category id (from API); rỗng với exchange.
  final String category;
  /// Category name for display (populated from API when available).
  final String? categoryName;
  final DateTime date;
  final String description;
  final String notes;
  final String wallet;
  final String user;
  final String? counterpartyWallet;
  final String? exchangePairId;
  final String? exchangeLeg;
  /// Display currency code (e.g. USD, VND) - amount is already in this currency.
  final String? displayCurrency;
  /// Currency symbol for display (e.g. $, ₫).
  final String? currencySymbol;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TransactionModel({
    required this.id,
    required this.amount,
    this.currency,
    required this.type,
    required this.category,
    this.categoryName,
    required this.date,
    this.description = '',
    this.notes = '',
    required this.wallet,
    required this.user,
    this.counterpartyWallet,
    this.exchangePairId,
    this.exchangeLeg,
    this.displayCurrency,
    this.currencySymbol,
    this.createdAt,
    this.updatedAt,
  });

  /// Display label: categoryName if present; exchange không có category.
  String get categoryDisplay {
    if (type == TransactionType.exchange) return '';
    return (categoryName != null && categoryName!.isNotEmpty) ? categoryName! : (category.isEmpty ? '' : category);
  }

  /// Suffix for currency display (space + symbol), e.g. ' ₫' or ' $'.
  String get currencySuffix => ' ${currencySymbol ?? '₫'}';

  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    if (v is String) return DateTime.tryParse(v);
    if (v is int) return DateTime.fromMillisecondsSinceEpoch(v, isUtc: false);
    return null;
  }

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String?,
      type: TransactionTypeExt.fromString(json['type'] as String?),
      category: json['category'] as String? ?? '',
      categoryName: json['categoryName'] as String?,
      date: _parseDate(json['date']) ?? DateTime.now(),
      description: json['description'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      wallet: json['wallet'] as String? ?? '',
      user: json['user'] as String? ?? '',
      counterpartyWallet: json['counterpartyWallet'] as String?,
      exchangePairId: json['exchangePairId'] as String?,
      exchangeLeg: json['exchangeLeg'] as String?,
      displayCurrency: json['displayCurrency'] as String?,
      currencySymbol: json['currencySymbol'] as String?,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
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

class CreateWalletExchangeData {
  final String fromWallet;
  final String toWallet;
  final double amount;
  final DateTime date;
  final String? description;
  final String? notes;

  CreateWalletExchangeData({
    required this.fromWallet,
    required this.toWallet,
    required this.amount,
    required this.date,
    this.description,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'fromWallet': fromWallet,
        'toWallet': toWallet,
        'amount': amount,
        'date': date.toIso8601String(),
        if (description != null && description!.isNotEmpty) 'description': description,
        if (notes != null && notes!.isNotEmpty) 'notes': notes,
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

class WalletExchangeResult {
  final String exchangePairId;
  final TransactionModel outbound;
  final TransactionModel inbound;

  WalletExchangeResult({
    required this.exchangePairId,
    required this.outbound,
    required this.inbound,
  });

  factory WalletExchangeResult.fromJson(Map<String, dynamic> json) {
    return WalletExchangeResult(
      exchangePairId: json['exchangePairId'] as String? ?? '',
      outbound: TransactionModel.fromJson(json['outbound'] as Map<String, dynamic>),
      inbound: TransactionModel.fromJson(json['inbound'] as Map<String, dynamic>),
    );
  }
}

class PaginatedTransactionsResponse {
  final List<TransactionModel> data;
  final Pagination pagination;

  PaginatedTransactionsResponse({required this.data, required this.pagination});

  factory PaginatedTransactionsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedTransactionsResponse(
      data: list.map((e) => TransactionModel.fromJson(e as Map<String, dynamic>)).toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
