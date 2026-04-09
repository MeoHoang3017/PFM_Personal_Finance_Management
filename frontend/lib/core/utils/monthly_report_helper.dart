import '../../data/models/transaction_models.dart';

/// Dữ liệu báo cáo một tháng.
class MonthReportData {
  final int month;
  final int year;
  final double totalIncome;
  final double totalExpense;
  final List<TransactionModel> transactions;

  const MonthReportData({
    required this.month,
    required this.year,
    required this.totalIncome,
    required this.totalExpense,
    required this.transactions,
  });

  String get monthYearLabel => 'Tháng $month/$year';
}

/// Lấy danh sách 12 tháng gần nhất (từ tháng hiện tại lùi dần).
List<DateTime> last12MonthsFromNow() {
  final now = DateTime.now();
  final list = <DateTime>[];
  for (int i = 0; i < 12; i++) {
    list.add(DateTime(now.year, now.month - i, 1));
  }
  return list;
}

/// Lọc giao dịch thuộc tháng [month], năm [year].
List<TransactionModel> transactionsInMonth(
  List<TransactionModel> all,
  int month,
  int year,
) {
  return all.where((t) => t.date.month == month && t.date.year == year).toList();
}

/// Sắp xếp giao dịch theo ngày giảm dần (mới nhất trước).
List<TransactionModel> transactionsSortedByDateDescending(List<TransactionModel> list) {
  final copy = List<TransactionModel>.from(list);
  copy.sort((a, b) => b.date.compareTo(a.date));
  return copy;
}

/// Tạo dữ liệu báo cáo 12 tháng từ [transactions].
List<MonthReportData> buildMonthlyReport(List<TransactionModel> transactions) {
  final months = last12MonthsFromNow();
  return months.map((date) {
    final list = transactionsInMonth(transactions, date.month, date.year);
    double income = 0;
    double expense = 0;
    for (final t in list) {
      if (t.type == TransactionType.income) {
        income += t.amount;
      } else if (t.type == TransactionType.expense) {
        expense += t.amount;
      }
    }
    return MonthReportData(
      month: date.month,
      year: date.year,
      totalIncome: income,
      totalExpense: expense,
      transactions: list,
    );
  }).toList();
}
