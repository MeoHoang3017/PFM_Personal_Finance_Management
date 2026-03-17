import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../core/utils/currency_format.dart';
import '../../../core/utils/monthly_report_helper.dart';
import '../../../data/models/category_models.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/services/category_service.dart';
import '../../../data/services/transaction_service.dart';
import '../../widgets/section_card.dart';
import 'transaction_form_screen.dart';

/// Loại filter: Thu / Chi / Tổng
enum _FilterType { income, expense, all }

class TransactionsScreen extends StatefulWidget {
  /// Gọi khi đã lưu giao dịch thành công (để refresh Dashboard, Budgets).
  final VoidCallback? onTransactionSaved;

  const TransactionsScreen({super.key, this.onTransactionSaved});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen>
    with SingleTickerProviderStateMixin {
  List<TransactionModel> _transactions = [];
  List<CategoryModel> _categories = [];
  bool _loading = true;
  String? _error;

  late TabController _tabController;
  final List<DateTime> _months = last12MonthsFromNow();
  int _lastFetchedTabIndex = -1;

  _FilterType _filterType = _FilterType.all;
  String? _selectedCategoryId; // null = Tất cả danh mục

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _months.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadForCurrentTab();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      final idx = _tabController.index;
      if (idx >= 0 && idx < _months.length && idx != _lastFetchedTabIndex) {
        _loadForCurrentTab();
      }
    }
  }

  /// Trả về [startDate, endDate] cho tháng đang chọn (tab). Tháng hiện tại: endDate = hôm nay.
  (DateTime, DateTime) _dateRangeForTab(int tabIndex) {
    final d = _months[tabIndex];
    final startDate = DateTime(d.year, d.month, 1);
    final now = DateTime.now();
    final DateTime endDate;
    if (d.month == now.month && d.year == now.year) {
      endDate = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);
    } else {
      endDate = DateTime(d.year, d.month + 1, 0, 23, 59, 59, 999);
    }
    return (startDate, endDate);
  }

  /// Fetch giao dịch theo tháng của tab đang chọn từ backend.
  Future<void> _loadForCurrentTab() async {
    if (!mounted) return;
    final tabIndex = _tabController.index;
    if (tabIndex < 0 || tabIndex >= _months.length) return;
    _lastFetchedTabIndex = tabIndex;
    final (startDate, endDate) = _dateRangeForTab(tabIndex);

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final txRes = await getIt<TransactionService>().getTransactions(
        page: 1,
        pageSize: 500,
        startDate: startDate,
        endDate: endDate,
      );
      var catRes = await getIt<CategoryService>().getUserCategories();
      if (!catRes.isSuccess || catRes.result == null || catRes.result!.isEmpty) {
        catRes = await getIt<CategoryService>().getCategories();
      }
      if (!mounted) return;
      setState(() {
        _transactions = txRes.isSuccess && txRes.result != null ? txRes.result!.data : [];
        _categories = catRes.isSuccess && catRes.result != null ? catRes.result! : [];
        _loading = false;
        _error = txRes.isSuccess ? null : txRes.message;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'error_load_data'.tr();
        });
      }
    }
  }

  /// Gọi lại khi cần refresh (sau thêm/sửa/xóa). Fetch lại đúng tháng tab hiện tại.
  Future<void> _load() => _loadForCurrentTab();

  /// Tổng Thu, Chi của tháng đang xem (từ _transactions). Doanh thu = Thu - Chi.
  (double income, double expense, double net) _monthTotals() {
    double income = 0;
    double expense = 0;
    for (final t in _transactions) {
      if (t.type == TransactionType.income) income += t.amount;
      else if (t.type == TransactionType.expense) expense += t.amount;
    }
    return (income, expense, income - expense);
  }

  /// Áp dụng filter loại (Thu/Chi/Tổng) và danh mục. Dữ liệu _transactions đã là theo tháng từ backend.
  List<TransactionModel> _filteredTransactions() {
    var list = List<TransactionModel>.from(_transactions);
    switch (_filterType) {
      case _FilterType.income:
        list = list.where((t) => t.type == TransactionType.income).toList();
        break;
      case _FilterType.expense:
        list = list.where((t) => t.type == TransactionType.expense).toList();
        break;
      case _FilterType.all:
        break;
    }
    if (_selectedCategoryId != null && _selectedCategoryId!.isNotEmpty) {
      list = list.where((t) => t.category == _selectedCategoryId).toList();
    }
    return transactionsSortedByDateDescending(list);
  }

  Future<void> _openForm([TransactionModel? transaction]) async {
    final result = await Navigator.push<TransactionModel?>(
      context,
      MaterialPageRoute(
        builder: (context) => TransactionFormScreen(transaction: transaction),
      ),
    );
    if (result != null) {
      _mergeTransactionFromBackend(result);
      widget.onTransactionSaved?.call();
    }
  }

  /// Cập nhật list và tổng từ kết quả backend (thêm mới hoặc sửa).
  void _mergeTransactionFromBackend(TransactionModel tx) {
    final tabIndex = _tabController.index;
    if (tabIndex < 0 || tabIndex >= _months.length) return;
    final (startDate, endDate) = _dateRangeForTab(tabIndex);
    final inRange = tx.date.compareTo(startDate) >= 0 && tx.date.compareTo(endDate) <= 0;
    final idx = _transactions.indexWhere((t) => t.id == tx.id);
    setState(() {
      if (idx >= 0) {
        _transactions = List.from(_transactions)..[idx] = tx;
      } else if (inRange) {
        _transactions = [tx, ..._transactions];
      }
    });
  }

  Future<void> _duplicate(TransactionModel t) async {
    setState(() => _loading = true);
    try {
      final res = await getIt<TransactionService>().duplicateTransaction(t.id);
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess) {
        if (res.result != null) _mergeTransactionFromBackend(res.result!);
        widget.onTransactionSaved?.call();
        AppToast.showSuccess(context, 'transaction_duplicated'.tr());
      } else {
        AppToast.showError(context, res.message);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
        AppToast.showError(context, 'error_duplicate'.tr());
      }
    }
  }

  Future<void> _confirmDelete(TransactionModel t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_transaction'.tr()),
        content: Text('delete_transaction_confirm'.tr()),
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
    final res = await getIt<TransactionService>().deleteTransaction(t.id);
    if (mounted) {
      if (res.isSuccess) {
        setState(() => _transactions = _transactions.where((x) => x.id != t.id).toList());
        widget.onTransactionSaved?.call();
        AppToast.showSuccess(context, 'transaction_deleted'.tr());
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _typeLabel(TransactionType type) {
    switch (type) {
      case TransactionType.income:
        return 'type_income'.tr();
      case TransactionType.expense:
        return 'type_expense'.tr();
      case TransactionType.transfer:
        return 'type_transfer'.tr();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('transactions'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: p.iconMuted),
            onPressed: _loading ? null : _load,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: p.primaryAction,
          unselectedLabelColor: p.subtitleText,
          indicatorColor: p.primaryAction,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          tabs: _months
              .map((d) => Tab(
                    text: 'T${d.month}/${d.year.toString().substring(2)}',
                  ))
              .toList(),
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final maxHeaderHeight = constraints.maxHeight * 0.40;
          return Column(
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
              ConstrainedBox(
                constraints: BoxConstraints(maxHeight: maxHeaderHeight),
                child: SingleChildScrollView(
                  child: _buildCompactFilterAndSummary(context, p),
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
                    : _buildTabContent(p),
              ),
            ],
          );
        },
      ),
      floatingActionButton: _transactions.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _openForm(),
              backgroundColor: p.primaryAction,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  /// Khối thu gọn: filter (chips + dropdown) + dòng Thu / Chi / Doanh thu ở dưới.
  Widget _buildCompactFilterAndSummary(BuildContext context, PaletteColors p) {
    final (income, expense, net) = _monthTotals();
    return Container(
      color: p.sectionContentBg,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _SmallFilterChip(
                label: 'filter_all'.tr(),
                selected: _filterType == _FilterType.all,
                onTap: () => setState(() => _filterType = _FilterType.all),
                p: p,
              ),
              const SizedBox(width: 8),
              _SmallFilterChip(
                label: 'type_income'.tr(),
                selected: _filterType == _FilterType.income,
                color: p.incomeColor,
                onTap: () => setState(() => _filterType = _FilterType.income),
                p: p,
              ),
              const SizedBox(width: 8),
              _SmallFilterChip(
                label: 'type_expense'.tr(),
                selected: _filterType == _FilterType.expense,
                color: p.expenseColor,
                onTap: () => setState(() => _filterType = _FilterType.expense),
                p: p,
              ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String?>(
            value: _selectedCategoryId,
            decoration: InputDecoration(
              labelText: 'category'.tr(),
              labelStyle: TextStyle(color: p.subtitleText, fontSize: 12),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              filled: true,
              fillColor: p.cardSurface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: p.borderColor),
              ),
            ),
            isExpanded: true,
            hint: Text('all_categories'.tr(), style: TextStyle(color: p.subtitleText, fontSize: 13)),
            items: [
              DropdownMenuItem<String?>(
                value: null,
                child: Text('all_categories'.tr(), style: TextStyle(color: p.primaryText, fontSize: 13)),
              ),
              ..._categories.map((c) => DropdownMenuItem<String?>(
                    value: c.id,
                    child: Text(c.name, style: TextStyle(color: p.primaryText, fontSize: 13)),
                  )),
            ],
            onChanged: (v) => setState(() => _selectedCategoryId = v),
          ),
          const SizedBox(height: 8),
          // Dòng Thu / Chi / Doanh thu thu gọn
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: p.cardSurface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: p.borderColor.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        context.tr('month_income'),
                        style: TextStyle(color: p.subtitleText, fontSize: 10),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatCurrency(income, compact: true),
                        style: TextStyle(color: p.incomeColor, fontWeight: FontWeight.w600, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 28, color: p.borderColor.withValues(alpha: 0.6)),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(context.tr('month_expense'), style: TextStyle(color: p.subtitleText, fontSize: 10)),
                      const SizedBox(height: 2),
                      Text(
                        formatCurrency(expense, compact: true),
                        style: TextStyle(color: p.expenseColor, fontWeight: FontWeight.w600, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 28, color: p.borderColor.withValues(alpha: 0.6)),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(context.tr('month_net'), style: TextStyle(color: p.subtitleText, fontSize: 10)),
                      const SizedBox(height: 2),
                      Text(
                        formatCurrency(net, compact: true),
                        style: TextStyle(
                          color: net >= 0 ? p.incomeColor : p.expenseColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(PaletteColors p) {
    final list = _filteredTransactions();
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 64, color: p.iconMuted),
            const SizedBox(height: 16),
            Text(
              'no_transactions'.tr(),
              style: TextStyle(color: p.subtitleText, fontSize: 15),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _openForm(),
              icon: const Icon(Icons.add),
              label: Text('add_transaction_btn'.tr()),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: p.primaryAction,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final t = list[index];
          final typeColor = t.type == TransactionType.income ? p.incomeColor : p.expenseColor;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: SectionCard(
              padding: EdgeInsets.zero,
              child: InkWell(
                onTap: () => _openForm(t),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: typeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          t.type == TransactionType.income ? Icons.arrow_downward : Icons.arrow_upward,
                          size: 22,
                          color: typeColor,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              t.description.isEmpty ? 'no_description'.tr() : t.description,
                              style: TextStyle(color: p.primaryText, fontSize: 15, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${_typeLabel(t.type)} · ${t.date.day}/${t.date.month}/${t.date.year}${t.categoryDisplay.isNotEmpty ? ' · ${t.categoryDisplay}' : ''}',
                              style: TextStyle(color: p.subtitleText, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        formatCurrency(t.amount),
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: typeColor),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      PopupMenuButton<String>(
                        icon: Icon(Icons.more_vert, color: p.iconMuted),
                        onSelected: (v) {
                          if (v == 'edit') _openForm(t);
                          if (v == 'duplicate') _duplicate(t);
                          if (v == 'delete') _confirmDelete(t);
                        },
                        itemBuilder: (ctx) => [
                          PopupMenuItem(value: 'edit', child: Text('edit'.tr())),
                          PopupMenuItem(value: 'duplicate', child: Text('duplicate'.tr())),
                          PopupMenuItem(value: 'delete', child: Text('delete'.tr())),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Chip lọc nhỏ gọn (All / Thu / Chi).
class _SmallFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final PaletteColors p;
  final Color? color;

  const _SmallFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.p,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? p.primaryAction;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? chipColor.withValues(alpha: 0.18) : p.borderColor.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? chipColor : p.borderColor.withValues(alpha: 0.5),
              width: selected ? 1.2 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? chipColor : p.subtitleText,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
