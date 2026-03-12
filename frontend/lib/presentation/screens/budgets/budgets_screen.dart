import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/services/budget_service.dart';
import '../../widgets/section_card.dart';
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
        _error = 'Không tải được danh sách ngân sách';
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
        title: const Text('Xóa ngân sách'),
        content: const Text('Bạn có chắc muốn xóa ngân sách này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<BudgetService>().deleteBudget(b.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'Đã xóa ngân sách');
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _periodLabel(BudgetPeriod p) {
    switch (p) {
      case BudgetPeriod.daily:
        return 'Ngày';
      case BudgetPeriod.weekly:
        return 'Tuần';
      case BudgetPeriod.monthly:
        return 'Tháng';
      case BudgetPeriod.yearly:
        return 'Năm';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('Ngân sách', style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
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
                            Text(_error!, style: TextStyle(color: p.errorColor), textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            FilledButton(onPressed: _load, child: const Text('Thử lại')),
                          ],
                        ),
                      )
                    : _budgets.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.pie_chart_outline, size: 64, color: p.iconMuted),
                                const SizedBox(height: 16),
                                Text('Chưa có ngân sách', style: TextStyle(color: p.primaryText, fontSize: 16, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                FilledButton.icon(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Thêm ngân sách')),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              itemCount: _budgets.length,
                              itemBuilder: (context, index) {
                                final b = _budgets[index];
                                return SectionCard(
                                  padding: EdgeInsets.zero,
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    leading: CircleAvatar(
                                      radius: 22,
                                      backgroundColor: p.primaryAction.withValues(alpha: 0.2),
                                      child: Icon(Icons.pie_chart_outline, color: p.primaryAction, size: 20),
                                    ),
                                    title: Text('${b.amount.toStringAsFixed(0)} ₫', style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
                                    subtitle: Text('${_periodLabel(b.period)} · ${b.startDate.day}/${b.startDate.month} - ${b.endDate.day}/${b.endDate.month}', style: TextStyle(color: p.subtitleText, fontSize: 12)),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (!b.isActive) Padding(padding: const EdgeInsets.only(right: 8), child: Text('Tắt', style: TextStyle(color: p.subtitleText, fontSize: 12))),
                                        PopupMenuButton<String>(
                                          icon: Icon(Icons.more_vert, color: p.iconMuted),
                                          onSelected: (v) {
                                            if (v == 'edit') _openForm(b);
                                            if (v == 'delete') _confirmDelete(b);
                                          },
                                          itemBuilder: (ctx) => [const PopupMenuItem(value: 'edit', child: Text('Sửa')), const PopupMenuItem(value: 'delete', child: Text('Xóa'))],
                                        ),
                                      ],
                                    ),
                                    onTap: () => _openForm(b),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: _budgets.isNotEmpty ? FloatingActionButton(backgroundColor: p.primaryAction, onPressed: () => _openForm(), child: const Icon(Icons.add)) : null,
    );
  }
}
