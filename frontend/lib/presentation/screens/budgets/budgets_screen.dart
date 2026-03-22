import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/services/budget_service.dart';
import '../../widgets/budget_category_leading.dart';
import 'budget_detail_screen.dart';
import 'budget_form_screen.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  List<BudgetModel> _budgets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void refresh() => _load();

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await getIt<BudgetService>().getBudgets();
      if (!mounted) return;
      setState(() {
        _budgets = res.isSuccess && res.result != null ? res.result!.data : [];
        _loading = false;
        _error = res.isSuccess ? null : res.message;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = context.tr('error_load_budgets');
        });
      }
    }
  }

  Future<void> _openDetail(BudgetModel budget) async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (context) => BudgetDetailScreen(budget: budget),
      ),
    );
  }

  Future<void> _openForm([BudgetModel? budget]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => BudgetFormScreen(budget: budget),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _confirmDelete(BudgetModel b) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(ctx.tr('delete_budget')),
        content: Text(ctx.tr('delete_budget_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(ctx.tr('cancel'))),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text(ctx.tr('delete')),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<BudgetService>().deleteBudget(b.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, context.tr('budget_deleted'));
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _periodLabel(BuildContext context, BudgetPeriod p) {
    switch (p) {
      case BudgetPeriod.weekly:
        return context.tr('period_week');
      case BudgetPeriod.monthly:
        return context.tr('period_month');
      case BudgetPeriod.yearly:
        return context.tr('period_year');
      case BudgetPeriod.custom:
        return context.tr('period_custom');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final overCount = _budgets.where((b) => b.isOverBudget == true).length;

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(context.tr('budgets'), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: p.iconMuted), onPressed: _loading ? null : _load),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [p.primaryAction, p.expenseColor], begin: Alignment.centerLeft, end: Alignment.centerRight),
            ),
          ),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(color: p.primaryAction))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 48, color: p.iconMuted),
                            const SizedBox(height: 16),
                            Text(_error!, style: TextStyle(color: p.errorColor), textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: Text(context.tr('retry'))),
                          ],
                        ),
                      )
                    : _budgets.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: p.cardSurface,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
                                    ),
                                    child: Icon(Icons.pie_chart_outline_rounded, size: 72, color: p.primaryAction.withValues(alpha: 0.6)),
                                  ),
                                  const SizedBox(height: 24),
                                  Text(context.tr('no_budgets'), style: TextStyle(color: p.primaryText, fontSize: 18, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 8),
                                  Text(
                                    context.tr('add_budget_subtitle'),
                                    style: TextStyle(color: p.subtitleText, fontSize: 14),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 24),
                                  FilledButton.icon(
                                    onPressed: () => _openForm(),
                                    icon: const Icon(Icons.add_rounded),
                                    label: Text(context.tr('add_budget_btn')),
                                    style: FilledButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: CustomScrollView(
                              slivers: [
                                if (overCount > 0)
                                  SliverToBoxAdapter(
                                    child: Padding(
                                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: p.expenseColor.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: p.expenseColor.withValues(alpha: 0.3)),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(Icons.warning_amber_rounded, color: p.expenseColor, size: 22),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                context.tr('budget_over_limit_banner', namedArgs: {'count': '$overCount'}),
                                                style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w600, fontSize: 13),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                SliverPadding(
                                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                  sliver: SliverList(
                                    delegate: SliverChildBuilderDelegate(
                                      (context, index) {
                                        final b = _budgets[index];
                                        final spent = b.spentAmount ?? 0.0;
                                        final limit = b.amount;
                                        final isOver = b.isOverBudget == true;
                                        final progress = limit > 0 ? (spent / limit).clamp(0.0, 1.0) : 0.0;
                                        final periodStr = '${b.startDate.day}/${b.startDate.month} – ${b.endDate.day}/${b.endDate.month}';
                                        final categoryLabel = b.categoryName?.isNotEmpty == true ? b.categoryName! : context.tr('budget_category_fallback');
                                        final suffix = ' ${currencySymbolFromCode(b.currency)}';
                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 10),
                                          child: Material(
                                            color: p.cardSurface,
                                            borderRadius: BorderRadius.circular(14),
                                            elevation: 0,
                                            shadowColor: Colors.black.withValues(alpha: 0.08),
                                            child: InkWell(
                                              onTap: () => _openDetail(b),
                                              borderRadius: BorderRadius.circular(14),
                                              child: Padding(
                                                padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        BudgetCategoryLeading(
                                                          size: 42,
                                                          categoryName: categoryLabel,
                                                          iconKey: b.categoryIcon,
                                                          colorHex: b.categoryColor,
                                                          accentWhenNoColor: isOver ? p.expenseColor : p.primaryAction,
                                                        ),
                                                        const SizedBox(width: 12),
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Text(
                                                                categoryLabel,
                                                                style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w800, fontSize: 17, height: 1.15),
                                                                maxLines: 2,
                                                                overflow: TextOverflow.ellipsis,
                                                              ),
                                                              const SizedBox(height: 4),
                                                              Text(
                                                                '${_periodLabel(context, b.period)} · $periodStr · ${b.currency}',
                                                                style: TextStyle(color: p.subtitleText, fontSize: 11, fontWeight: FontWeight.w500),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        if (!b.isActive)
                                                          Padding(
                                                            padding: const EdgeInsets.only(right: 4),
                                                            child: Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                              decoration: BoxDecoration(
                                                                color: p.borderColor.withValues(alpha: 0.4),
                                                                borderRadius: BorderRadius.circular(8),
                                                              ),
                                                              child: Text(context.tr('inactive'), style: TextStyle(color: p.subtitleText, fontSize: 10)),
                                                            ),
                                                          ),
                                                        PopupMenuButton<String>(
                                                          icon: Icon(Icons.more_vert, color: p.iconMuted, size: 22),
                                                          padding: EdgeInsets.zero,
                                                          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                                          onSelected: (v) {
                                                            if (v == 'edit') _openForm(b);
                                                            if (v == 'delete') _confirmDelete(b);
                                                          },
                                                          itemBuilder: (ctx) => [
                                                            PopupMenuItem(value: 'edit', child: Text(ctx.tr('edit'))),
                                                            PopupMenuItem(value: 'delete', child: Text(ctx.tr('delete'))),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 10),
                                                    Row(
                                                      crossAxisAlignment: CrossAxisAlignment.end,
                                                      children: [
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Text(
                                                                context.tr('budget_used'),
                                                                style: TextStyle(color: p.subtitleText, fontSize: 11, fontWeight: FontWeight.w500),
                                                              ),
                                                              const SizedBox(height: 2),
                                                              Text(
                                                                formatCurrency(spent, suffix: suffix, compact: true),
                                                                style: TextStyle(
                                                                  color: p.expenseColor,
                                                                  fontWeight: FontWeight.w800,
                                                                  fontSize: 20,
                                                                  letterSpacing: -0.3,
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Column(
                                                          crossAxisAlignment: CrossAxisAlignment.end,
                                                          children: [
                                                            Text(
                                                              context.tr('budget_limit_label'),
                                                              style: TextStyle(color: p.subtitleText, fontSize: 11, fontWeight: FontWeight.w500),
                                                            ),
                                                            const SizedBox(height: 2),
                                                            Text(
                                                              formatCurrency(limit, suffix: suffix, compact: true),
                                                              style: TextStyle(
                                                                color: p.primaryText,
                                                                fontWeight: FontWeight.w700,
                                                                fontSize: 16,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 8),
                                                    ClipRRect(
                                                      borderRadius: BorderRadius.circular(4),
                                                      child: LinearProgressIndicator(
                                                        value: progress > 1.0 ? 1.0 : progress,
                                                        minHeight: 6,
                                                        backgroundColor: p.borderColor.withValues(alpha: 0.35),
                                                        valueColor: AlwaysStoppedAnimation<Color>(isOver ? p.expenseColor : p.primaryAction),
                                                      ),
                                                    ),
                                                    if (isOver) ...[
                                                      const SizedBox(height: 8),
                                                      Row(
                                                        children: [
                                                          Icon(Icons.warning_amber_rounded, size: 16, color: p.expenseColor),
                                                          const SizedBox(width: 6),
                                                          Expanded(
                                                            child: Text(
                                                              context.tr('budget_over_limit'),
                                                              style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w700, fontSize: 12),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        );
                                      },
                                      childCount: _budgets.length,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: _budgets.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => _openForm(),
              backgroundColor: p.primaryAction,
              icon: const Icon(Icons.add_rounded),
              label: Text(context.tr('add_budget_btn')),
            )
          : null,
    );
  }
}
