import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/category_models.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/models/wallet_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/wallet_service.dart';
import '../../../data/services/transaction_service.dart';
import '../../../data/services/category_service.dart';

class TransactionFormScreen extends StatefulWidget {
  final TransactionModel? transaction;
  final String? transactionId;

  const TransactionFormScreen({super.key, this.transaction, this.transactionId});

  @override
  State<TransactionFormScreen> createState() => _TransactionFormScreenState();
}

class _TransactionFormScreenState extends State<TransactionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _notesController = TextEditingController();

  TransactionType _type = TransactionType.expense;
  DateTime _date = DateTime.now();
  List<Wallet> _wallets = [];
  List<CategoryModel> _categories = [];
  Wallet? _selectedWallet;
  CategoryModel? _selectedCategory;
  bool _loading = false;
  bool _loadingData = true;
  String? _errorMessage;
  UserInfo? _user;

  CategoryType? _categoryTypeFor(TransactionType t) {
    switch (t) {
      case TransactionType.income:
        return CategoryType.income;
      case TransactionType.expense:
        return CategoryType.expense;
      case TransactionType.transfer:
        return null;
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.transaction != null) {
      final t = widget.transaction!;
      _amountController.text = t.amount.toStringAsFixed(0);
      _descriptionController.text = t.description;
      _notesController.text = t.notes;
      _type = t.type;
      _date = t.date;
    }
    _loadUserAndData();
  }

  Future<void> _loadUserAndData() async {
    final auth = getIt<AuthService>();
    final user = await auth.getStoredUser();
    final walletRes = await getIt<WalletService>().getWallets(pageSize: 100);
    var catRes = await getIt<CategoryService>().getUserCategories();
    if (catRes.result == null || catRes.result!.isEmpty) {
      catRes = await getIt<CategoryService>().getCategories();
    }
    final cats = catRes.result ?? [];

    List<Wallet> wallets = [];
    if (walletRes.isSuccess && walletRes.result != null) wallets = walletRes.result!.data;

    Wallet? selWallet;
    if (widget.transaction != null && widget.transaction!.wallet.isNotEmpty) {
      for (final w in wallets) {
        if (w.id == widget.transaction!.wallet) {
          selWallet = w;
          break;
        }
      }
    }
    if (selWallet == null && wallets.isNotEmpty) selWallet = wallets.first;

    CategoryModel? selCat;
    final ct = _categoryTypeFor(_type);
    if (ct != null) {
      final byType = cats.where((c) => c.type == ct).toList();
      if (byType.isNotEmpty) selCat = byType.first;
      else if (cats.isNotEmpty) selCat = cats.first;
    } else {
      selCat = null;
    }

    if (!mounted) return;
    setState(() {
      _user = user;
      _wallets = wallets;
      _categories = cats;
      _selectedWallet = selWallet;
      _selectedCategory = selCat;
      _loadingData = false;
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_user == null || _selectedWallet == null) {
      setState(() => _errorMessage = 'Chọn ví và đảm bảo đã đăng nhập');
      return;
    }
    final amount = double.tryParse(_amountController.text.replaceAll(',', '')) ?? 0;
    final categoryId = _selectedCategory?.id ?? '';
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<TransactionService>();
      if (widget.transaction != null) {
        final res = await svc.updateTransaction(
          widget.transaction!.id,
          UpdateTransactionData(
            amount: amount,
            type: _type,
            category: categoryId,
            date: _date,
            description: _descriptionController.text.trim(),
            notes: _notesController.text.trim(),
            wallet: _selectedWallet!.id,
          ),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã cập nhật giao dịch')));
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createTransaction(CreateTransactionData(
          amount: amount,
          type: _type,
          category: categoryId,
          date: _date,
          description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
          wallet: _selectedWallet!.id,
          user: _user!.id,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'Đã thêm giao dịch');
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
    final isEdit = widget.transaction != null;
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch'),
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
                SegmentedButton<TransactionType>(
                  segments: const [
                    ButtonSegment(value: TransactionType.income, icon: Icon(Icons.arrow_downward), label: Text('Thu')),
                    ButtonSegment(value: TransactionType.expense, icon: Icon(Icons.arrow_upward), label: Text('Chi')),
                    ButtonSegment(value: TransactionType.transfer, icon: Icon(Icons.swap_horiz), label: Text('Chuyển')),
                  ],
                  selected: {_type},
                  onSelectionChanged: (s) {
                    setState(() {
                      _type = s.first;
                      final ct = _categoryTypeFor(_type);
                      if (ct == null) {
                        _selectedCategory = null;
                        return;
                      }
                      final byType = _categories.where((c) => c.type == ct).toList();
                      _selectedCategory = byType.isNotEmpty ? byType.first : _selectedCategory;
                    });
                  },
                ),
                const SizedBox(height: 16),
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
                DropdownButtonFormField<Wallet>(
                  value: _selectedWallet,
                  decoration: const InputDecoration(labelText: 'Ví', border: OutlineInputBorder()),
                  items: _wallets
                      .map((w) => DropdownMenuItem<Wallet>(value: w, child: Text(w.name)))
                      .toList(),
                  onChanged: (w) => setState(() => _selectedWallet = w),
                  validator: (v) => v == null ? 'Chọn ví' : null,
                ),
                const SizedBox(height: 16),
                if (_type != TransactionType.transfer) ...[
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedCategory,
                    decoration: const InputDecoration(labelText: 'Danh mục', border: OutlineInputBorder()),
                    items: _categories
                        .where((c) => c.type == _categoryTypeFor(_type))
                        .map((c) => DropdownMenuItem<CategoryModel>(value: c, child: Text(c.name)))
                        .toList(),
                    onChanged: (c) => setState(() => _selectedCategory = c),
                  ),
                  const SizedBox(height: 16),
                ],
                ListTile(
                  title: const Text('Ngày'),
                  subtitle: Text('${_date.day}/${_date.month}/${_date.year}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2000), lastDate: DateTime(2100));
                    if (d != null) setState(() => _date = d);
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Mô tả',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Ghi chú',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : () {
                    if (_formKey.currentState?.validate() ?? false) _save();
                  },
                  child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(isEdit ? 'Cập nhật' : 'Thêm giao dịch'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
