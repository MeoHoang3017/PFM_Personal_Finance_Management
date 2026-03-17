import 'package:flutter/material.dart';

import '../../data/models/transaction_models.dart';
import 'currency_format.dart';

/// Dữ liệu một nhóm chi tiêu theo category (dùng trong Top Spending).
class CategorySpendingItem {
  final IconData icon;
  final Color color;
  final String categoryName;
  final String amountFormatted;
  final double percentage;

  const CategorySpendingItem({
    required this.icon,
    required this.color,
    required this.categoryName,
    required this.amountFormatted,
    this.percentage = 0,
  });
}

/// Kết quả tính Top Spending từ transactions.
class CategorySpendingResult {
  final List<CategorySpendingItem> items;
  final Map<String, List<TransactionModel>> categoryTransactions;

  const CategorySpendingResult({
    required this.items,
    required this.categoryTransactions,
  });
}

final Map<String, (IconData, Color)> _categoryStyle = {
  'Ăn uống': (Icons.restaurant, Colors.orange),
  'Di chuyển': (Icons.directions_car, Colors.blue),
  'Mua sắm': (Icons.shopping_bag, Colors.purple),
  'Sức khỏe': (Icons.medical_services, Colors.red),
  'Giải trí': (Icons.movie, Colors.amber),
  'Quà tặng': (Icons.card_giftcard, Colors.pink),
  'Siêu thị': (Icons.shopping_cart, Colors.teal),
  'Công nghệ': (Icons.phone_android, Colors.cyan),
  'Chuyển khoản': (Icons.account_balance_wallet, Colors.teal),
  'Khác': (Icons.category, Colors.grey),
};

(IconData, Color) _styleForCategory(String category) {
  return _categoryStyle[category] ?? _categoryStyle['Khác']!;
}

String _formatAmount(double value) => formatCurrency(value, compact: true);

/// Tính Top Spending theo category từ danh sách giao dịch (chỉ giao dịch chi).
/// [periodMonth], [periodYear]: nếu truyền thì chỉ lấy giao dịch trong tháng đó.
/// [upToDate]: nếu truyền và trùng tháng/năm với period thì chỉ lấy giao dịch có ngày <= upToDate
///   (để tháng hiện tại chỉ tính từ đầu tháng đến hôm nay, giống tab Tháng trên dashboard).
CategorySpendingResult buildCategorySpendingFromTransactions(
  List<TransactionModel> transactions, {
  int? periodMonth,
  int? periodYear,
  DateTime? upToDate,
}) {
  List<TransactionModel> expenses = transactions
      .where((t) => t.type == TransactionType.expense)
      .toList();
  if (periodMonth != null && periodYear != null) {
    expenses = expenses
        .where((t) => t.date.month == periodMonth && t.date.year == periodYear)
        .toList();
    // Tháng hiện tại: chỉ lấy từ đầu tháng đến upToDate (hôm nay), thống nhất với dashboard.
    if (upToDate != null &&
        upToDate.month == periodMonth &&
        upToDate.year == periodYear) {
      final endDay = DateTime(upToDate.year, upToDate.month, upToDate.day);
      expenses = expenses.where((t) {
        final tDay = DateTime(t.date.year, t.date.month, t.date.day);
        return tDay.compareTo(endDay) <= 0;
      }).toList();
    }
  }

  final Map<String, double> categoryTotal = {};
  final Map<String, List<TransactionModel>> categoryTransactions = {};

  for (final t in expenses) {
    final cat = (t.categoryName != null && t.categoryName!.isNotEmpty)
        ? t.categoryName!
        : (t.category.isEmpty ? 'Khác' : t.category);
    categoryTotal[cat] = (categoryTotal[cat] ?? 0) + t.amount;
    categoryTransactions.putIfAbsent(cat, () => []).add(t);
  }

  final totalExpense = categoryTotal.values.fold<double>(0, (a, b) => a + b);
  final items = <CategorySpendingItem>[];

  final sortedEntries = categoryTotal.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));

  for (final e in sortedEntries) {
    final cat = e.key;
    final sum = e.value;
    final pct = totalExpense > 0 ? (sum / totalExpense * 100) : 0.0;
    final (icon, color) = _styleForCategory(cat);
    items.add(CategorySpendingItem(
      icon: icon,
      color: color,
      categoryName: cat,
      amountFormatted: _formatAmount(sum),
      percentage: pct,
    ));
  }

  return CategorySpendingResult(
    items: items,
    categoryTransactions: categoryTransactions,
  );
}
