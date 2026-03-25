import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/category_icon.dart';
import '../../../core/utils/currency_format.dart';
import '../../../core/utils/monthly_report_helper.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/services/transaction_service.dart';
import '../../widgets/detail_screen_app_bar.dart';
import '../../widgets/home_transaction_item.dart';
import '../transactions/transaction_form_screen.dart';

/// Màn xem báo cáo chi tiết theo tháng: tab 12 tháng, mỗi tháng có tổng thu/chi và danh sách giao dịch.
/// Dữ liệu giao dịch luôn lấy từ backend khi mở màn hình.
class ReportDetailScreen extends StatefulWidget {
  const ReportDetailScreen({super.key});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<MonthReportData> _report = [];
  List<TransactionModel> _transactions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 12, vsync: this);
    _loadFromBackend();
  }

  Future<void> _loadFromBackend() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await getIt<TransactionService>().getTransactions(
        page: 1,
        pageSize: 500,
      );
      if (!mounted) return;
      if (res.isSuccess && res.result != null) {
        _transactions = res.result!.data;
        _report = buildMonthlyReport(_transactions);
      } else {
        _error = res.message.isNotEmpty ? res.message : 'Không tải được giao dịch';
      }
    } catch (_) {
      if (mounted) _error = 'Không tải được dữ liệu';
    }
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _goBack() => Navigator.maybePop(context);

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final shadow = pfmShadowColorOf(context);

    if (_loading) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: DetailScreenAppBar(title: 'Báo cáo chi tiết', onBack: _goBack),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: p.primaryAction),
              const SizedBox(height: 16),
              Text('Đang tải...', style: TextStyle(color: p.subtitleText)),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: DetailScreenAppBar(title: 'Báo cáo chi tiết', onBack: _goBack),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: p.errorColor),
                const SizedBox(height: 16),
                Text(_error!, style: TextStyle(color: p.errorColor), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(onPressed: _loadFromBackend, child: const Text('Thử lại')),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: DetailScreenAppBar(
        title: 'Báo cáo chi tiết',
        onBack: _goBack,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: p.primaryAction,
          unselectedLabelColor: p.subtitleText,
          indicatorColor: p.primaryAction,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          tabs: _report
              .map((m) => Tab(
                    text: 'T${m.month}/${m.year.toString().substring(2)}',
                  ))
              .toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _report
            .map((monthData) => _buildMonthContent(context, monthData, shadow))
            .toList(),
      ),
    );
  }

  Widget _buildMonthContent(
    BuildContext context,
    MonthReportData monthData,
    Color shadow,
  ) {
    final p = pfmPaletteOf(context);
    final sorted = transactionsSortedByDateDescending(monthData.transactions);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: _IncomeExpenseCard(
                  isIncome: true,
                  label: 'Tổng thu',
                  value: formatCurrencyAggregates(
                    monthData.totalIncome,
                    suffix: _transactions.isNotEmpty ? _transactions.first.currencySuffix : null,
                  ),
                  palette: p,
                  shadow: shadow,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _IncomeExpenseCard(
                  isIncome: false,
                  label: 'Tổng chi',
                  value: formatCurrencyAggregates(
                    monthData.totalExpense,
                    suffix: _transactions.isNotEmpty ? _transactions.first.currencySuffix : null,
                  ),
                  palette: p,
                  shadow: shadow,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 10),
            child: Text(
              'Giao dịch trong tháng',
              style: TextStyle(
                color: p.subtitleText,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ),
          if (monthData.transactions.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
              decoration: BoxDecoration(
                color: p.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: p.borderColor.withValues(alpha: 0.5)),
              ),
              child: Column(
                children: [
                  Icon(Icons.receipt_long_outlined, size: 48, color: p.iconMuted),
                  const SizedBox(height: 16),
                  Text(
                    'Không có giao dịch trong tháng này',
                    style: TextStyle(color: p.subtitleText, fontSize: 15),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: p.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: p.borderColor.withValues(alpha: 0.5)),
                boxShadow: [
                  BoxShadow(color: shadow, blurRadius: 8, offset: const Offset(0, 2)),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (int i = 0; i < sorted.length; i++) ...[
                    HomeTransactionItem(
                      transaction: sorted[i],
                      onTap: () => _onTransactionTap(context, sorted[i]),
                    ),
                    if (i < sorted.length - 1)
                      Divider(
                        height: 1,
                        indent: 72,
                        endIndent: 16,
                        color: p.borderColor.withValues(alpha: 0.6),
                      ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _onTransactionTap(BuildContext context, TransactionModel transaction) {
    showModalBottomSheet(
      context: context,
      backgroundColor: pfmPaletteOf(context).cardSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _TransactionDetailSheet(transaction: transaction),
    );
  }
}

class _IncomeExpenseCard extends StatelessWidget {
  final bool isIncome;
  final String label;
  final String value;
  final PaletteColors palette;
  final Color shadow;

  const _IncomeExpenseCard({
    required this.isIncome,
    required this.label,
    required this.value,
    required this.palette,
    required this.shadow,
  });

  @override
  Widget build(BuildContext context) {
    final color = isIncome ? palette.incomeColor : palette.expenseColor;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: palette.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(color: shadow, blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isIncome ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                  size: 20,
                  color: color,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  color: palette.subtitleText,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 17,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _TransactionDetailSheet extends StatelessWidget {
  final TransactionModel transaction;

  const _TransactionDetailSheet({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isIncome = transaction.type == TransactionType.income;
    final isExchange = transaction.type == TransactionType.exchange;
    final color = isIncome ? p.incomeColor : isExchange ? p.primaryAction : p.expenseColor;
    final dateStr =
        '${transaction.date.day}/${transaction.date.month}/${transaction.date.year}';

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: p.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: color.withValues(alpha: 0.2),
                  child: Icon(
                    iconForTransaction(transaction),
                    color: color,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transaction.description.isEmpty
                            ? (isIncome ? 'Thu nhập' : isExchange ? 'Chuyển ví' : 'Chi tiêu')
                            : transaction.description,
                        style: TextStyle(
                          color: p.primaryText,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dateStr,
                        style: TextStyle(color: p.subtitleText, fontSize: 14),
                      ),
                      if (transaction.categoryDisplay.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            transaction.categoryDisplay,
                            style: TextStyle(color: p.subtitleText, fontSize: 12),
                          ),
                        ),
                    ],
                  ),
                ),
                Text(
                  formatCurrencyRows(transaction.amount, suffix: transaction.currencySuffix),
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TransactionFormScreen(
                      transaction: transaction,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.edit_outlined, size: 18),
              label: const Text('Chỉnh sửa giao dịch'),
            ),
          ],
        ),
      ),
    );
  }
}
