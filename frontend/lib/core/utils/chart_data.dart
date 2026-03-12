import '../../data/models/transaction_models.dart';

/// Điểm dữ liệu cho biểu đồ.
class ChartSpot {
  final double x;
  final double y;

  const ChartSpot(this.x, this.y);
}

/// Dữ liệu cho biểu đồ thu/chi: tổng, đường tích lũy theo ngày, đường trung bình, nhãn trục.
class ChartDataModel {
  final double totalExpense;
  final double totalIncome;
  final List<ChartSpot> expenseSpots;
  final List<ChartSpot> incomeSpots;
  final List<ChartSpot> expenseAverageSpots;
  final List<ChartSpot> incomeAverageSpots;
  final String? labelStart;
  final String? labelEnd;
  final Map<double, String>? bottomLabels;

  const ChartDataModel({
    required this.totalExpense,
    required this.totalIncome,
    required this.expenseSpots,
    required this.incomeSpots,
    required this.expenseAverageSpots,
    required this.incomeAverageSpots,
    this.labelStart,
    this.labelEnd,
    this.bottomLabels,
  });
}

/// Tạo ChartDataModel từ danh sách giao dịch PFM, theo [days] ngày gần nhất (30 hoặc 90).
ChartDataModel buildChartDataFromTransactions(
  List<TransactionModel> transactions, {
  int days = 30,
}) {
  final now = DateTime.now();
  final endDate = DateTime(now.year, now.month, now.day);
  final startDate = endDate.subtract(Duration(days: days));

  String fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';

  if (transactions.isEmpty || days <= 0) {
    final emptySpots = [ChartSpot(0, 0), ChartSpot(days.toDouble(), 0)];
    final labels = <double, String>{
      0: fmt(startDate),
      days.toDouble(): fmt(endDate),
    };
    return ChartDataModel(
      totalExpense: 0,
      totalIncome: 0,
      expenseSpots: emptySpots,
      incomeSpots: emptySpots,
      expenseAverageSpots: emptySpots,
      incomeAverageSpots: emptySpots,
      labelStart: fmt(startDate),
      labelEnd: fmt(endDate),
      bottomLabels: labels,
    );
  }

  final Map<int, double> dailyExpense = {};
  final Map<int, double> dailyIncome = {};
  for (final t in transactions) {
    final d = DateTime(t.date.year, t.date.month, t.date.day);
    if (d.isBefore(startDate) || d.isAfter(endDate)) continue;
    final dayIndex = d.difference(startDate).inDays;
    if (dayIndex < 0 || dayIndex > days) continue;
    if (t.type == TransactionType.income) {
      dailyIncome[dayIndex] = (dailyIncome[dayIndex] ?? 0) + t.amount;
    } else if (t.type == TransactionType.expense) {
      dailyExpense[dayIndex] = (dailyExpense[dayIndex] ?? 0) + t.amount;
    }
  }

  double totalExpense = 0;
  double totalIncome = 0;
  final List<ChartSpot> expenseSpots = [];
  final List<ChartSpot> incomeSpots = [];
  for (int i = 0; i <= days; i++) {
    totalExpense += dailyExpense[i] ?? 0;
    totalIncome += dailyIncome[i] ?? 0;
    expenseSpots.add(ChartSpot(i.toDouble(), totalExpense / 1000000));
    incomeSpots.add(ChartSpot(i.toDouble(), totalIncome / 1000000));
  }

  final expenseAverageSpots = [
    ChartSpot(0, 0),
    ChartSpot(days.toDouble(), totalExpense / 1000000),
  ];
  final incomeAverageSpots = [
    ChartSpot(0, 0),
    ChartSpot(days.toDouble(), totalIncome / 1000000),
  ];

  final bottomLabels = <double, String>{
    0: fmt(startDate),
    days.toDouble(): fmt(endDate),
  };
  final step = days ~/ 4;
  if (step > 0) {
    for (int k = 1; k <= 3; k++) {
      final x = (k * step).toDouble();
      bottomLabels[x] = fmt(startDate.add(Duration(days: k * step)));
    }
  }

  return ChartDataModel(
    totalExpense: totalExpense,
    totalIncome: totalIncome,
    expenseSpots: expenseSpots,
    incomeSpots: incomeSpots,
    expenseAverageSpots: expenseAverageSpots,
    incomeAverageSpots: incomeAverageSpots,
    labelStart: fmt(startDate),
    labelEnd: fmt(endDate),
    bottomLabels: bottomLabels,
  );
}
