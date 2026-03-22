import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/category_icon.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/services/transaction_service.dart';
import '../../widgets/section_card.dart';

/// Danh sách giao dịch chi (expense) trong khoảng thời gian của ngân sách (trùng logic backend tính spent).
class BudgetDetailScreen extends StatefulWidget {
  final BudgetModel budget;

  const BudgetDetailScreen({super.key, required this.budget});

  @override
  State<BudgetDetailScreen> createState() => _BudgetDetailScreenState();
}

class _BudgetDetailScreenState extends State<BudgetDetailScreen> {
  List<TransactionModel> _items = [];
  bool _loading = true;
  String? _error;
  String get _summarySuffix => ' ${currencySymbolFromCode(widget.budget.currency)}';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await getIt<TransactionService>().getTransactions(
        page: 1,
        pageSize: 500,
        type: 'expense',
        category: widget.budget.category,
        startDate: widget.budget.startDate,
        endDate: widget.budget.endDate,
      );
      if (!mounted) return;
      if (res.isSuccess && res.result != null) {
        final list = List<TransactionModel>.from(res.result!.data);
        list.sort((a, b) => b.date.compareTo(a.date));
        setState(() {
          _items = list;
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _loading = false;
          _error = res.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = context.tr('error_load_data');
        });
      }
    }
  }

  String _periodRangeText(BuildContext context) {
    final locale = context.locale.toString();
    final fmt = DateFormat.yMd(locale);
    return context.tr(
      'budget_period_range',
      namedArgs: {
        'start': fmt.format(widget.budget.startDate),
        'end': fmt.format(widget.budget.endDate),
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final b = widget.budget;
    final title = b.categoryName?.isNotEmpty == true ? b.categoryName! : context.tr('budget_category_fallback');
    final spent = b.spentAmount ?? 0.0;
    final limit = b.amount;

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(title, style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: p.iconMuted), onPressed: _loading ? null : _load),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [p.primaryAction, p.expenseColor], begin: Alignment.centerLeft, end: Alignment.centerRight),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SectionCard(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.tr('budget_detail_expenses'), style: TextStyle(color: p.subtitleText, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(_periodRangeText(context), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(context.tr('budget_used'), style: TextStyle(color: p.subtitleText, fontSize: 13)),
                      Text(formatCurrency(spent, suffix: _summarySuffix), style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w800, fontSize: 18)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(context.tr('budget_limit_label'), style: TextStyle(color: p.subtitleText, fontSize: 13)),
                      Text(formatCurrency(limit, suffix: _summarySuffix), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w700, fontSize: 16)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(context.tr('budget_detail_transaction_list'), style: TextStyle(color: p.subtitleText, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(color: p.primaryAction))
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: p.errorColor)),
                              const SizedBox(height: 16),
                              FilledButton(onPressed: _load, child: Text(context.tr('retry'))),
                            ],
                          ),
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.receipt_long_outlined, size: 56, color: p.iconMuted),
                                  const SizedBox(height: 16),
                                  Text(
                                    context.tr('budget_no_expenses'),
                                    style: TextStyle(color: p.subtitleText, fontSize: 15),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                              itemCount: _items.length,
                              itemBuilder: (context, index) {
                                final t = _items[index];
                                final dateStr = '${t.date.day}/${t.date.month}/${t.date.year}';
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: SectionCard(
                                    margin: EdgeInsets.zero,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 40,
                                          height: 40,
                                          decoration: BoxDecoration(
                                            color: p.expenseColor.withValues(alpha: 0.12),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Icon(iconForTransaction(t), color: p.expenseColor, size: 20),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                t.description.isEmpty ? context.tr('no_description') : t.description,
                                                style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600, fontSize: 15),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 4),
                                              Text(dateStr, style: TextStyle(color: p.subtitleText, fontSize: 12)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          formatCurrency(t.amount, suffix: t.currencySuffix),
                                          style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w700, fontSize: 15),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
