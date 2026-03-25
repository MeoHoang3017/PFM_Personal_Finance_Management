import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/category_spending.dart';
import '../../../core/utils/currency_format.dart';
import '../../../core/utils/monthly_report_helper.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/services/transaction_service.dart';
import '../../widgets/detail_screen_app_bar.dart';
import '../../widgets/home_transaction_item.dart';

/// Màn xem chi tiết chi tiêu theo tháng: tab 12 tháng, mỗi tháng hiện các category và giao dịch (expandable).
/// Dữ liệu giao dịch luôn lấy từ backend khi mở màn hình.
class TopSpendingDetailScreen extends StatefulWidget {
  const TopSpendingDetailScreen({super.key});

  @override
  State<TopSpendingDetailScreen> createState() => _TopSpendingDetailScreenState();
}

class _TopSpendingDetailScreenState extends State<TopSpendingDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<DateTime> _months;
  List<CategorySpendingResult> _monthlyResults = [];
  List<TransactionModel> _transactions = [];
  bool _loading = true;
  String? _error;
  final Set<String> _expandedCategoryKeys = {};

  bool _isExpanded(int monthIndex, String categoryName) {
    return _expandedCategoryKeys.contains('${monthIndex}_$categoryName');
  }

  void _toggleExpanded(int monthIndex, String categoryName) {
    setState(() {
      final key = '${monthIndex}_$categoryName';
      if (_expandedCategoryKeys.contains(key)) {
        _expandedCategoryKeys.remove(key);
      } else {
        _expandedCategoryKeys.add(key);
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _months = last12MonthsFromNow();
    _tabController = TabController(length: _months.length, vsync: this);
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
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);
        _monthlyResults = _months
            .map((d) => buildCategorySpendingFromTransactions(
                  _transactions,
                  periodMonth: d.month,
                  periodYear: d.year,
                  // Tháng hiện tại: chỉ từ đầu tháng đến hôm nay (giống tab Tháng ở Top Spending trên dashboard).
                  upToDate: (d.month == now.month && d.year == now.year) ? today : null,
                ))
            .toList();
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

    if (_loading) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: DetailScreenAppBar(title: 'Chi tiêu theo tháng', onBack: _goBack),
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
        appBar: DetailScreenAppBar(title: 'Chi tiêu theo tháng', onBack: _goBack),
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
        title: 'Chi tiêu theo tháng',
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
          tabs: _months
              .map((d) => Tab(
                    text: 'T${d.month}/${d.year.toString().substring(2)}',
                  ))
              .toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: List.generate(
          _monthlyResults.length,
          (i) => _buildMonthContent(context, i, _monthlyResults[i]),
        ),
      ),
    );
  }

  Widget _buildMonthContent(
    BuildContext context,
    int monthIndex,
    CategorySpendingResult result,
  ) {
    final p = pfmPaletteOf(context);
    final shadow = pfmShadowColorOf(context);

    if (result.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.pie_chart_outline, size: 56, color: p.iconMuted),
              const SizedBox(height: 16),
              Text(
                'Không có chi tiêu trong tháng này',
                style: TextStyle(color: p.subtitleText, fontSize: 15),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      itemCount: result.items.length,
      itemBuilder: (context, index) {
        final item = result.items[index];
        final raw = result.categoryTransactions[item.categoryName] ?? [];
        final transactions = transactionsSortedByDateDescending(raw);
        final isExpanded = _isExpanded(monthIndex, item.categoryName);

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
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
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _toggleExpanded(monthIndex, item.categoryName),
                  child: Container(
                    decoration: BoxDecoration(
                      color: p.sectionContentBg,
                      borderRadius: BorderRadius.vertical(
                        top: const Radius.circular(16),
                        bottom: Radius.circular(isExpanded ? 0 : 16),
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: item.color.withValues(alpha: 0.2),
                          child: Icon(item.icon, color: item.color, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.categoryName,
                                style: TextStyle(
                                  color: p.primaryText,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (item.percentage > 0)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    '${formatPercentageDisplay(item.percentage)} · ${item.amountFormatted}',
                                    style: TextStyle(color: p.subtitleText, fontSize: 13),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Text(
                          item.amountFormatted,
                          style: TextStyle(
                            color: p.expenseColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 8),
                        AnimatedRotation(
                          turns: isExpanded ? 0.5 : 0,
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            Icons.keyboard_arrow_down,
                            color: p.subtitleText,
                            size: 24,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              AnimatedCrossFade(
                firstChild: const SizedBox.shrink(),
                secondChild: Container(
                  decoration: BoxDecoration(
                    color: p.sectionContentBg,
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Divider(height: 1, color: p.borderColor.withValues(alpha: 0.8)),
                      ...transactions.map(
                        (t) => HomeTransactionItem(transaction: t),
                      ),
                    ],
                  ),
                ),
                crossFadeState:
                    isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                duration: const Duration(milliseconds: 200),
              ),
            ],
          ),
        );
      },
    );
  }
}
