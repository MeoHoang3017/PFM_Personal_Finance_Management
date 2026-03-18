import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/chart_data.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/transaction_models.dart';

/// Biểu đồ thu/chi kiểu FinTracker: tab Chi | Thu, chọn 1 tháng / 3 tháng, line chart tích lũy.
class HomeSpendingChart extends StatefulWidget {
  final List<TransactionModel> transactions;

  const HomeSpendingChart({super.key, required this.transactions});

  @override
  State<HomeSpendingChart> createState() => _HomeSpendingChartState();
}

class _HomeSpendingChartState extends State<HomeSpendingChart> {
  int _selectedTab = 0; // 0 = Chi, 1 = Thu
  int _periodDays = 30; // 30 hoặc 90

  ChartDataModel get _chartData =>
      buildChartDataFromTransactions(widget.transactions, days: _periodDays);

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final chartData = _chartData;
    final isExpense = _selectedTab == 0;
    final spots = isExpense
        ? chartData.expenseSpots.map((s) => FlSpot(s.x, s.y)).toList()
        : chartData.incomeSpots.map((s) => FlSpot(s.x, s.y)).toList();
    final averageSpots = isExpense
        ? chartData.expenseAverageSpots.map((s) => FlSpot(s.x, s.y)).toList()
        : chartData.incomeAverageSpots.map((s) => FlSpot(s.x, s.y)).toList();
    final totalValue = isExpense ? chartData.totalExpense : chartData.totalIncome;
    final lineColor = isExpense ? p.expenseColor : p.incomeColor;
    final label = isExpense ? 'Tổng chi' : 'Tổng thu';
    final suffix = widget.transactions.isNotEmpty ? widget.transactions.first.currencySuffix : ' ₫';

    final allY = spots.map((s) => s.y).toList();
    final double dataMaxY = allY.isEmpty ? 1.0 : allY.reduce((a, b) => a > b ? a : b);
    const double minY = 0;
    final double maxY = dataMaxY <= 0 ? 1.0 : (dataMaxY * 1.25 + 0.2);

    final hasData = widget.transactions.isNotEmpty;
    final gridColor = p.borderColor.withValues(alpha: 0.3);
    final avgLineColor = p.primaryText.withValues(alpha: 0.25);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedTab = 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedTab == 0
                        ? p.expenseColor.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Chi',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedTab == 0 ? p.expenseColor : p.subtitleText,
                      fontWeight: _selectedTab == 0 ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedTab = 1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedTab == 1
                        ? p.incomeColor.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Thu',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _selectedTab == 1 ? p.incomeColor : p.subtitleText,
                      fontWeight: _selectedTab == 1 ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          '$label: ${formatCurrency(totalValue, suffix: suffix, compact: true)}',
          style: TextStyle(color: lineColor, fontSize: 17, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 180,
          child: LineChart(
            LineChartData(
              minX: 0,
              maxX: _periodDays.toDouble(),
              minY: minY,
              maxY: maxY,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(color: gridColor, strokeWidth: 1),
              ),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: (maxY - minY) / 4,
                    getTitlesWidget: (value, meta) {
                      if (value >= minY && value <= maxY) {
                        final text = value == value.truncateToDouble()
                            ? '${value.toInt()}'
                            : value.toStringAsFixed(1);
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Text(
                            text,
                            style: TextStyle(color: p.subtitleText, fontSize: 10),
                          ),
                        );
                      }
                      return const SizedBox();
                    },
                    reservedSize: 28,
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final labels = chartData.bottomLabels;
                      if (labels != null && labels.containsKey(value)) {
                        return Text(
                          labels[value]!,
                          style: TextStyle(color: p.subtitleText, fontSize: 10),
                        );
                      }
                      return const SizedBox();
                    },
                    reservedSize: 24,
                  ),
                ),
                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  color: lineColor,
                  barWidth: 2.5,
                  dotData: FlDotData(
                    show: true,
                    getDotPainter: (spot, percent, barData, index) {
                      return FlDotCirclePainter(
                        radius: 3,
                        color: lineColor,
                        strokeWidth: 1,
                        strokeColor: lineColor.withValues(alpha: 0.5),
                      );
                    },
                  ),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        lineColor.withValues(alpha: 0.2),
                        lineColor.withValues(alpha: 0.02),
                      ],
                    ),
                  ),
                ),
                LineChartBarData(
                  spots: averageSpots,
                  isCurved: false,
                  color: avgLineColor,
                  barWidth: 2,
                  dashArray: const [5, 5],
                  dotData: FlDotData(show: false),
                ),
              ],
            ),
          ),
        ),
        if (hasData) ...[
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _PeriodChip(
                  label: '1 tháng',
                  selected: _periodDays == 30,
                  onTap: () => setState(() => _periodDays = 30),
                  p: p,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _PeriodChip(
                  label: '3 tháng',
                  selected: _periodDays == 90,
                  onTap: () => setState(() => _periodDays = 90),
                  p: p,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final PaletteColors p;

  const _PeriodChip({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.p,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? p.primaryAction.withValues(alpha: 0.15)
                : p.borderColor.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? p.primaryAction : p.borderColor.withValues(alpha: 0.5),
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? p.primaryAction : p.subtitleText,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
