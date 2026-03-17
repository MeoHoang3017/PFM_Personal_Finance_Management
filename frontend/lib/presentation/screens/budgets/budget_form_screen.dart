import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/budget_models.dart';
import '../../../data/models/category_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/budget_service.dart';
import '../../../data/services/category_service.dart';

class BudgetFormScreen extends StatefulWidget {
  final BudgetModel? budget;

  const BudgetFormScreen({super.key, this.budget});

  @override
  State<BudgetFormScreen> createState() => _BudgetFormScreenState();
}

class _BudgetFormScreenState extends State<BudgetFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  List<CategoryModel> _categories = [];
  CategoryModel? _selectedCategory;
  BudgetPeriod _period = BudgetPeriod.monthly;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  bool _isActive = true;
  bool _loading = false;
  bool _loadingData = true;
  String? _errorMessage;
  UserInfo? _user;

  @override
  void initState() {
    super.initState();
    if (widget.budget != null) {
      _amountController.text = widget.budget!.amount.toStringAsFixed(0);
      _period = widget.budget!.period;
      _startDate = widget.budget!.startDate;
      _endDate = widget.budget!.endDate;
      _isActive = widget.budget!.isActive;
    } else {
      final now = DateTime.now();
      _startDate = DateTime(now.year, now.month, 1);
      _endDate = DateTime(now.year, now.month + 1, 0);
    }
    _loadData();
  }

  Future<void> _loadData() async {
    final user = await getIt<AuthService>().getStoredUser();
    var catRes = await getIt<CategoryService>().getUserCategories();
    if (catRes.result == null || catRes.result!.isEmpty) {
      catRes = await getIt<CategoryService>().getCategories();
    }
    final cats = (catRes.result ?? []).where((c) => c.type == CategoryType.expense).toList();
    CategoryModel? sel;
    if (widget.budget != null && widget.budget!.category.isNotEmpty) {
      for (final c in cats) {
        if (c.id == widget.budget!.category) {
          sel = c;
          break;
        }
      }
    }
    if (sel == null && cats.isNotEmpty) sel = cats.first;
    if (!mounted) return;
    setState(() {
      _user = user;
      _categories = cats;
      _selectedCategory = sel;
      _loadingData = false;
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_user == null || _selectedCategory == null) {
      setState(() => _errorMessage = 'select_category_login'.tr());
      return;
    }
    final amount = double.tryParse(_amountController.text.replaceAll(',', '')) ?? 0;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<BudgetService>();
      if (widget.budget != null) {
        final res = await svc.updateBudget(
          widget.budget!.id,
          UpdateBudgetData(
            amount: amount,
            category: _selectedCategory!.id,
            period: _period,
            startDate: _startDate,
            endDate: _endDate,
            isActive: _isActive,
          ),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'budget_updated'.tr());
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createBudget(CreateBudgetData(
          amount: amount,
          category: _selectedCategory!.id,
          period: _period,
          startDate: _startDate,
          endDate: _endDate,
          user: _user!.id,
          isActive: _isActive,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'budget_added'.tr());
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'error_connection'.tr();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isEdit = widget.budget != null;
    if (_loadingData) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: AppBar(title: Text(isEdit ? 'edit_budget'.tr() : 'add_budget'.tr())),
        body: Center(child: CircularProgressIndicator(color: p.primaryAction)),
      );
    }
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(isEdit ? 'edit_budget'.tr() : 'add_budget'.tr()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: p.errorColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: p.errorColor.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: p.errorColor, size: 22),
                        const SizedBox(width: 10),
                        Expanded(child: Text(_errorMessage!, style: TextStyle(color: p.errorColor, fontSize: 14))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'amount'.tr(),
                    hintText: '0',
                    suffixText: '₫',
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'hint_amount'.tr();
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'invalid_number'.tr();
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<CategoryModel>(
                  value: _selectedCategory,
                  decoration: InputDecoration(
                    labelText: 'category'.tr(),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                  ),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                  onChanged: (c) => setState(() => _selectedCategory = c),
                  validator: (v) => v == null ? 'select_category'.tr() : null,
                ),
                const SizedBox(height: 20),
                SegmentedButton<BudgetPeriod>(
                  segments: [
                    ButtonSegment(value: BudgetPeriod.daily, label: Text('period_day'.tr())),
                    ButtonSegment(value: BudgetPeriod.weekly, label: Text('period_week'.tr())),
                    ButtonSegment(value: BudgetPeriod.monthly, label: Text('period_month'.tr())),
                    ButtonSegment(value: BudgetPeriod.yearly, label: Text('period_year'.tr())),
                  ],
                  selected: {_period},
                  onSelectionChanged: (s) => setState(() => _period = s.first),
                ),
                const SizedBox(height: 20),
                _dateTile(p, 'from_date'.tr(), _startDate, (d) => setState(() => _startDate = d), first: DateTime(2000), last: DateTime(2100)),
                const SizedBox(height: 8),
                _dateTile(p, 'to_date'.tr(), _endDate, (d) => setState(() => _endDate = d), first: _startDate, last: DateTime(2100)),
                const SizedBox(height: 8),
                SwitchListTile(
                  title: Text('is_active'.tr()),
                  value: _isActive,
                  onChanged: (v) => setState(() => _isActive = v),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _loading ? null : () { if (_formKey.currentState?.validate() ?? false) _save(); },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: p.primaryAction))
                      : Text(isEdit ? 'update'.tr() : 'add_budget_btn'.tr()),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _dateTile(PaletteColors p, String label, DateTime value, ValueChanged<DateTime> onDate, {required DateTime first, required DateTime last}) {
    return Material(
      color: p.cardSurface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () async {
          final d = await showDatePicker(context: context, initialDate: value, firstDate: first, lastDate: last);
          if (d != null) onDate(d);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(Icons.calendar_today_rounded, color: p.primaryAction, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: TextStyle(color: p.subtitleText, fontSize: 12)),
                    Text('${value.day}/${value.month}/${value.year}', style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: p.iconMuted),
            ],
          ),
        ),
      ),
    );
  }
}
