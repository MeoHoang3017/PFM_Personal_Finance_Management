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
  static const List<String> _kCurrencies = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'THB'];

  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  String _currency = 'VND';
  List<CategoryModel> _categories = [];
  CategoryModel? _selectedCategory;
  BudgetPeriod _period = BudgetPeriod.monthly;
  DateTime _customStart = DateTime.now();
  DateTime _customEnd = DateTime.now();
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
      _currency = widget.budget!.currency;
      _period = widget.budget!.period;
      _isActive = widget.budget!.isActive;
      if (_period == BudgetPeriod.custom) {
        _customStart = widget.budget!.startDate;
        _customEnd = widget.budget!.endDate;
      }
    } else {
      final now = DateTime.now();
      _customStart = DateTime(now.year, now.month, 1);
      _customEnd = DateTime(now.year, now.month + 1, 0);
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
      if (widget.budget == null && user != null) {
        final u = user.currency.toUpperCase();
        if (_kCurrencies.contains(u)) {
          _currency = u;
        }
      }
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
      setState(() => _errorMessage = context.tr('select_category_login'));
      return;
    }
    if (_period == BudgetPeriod.custom && (_customStart.isAfter(_customEnd) || _customStart.isAtSameMomentAs(_customEnd))) {
      setState(() => _errorMessage = context.tr('budget_custom_dates_invalid'));
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
            currency: _currency,
            startDate: _period == BudgetPeriod.custom ? _customStart : null,
            endDate: _period == BudgetPeriod.custom ? _customEnd : null,
            isActive: _isActive,
          ),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          AppToast.showSuccess(context, context.tr('budget_updated'));
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createBudget(CreateBudgetData(
          amount: amount,
          category: _selectedCategory!.id,
          period: _period,
          currency: _currency,
          startDate: _period == BudgetPeriod.custom ? _customStart : null,
          endDate: _period == BudgetPeriod.custom ? _customEnd : null,
          user: _user!.id,
          isActive: _isActive,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          AppToast.showSuccess(context, context.tr('budget_added'));
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = context.tr('error_connection');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isEdit = widget.budget != null;
    if (_loadingData) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: AppBar(title: Text(isEdit ? context.tr('edit_budget') : context.tr('add_budget'))),
        body: Center(child: CircularProgressIndicator(color: p.primaryAction)),
      );
    }
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(isEdit ? context.tr('edit_budget') : context.tr('add_budget')),
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
                    labelText: context.tr('amount'),
                    hintText: '0',
                    suffixText: currencySymbolFromCode(_currency),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return context.tr('hint_amount');
                    if (double.tryParse(v.replaceAll(',', '')) == null) return context.tr('invalid_number');
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                Text(
                  context.tr('budget_amount_in_budget_currency'),
                  style: TextStyle(color: p.subtitleText, fontSize: 12),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _currency,
                  decoration: InputDecoration(
                    labelText: context.tr('budget_currency_label'),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                  ),
                  items: _kCurrencies
                      .map((c) => DropdownMenuItem<String>(
                            value: c,
                            child: Text('$c (${currencySymbolFromCode(c)})'),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _currency = v);
                  },
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<CategoryModel>(
                  value: _selectedCategory,
                  decoration: InputDecoration(
                    labelText: context.tr('category'),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: p.borderColor)),
                  ),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                  onChanged: (c) => setState(() => _selectedCategory = c),
                  validator: (v) => v == null ? context.tr('select_category') : null,
                ),
                const SizedBox(height: 20),
                SegmentedButton<BudgetPeriod>(
                  segments: [
                    ButtonSegment(value: BudgetPeriod.weekly, label: Text(context.tr('period_week'))),
                    ButtonSegment(value: BudgetPeriod.monthly, label: Text(context.tr('period_month'))),
                    ButtonSegment(value: BudgetPeriod.yearly, label: Text(context.tr('period_year'))),
                    ButtonSegment(value: BudgetPeriod.custom, label: Text(context.tr('period_custom'))),
                  ],
                  selected: {_period},
                  onSelectionChanged: (s) => setState(() => _period = s.first),
                ),
                const SizedBox(height: 12),
                Text(
                  context.tr('budget_period_hint'),
                  style: TextStyle(color: p.subtitleText, fontSize: 12),
                ),
                if (_period == BudgetPeriod.custom) ...[
                  const SizedBox(height: 16),
                  _dateTile(p, context.tr('from_date'), _customStart, (d) => setState(() => _customStart = d), first: DateTime(2000), last: DateTime(2100)),
                  const SizedBox(height: 8),
                  _dateTile(p, context.tr('to_date'), _customEnd, (d) => setState(() => _customEnd = d), first: _customStart, last: DateTime(2100)),
                ],
                const SizedBox(height: 8),
                SwitchListTile(
                  title: Text(context.tr('is_active')),
                  value: _isActive,
                  onChanged: (v) => setState(() => _isActive = v),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _loading ? null : () {
                    if (_formKey.currentState?.validate() ?? false) _save();
                  },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: p.primaryAction))
                      : Text(isEdit ? context.tr('update') : context.tr('add_budget_btn')),
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
