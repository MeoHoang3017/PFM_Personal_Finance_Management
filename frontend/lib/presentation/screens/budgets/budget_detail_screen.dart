import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/category_icon.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/services/transaction_service.dart';
import '../../widgets/budget_actual_limit_text.dart';
import '../../widgets/budget_category_leading.dart';
import '../../widgets/detail_screen_app_bar.dart';
import '../../widgets/section_card.dart';
import '../../widgets/section_header.dart';

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
  String get _summarySuffix => widget.budget.currencySuffix;

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
    final progress = limit > 0 ? (spent / limit) : 0.0;
    final cardPercentLabel =
        limit > 0 ? formatPercentageDisplay(spent / limit * 100) : '—';
    final isOver = limit > 0 && spent > limit;
    final categoryLabel = title;

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: DetailScreenAppBar(
        title: title,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: p.iconMuted),
            tooltip: MaterialLocalizations.of(context).refreshIndicatorSemanticLabel,
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [p.primaryAction, p.expenseColor],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SectionCard(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      BudgetCategoryLeading(
                        size: 44,
                        categoryName: categoryLabel,
                        iconKey: b.categoryIcon,
                        colorHex: b.categoryColor,
                        accentWhenNoColor: budgetLeadingAccent(p, spent, limit),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.tr('budget_detail_expenses'),
                              style: TextStyle(color: p.subtitleText, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _periodRangeText(context),
                              style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600, fontSize: 14, height: 1.25),
                            ),
                            if (!b.isActive) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: p.borderColor.withValues(alpha: 0.45),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  context.tr('inactive'),
                                  style: TextStyle(color: p.subtitleText, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Chi tiết: một dòng đã chi / hạn mức, số đầy đủ (không thu gọn K/M).
                  BudgetActualLimitText(
                    spent: spent,
                    limit: limit,
                    suffix: _summarySuffix,
                    compact: false,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    textAlign: TextAlign.center,
                  ),
                  if (limit > 0) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress > 1.0 ? 1.0 : progress,
                        minHeight: 8,
                        backgroundColor: p.borderColor.withValues(alpha: 0.35),
                        valueColor: AlwaysStoppedAnimation<Color>(budgetSpentVsLimitAccent(p, spent, limit)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          context.tr('budget_used'),
                          style: TextStyle(color: p.subtitleText, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          cardPercentLabel,
                          style: TextStyle(
                            color: budgetSpentVsLimitAccent(p, spent, limit),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (isOver) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 18, color: p.expenseColor),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            context.tr('budget_over_limit'),
                            style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          SectionHeader(title: context.tr('budget_detail_transaction_list')),
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
                              Icon(Icons.error_outline_rounded, size: 48, color: p.errorColor.withValues(alpha: 0.85)),
                              const SizedBox(height: 16),
                              Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: p.errorColor, fontSize: 15)),
                              const SizedBox(height: 20),
                              FilledButton.icon(
                                onPressed: _load,
                                icon: const Icon(Icons.refresh_rounded, size: 20),
                                label: Text(context.tr('retry')),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: SectionCard(
                                margin: EdgeInsets.zero,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.receipt_long_outlined, size: 52, color: p.iconMuted),
                                    const SizedBox(height: 16),
                                    Text(
                                      context.tr('budget_no_expenses'),
                                      style: TextStyle(color: p.subtitleText, fontSize: 15, height: 1.4),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                              itemCount: _items.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final t = _items[index];
                                final dateStr = '${t.date.day}/${t.date.month}/${t.date.year}';
                                final linePctLabel =
                                    limit > 0 ? formatPercentageDisplay(t.amount / limit * 100) : '—';
                                return SectionCard(
                                  margin: EdgeInsets.zero,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: LayoutBuilder(
                                    builder: (context, cardConstraints) {
                                      const iconGap = 44.0 + 14.0;
                                      final reserved = iconGap + 8.0;
                                      final remaining =
                                          (cardConstraints.maxWidth - reserved).clamp(120.0, cardConstraints.maxWidth);
                                      final pctColMax = (remaining * 0.28).clamp(56.0, 120.0);
                                      return Column(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                width: 44,
                                                height: 44,
                                                decoration: BoxDecoration(
                                                  color: p.expenseColor.withValues(alpha: 0.12),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Icon(iconForTransaction(t), color: p.expenseColor, size: 22),
                                              ),
                                              const SizedBox(width: 14),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  mainAxisSize: MainAxisSize.min,
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
                                              SizedBox(
                                                width: pctColMax,
                                                child: Text(
                                                  linePctLabel,
                                                  style: TextStyle(
                                                    color: p.subtitleText,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                    height: 1.1,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  textAlign: TextAlign.end,
                                                ),
                                              ),
                                            ],
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.only(left: iconGap, top: 0),
                                            child: Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(
                                                formatCurrencyRows(t.amount, suffix: t.currencySuffix),
                                                style: TextStyle(
                                                  color: p.expenseColor,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                  height: 1.2,
                                                ),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                textAlign: TextAlign.end,
                                              ),
                                            ),
                                          ),
                                        ],
                                      );
                                    },
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
