import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_toast.dart';
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
      setState(() => _errorMessage = 'Chọn danh mục và đảm bảo đã đăng nhập');
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
          AppToast.showSuccess(context, 'Đã cập nhật ngân sách');
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
          AppToast.showSuccess(context, 'Đã thêm ngân sách');
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'Lỗi kết nối';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.budget != null;
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'Sửa ngân sách' : 'Thêm ngân sách')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Sửa ngân sách' : 'Thêm ngân sách'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_errorMessage!, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Số tiền',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Nhập số tiền';
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'Số không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<CategoryModel>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Danh mục', border: OutlineInputBorder()),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                  onChanged: (c) => setState(() => _selectedCategory = c),
                  validator: (v) => v == null ? 'Chọn danh mục' : null,
                ),
                const SizedBox(height: 16),
                SegmentedButton<BudgetPeriod>(
                  segments: const [
                    ButtonSegment(value: BudgetPeriod.daily, label: Text('Ngày')),
                    ButtonSegment(value: BudgetPeriod.weekly, label: Text('Tuần')),
                    ButtonSegment(value: BudgetPeriod.monthly, label: Text('Tháng')),
                    ButtonSegment(value: BudgetPeriod.yearly, label: Text('Năm')),
                  ],
                  selected: {_period},
                  onSelectionChanged: (s) => setState(() => _period = s.first),
                ),
                const SizedBox(height: 16),
                ListTile(
                  title: const Text('Từ ngày'),
                  subtitle: Text('${_startDate.day}/${_startDate.month}/${_startDate.year}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(context: context, initialDate: _startDate, firstDate: DateTime(2000), lastDate: DateTime(2100));
                    if (d != null) setState(() => _startDate = d);
                  },
                ),
                ListTile(
                  title: const Text('Đến ngày'),
                  subtitle: Text('${_endDate.day}/${_endDate.month}/${_endDate.year}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(context: context, initialDate: _endDate, firstDate: _startDate, lastDate: DateTime(2100));
                    if (d != null) setState(() => _endDate = d);
                  },
                ),
                SwitchListTile(
                  title: const Text('Đang áp dụng'),
                  value: _isActive,
                  onChanged: (v) => setState(() => _isActive = v),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading
                      ? null
                      : () {
                          if (_formKey.currentState?.validate() ?? false) _save();
                        },
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(isEdit ? 'Cập nhật' : 'Thêm ngân sách'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
