import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/services/budget_service.dart';
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
      if (mounted) setState(() {
        _loading = false;
        _error = 'error_load_budgets'.tr();
      });
    }
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
        title: Text('delete_budget'.tr()),
        content: Text('delete_budget_confirm'.tr()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('cancel'.tr())),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text('delete'.tr()),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<BudgetService>().deleteBudget(b.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'budget_deleted'.tr());
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _periodLabel(BudgetPeriod p) {
    switch (p) {
      case BudgetPeriod.daily:
        return 'period_day'.tr();
      case BudgetPeriod.weekly:
        return 'period_week'.tr();
      case BudgetPeriod.monthly:
        return 'period_month'.tr();
      case BudgetPeriod.yearly:
        return 'period_year'.tr();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final overCount = _budgets.where((b) => b.isOverBudget == true).length;

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('budgets'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
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
                            FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: Text('retry'.tr())),
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
                                  Text('no_budgets'.tr(), style: TextStyle(color: p.primaryText, fontSize: 18, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 8),
                                  Text(
                                    'add_budget_subtitle'.tr(),
                                    style: TextStyle(color: p.subtitleText, fontSize: 14),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 24),
                                  FilledButton.icon(
                                    onPressed: () => _openForm(),
                                    icon: const Icon(Icons.add_rounded),
                                    label: Text('add_budget_btn'.tr()),
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
                                                'budget_over_limit'.tr() + ' ($overCount)',
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
                                        final categoryLabel = b.categoryName?.isNotEmpty == true ? b.categoryName! : b.category;
                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 12),
                                          child: Material(
                                            color: p.cardSurface,
                                            borderRadius: BorderRadius.circular(16),
                                            elevation: 0,
                                            shadowColor: Colors.black.withValues(alpha: 0.08),
                                            child: InkWell(
                                              onTap: () => _openForm(b),
                                              borderRadius: BorderRadius.circular(16),
                                              child: Padding(
                                                padding: const EdgeInsets.all(16),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Container(
                                                          width: 44,
                                                          height: 44,
                                                          decoration: BoxDecoration(
                                                            color: isOver ? p.expenseColor.withValues(alpha: 0.15) : p.primaryAction.withValues(alpha: 0.15),
                                                            borderRadius: BorderRadius.circular(12),
                                                          ),
                                                          child: Icon(
                                                            Icons.pie_chart_rounded,
                                                            color: isOver ? p.expenseColor : p.primaryAction,
                                                            size: 22,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 14),
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Text(
                                                                categoryLabel,
                                                                style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600, fontSize: 16),
                                                              ),
                                                              const SizedBox(height: 2),
                                                              Text(
                                                                '${_periodLabel(b.period)} · $periodStr',
                                                                style: TextStyle(color: p.subtitleText, fontSize: 12),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        if (!b.isActive)
                                                          Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                            decoration: BoxDecoration(
                                                              color: p.borderColor.withValues(alpha: 0.4),
                                                              borderRadius: BorderRadius.circular(8),
                                                            ),
                                                            child: Text('inactive'.tr(), style: TextStyle(color: p.subtitleText, fontSize: 11)),
                                                          ),
                                                        PopupMenuButton<String>(
                                                          icon: Icon(Icons.more_vert, color: p.iconMuted),
                                                          onSelected: (v) {
                                                            if (v == 'edit') _openForm(b);
                                                            if (v == 'delete') _confirmDelete(b);
                                                          },
                                                          itemBuilder: (ctx) => [
                                                            PopupMenuItem(value: 'edit', child: Text('edit'.tr())),
                                                            PopupMenuItem(value: 'delete', child: Text('delete'.tr())),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 14),
                                                    Row(
                                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                      children: [
                                                        Text(
                                                          '${'budget_used'.tr()}: ${formatCurrency(spent)}',
                                                          style: TextStyle(color: p.subtitleText, fontSize: 13),
                                                        ),
                                                        Text(
                                                          formatCurrency(limit),
                                                          style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w700, fontSize: 14),
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 8),
                                                    ClipRRect(
                                                      borderRadius: BorderRadius.circular(4),
                                                      child: LinearProgressIndicator(
                                                        value: progress > 1.0 ? 1.0 : progress,
                                                        minHeight: 8,
                                                        backgroundColor: p.borderColor.withValues(alpha: 0.4),
                                                        valueColor: AlwaysStoppedAnimation<Color>(isOver ? p.expenseColor : p.primaryAction),
                                                      ),
                                                    ),
                                                    if (isOver) ...[
                                                      const SizedBox(height: 10),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                                        decoration: BoxDecoration(
                                                          color: p.expenseColor.withValues(alpha: 0.12),
                                                          borderRadius: BorderRadius.circular(10),
                                                          border: Border.all(color: p.expenseColor.withValues(alpha: 0.4)),
                                                        ),
                                                        child: Row(
                                                          children: [
                                                            Icon(Icons.warning_amber_rounded, size: 20, color: p.expenseColor),
                                                            const SizedBox(width: 8),
                                                            Expanded(
                                                              child: Text(
                                                                'budget_over_limit'.tr(),
                                                                style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w600, fontSize: 13),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
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
              label: Text('add_budget_btn'.tr()),
            )
          : null,
    );
  }
}
