import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/currency_format.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/goal_models.dart';
import '../../../data/services/goal_service.dart';
import '../../widgets/section_card.dart';
import 'goal_form_screen.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  List<GoalModel> _goals = [];
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
      final res = await getIt<GoalService>().getGoals();
      if (!mounted) return;
      setState(() {
        _goals = res.isSuccess && res.result != null ? res.result!.data : [];
        _loading = false;
        _error = res.isSuccess ? null : res.message;
      });
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _error = 'error_load_goals'.tr();
      });
    }
  }

  Future<void> _openForm([GoalModel? goal]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => GoalFormScreen(goal: goal),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _confirmDelete(GoalModel g) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_goal'.tr()),
        content: Text('delete_goal_confirm'.tr(namedArgs: {'title': g.title})),
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
    final res = await getIt<GoalService>().deleteGoal(g.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'goal_deleted'.tr());
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('goals_screen'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
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
                            FilledButton(onPressed: _load, child: Text('retry'.tr())),
                          ],
                        ),
                      )
                    : _goals.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.flag_outlined, size: 64, color: p.iconMuted),
                                const SizedBox(height: 16),
                                Text('Chưa có mục tiêu', style: TextStyle(color: p.primaryText, fontSize: 16, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                FilledButton.icon(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Thêm mục tiêu')),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              itemCount: _goals.length,
                              itemBuilder: (context, index) {
                                final g = _goals[index];
                                return SectionCard(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(g.title, style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600, fontSize: 15)),
                                          ),
                                          PopupMenuButton<String>(
                                            icon: Icon(Icons.more_vert, color: p.iconMuted),
                                            onSelected: (v) {
                                              if (v == 'edit') _openForm(g);
                                              if (v == 'delete') _confirmDelete(g);
                                            },
                                            itemBuilder: (ctx) => [
                                              PopupMenuItem(value: 'edit', child: Text('edit'.tr())),
                                              PopupMenuItem(value: 'delete', child: Text('delete'.tr())),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      LinearProgressIndicator(
                                        value: g.progress,
                                        backgroundColor: p.borderColor,
                                        valueColor: AlwaysStoppedAnimation<Color>(p.primaryAction),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)} · ${'goal_due'.tr()} ${g.dueDate.day}/${g.dueDate.month}/${g.dueDate.year}',
                                        style: TextStyle(color: p.subtitleText, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: _goals.isNotEmpty ? FloatingActionButton(backgroundColor: p.primaryAction, onPressed: () => _openForm(), child: const Icon(Icons.add)) : null,
    );
  }
}
