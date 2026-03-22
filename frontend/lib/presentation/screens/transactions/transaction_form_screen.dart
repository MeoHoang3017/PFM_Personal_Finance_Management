import 'package:easy_localization/easy_localization.dart';
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
  Wallet? _selectedToWallet;
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
      case TransactionType.exchange:
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
      _type = t.type == TransactionType.exchange ? TransactionType.expense : t.type;
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
    Wallet? selTo;
    if (widget.transaction != null && widget.transaction!.wallet.isNotEmpty) {
      for (final w in wallets) {
        if (w.id == widget.transaction!.wallet) {
          selWallet = w;
          break;
        }
      }
      final cp = widget.transaction!.counterpartyWallet;
      if (cp != null && cp.isNotEmpty) {
        for (final w in wallets) {
          if (w.id == cp) {
            selTo = w;
            break;
          }
        }
      }
    }
    if (selWallet == null && wallets.isNotEmpty) selWallet = wallets.first;
    if (selTo == null && wallets.length > 1 && selWallet != null) {
      final others = wallets.where((w) => w.id != selWallet!.id).toList();
      if (others.isNotEmpty) selTo = others.first;
    }

    CategoryModel? selCat;
    final ct = _categoryTypeFor(_type);
    if (ct != null) {
      if (widget.transaction != null && widget.transaction!.category.isNotEmpty) {
        final match = cats.where((c) => c.id == widget.transaction!.category);
        selCat = match.isEmpty ? null : match.first;
      }
      if (selCat == null) {
        final byType = cats.where((c) => c.type == ct).toList();
        selCat = byType.isNotEmpty ? byType.first : (cats.isNotEmpty ? cats.first : null);
      }
    } else {
      selCat = null;
    }

    if (!mounted) return;
    setState(() {
      _user = user;
      _wallets = wallets;
      _categories = cats;
      _selectedWallet = selWallet;
      _selectedToWallet = selTo;
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
    if (_user == null) {
      setState(() => _errorMessage = 'select_wallet_login'.tr());
      return;
    }
    if (widget.transaction?.type == TransactionType.exchange) {
      AppToast.showError(context, 'exchange_cannot_edit'.tr());
      return;
    }
    final amount = double.tryParse(_amountController.text.replaceAll(',', '')) ?? 0;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<TransactionService>();
      if (widget.transaction != null) {
        if (_selectedWallet == null) {
          setState(() => _errorMessage = 'select_wallet'.tr());
          return;
        }
        final categoryId = _selectedCategory?.id ?? '';
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
        if (res.isSuccess && res.result != null) {
          AppToast.showSuccess(context, 'transaction_updated'.tr());
          Navigator.pop(context, res.result);
        } else if (!res.isSuccess) {
          setState(() => _errorMessage = res.message);
        }
      } else {
        if (_type == TransactionType.exchange) {
          if (_selectedWallet == null || _selectedToWallet == null) {
            if (mounted) setState(() {
              _loading = false;
              _errorMessage = 'select_two_wallets'.tr();
            });
            return;
          }
          if (_selectedWallet!.id == _selectedToWallet!.id) {
            if (mounted) setState(() {
              _loading = false;
              _errorMessage = 'wallets_must_differ'.tr();
            });
            return;
          }
          final res = await svc.createWalletExchange(CreateWalletExchangeData(
            fromWallet: _selectedWallet!.id,
            toWallet: _selectedToWallet!.id,
            amount: amount,
            date: _date,
            description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
            notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
          ));
          if (!mounted) return;
          setState(() => _loading = false);
          if (res.isSuccess) {
            Navigator.pop(context, true);
          } else {
            setState(() => _errorMessage = res.message);
          }
        } else {
          if (_selectedWallet == null) {
            setState(() {
              _loading = false;
              _errorMessage = 'select_wallet'.tr();
            });
            return;
          }
          final categoryId = _selectedCategory?.id ?? '';
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
          if (res.isSuccess && res.result != null) {
            AppToast.showSuccess(context, 'transaction_added'.tr());
            Navigator.pop(context, res.result);
          } else if (!res.isSuccess) {
            setState(() => _errorMessage = res.message);
          }
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = 'error_connection'.tr();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.transaction != null;
    final isExchangeEdit = widget.transaction?.type == TransactionType.exchange;
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'edit_transaction'.tr() : 'add_transaction'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'edit_transaction'.tr() : 'add_transaction'.tr()),
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
                if (isExchangeEdit)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text('exchange_cannot_edit'.tr(), style: TextStyle(color: Theme.of(context).colorScheme.secondary)),
                  ),
                if (!isExchangeEdit)
                  SegmentedButton<TransactionType>(
                    segments: [
                      ButtonSegment(value: TransactionType.income, icon: const Icon(Icons.arrow_downward), label: Text('type_income'.tr())),
                      ButtonSegment(value: TransactionType.expense, icon: const Icon(Icons.arrow_upward), label: Text('type_expense'.tr())),
                      ButtonSegment(value: TransactionType.exchange, icon: const Icon(Icons.swap_horiz), label: Text('type_exchange'.tr())),
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
                if (!isExchangeEdit) const SizedBox(height: 16),
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'amount'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'hint_amount'.tr();
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'invalid_number'.tr();
                    return null;
                  },
                  readOnly: isExchangeEdit,
                ),
                const SizedBox(height: 16),
                if (_type == TransactionType.exchange && !isEdit) ...[
                  DropdownButtonFormField<Wallet>(
                    value: _selectedWallet,
                    decoration: InputDecoration(labelText: 'wallet_from'.tr(), border: const OutlineInputBorder()),
                    items: _wallets.map((w) => DropdownMenuItem<Wallet>(value: w, child: Text(w.name))).toList(),
                    onChanged: (w) => setState(() => _selectedWallet = w),
                    validator: (v) => v == null ? 'select_wallet'.tr() : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<Wallet>(
                    value: _selectedToWallet,
                    decoration: InputDecoration(labelText: 'wallet_to'.tr(), border: const OutlineInputBorder()),
                    items: _wallets.map((w) => DropdownMenuItem<Wallet>(value: w, child: Text(w.name))).toList(),
                    onChanged: (w) => setState(() => _selectedToWallet = w),
                    validator: (v) => v == null ? 'select_wallet'.tr() : null,
                  ),
                  const SizedBox(height: 16),
                ] else ...[
                  DropdownButtonFormField<Wallet>(
                    value: _selectedWallet,
                    decoration: InputDecoration(labelText: 'wallet_label'.tr(), border: const OutlineInputBorder()),
                    items: _wallets.map((w) => DropdownMenuItem<Wallet>(value: w, child: Text(w.name))).toList(),
                    onChanged: isExchangeEdit ? null : (w) => setState(() => _selectedWallet = w),
                    validator: (v) => v == null ? 'select_wallet'.tr() : null,
                  ),
                  const SizedBox(height: 16),
                ],
                if (_type != TransactionType.exchange && !isExchangeEdit) ...[
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedCategory,
                    decoration: InputDecoration(labelText: 'category'.tr(), border: const OutlineInputBorder()),
                    items: _categories
                        .where((c) => c.type == _categoryTypeFor(_type))
                        .map((c) => DropdownMenuItem<CategoryModel>(value: c, child: Text(c.name)))
                        .toList(),
                    onChanged: (c) => setState(() => _selectedCategory = c),
                  ),
                  const SizedBox(height: 16),
                ],
                ListTile(
                  title: Text('date'.tr()),
                  subtitle: Text('${_date.day}/${_date.month}/${_date.year}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: isExchangeEdit
                      ? null
                      : () async {
                          final d = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2000), lastDate: DateTime(2100));
                          if (d != null) setState(() => _date = d);
                        },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  readOnly: isExchangeEdit,
                  decoration: InputDecoration(
                    labelText: 'description'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  readOnly: isExchangeEdit,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'note'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                if (!isExchangeEdit)
                  FilledButton(
                    onPressed: _loading
                        ? null
                        : () {
                            if (_formKey.currentState?.validate() ?? false) _save();
                          },
                    child: _loading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(isEdit ? 'update'.tr() : 'add_transaction_btn'.tr()),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
