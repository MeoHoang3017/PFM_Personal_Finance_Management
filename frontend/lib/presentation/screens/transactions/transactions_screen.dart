import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
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
  const TransactionsScreen({super.key});

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

  _FilterType _filterType = _FilterType.all;
  String? _selectedCategoryName; // null = Tất cả danh mục

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _months.length, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final txRes = await getIt<TransactionService>().getTransactions(
        page: 1,
        pageSize: 500,
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
          _error = 'Không tải được dữ liệu';
        });
      }
    }
  }

  /// Giao dịch thuộc tháng đang chọn (tháng hiện tại: từ 1 đến hôm nay).
  List<TransactionModel> _transactionsForCurrentTab() {
    final d = _months[_tabController.index];
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    var list = transactionsInMonth(_transactions, d.month, d.year);
    if (d.month == now.month && d.year == now.year) {
      list = list.where((t) {
        final tDay = DateTime(t.date.year, t.date.month, t.date.day);
        return tDay.compareTo(today) <= 0;
      }).toList();
    }
    return list;
  }

  /// Áp dụng filter loại (Thu/Chi/Tổng) và danh mục.
  List<TransactionModel> _filteredTransactions() {
    var list = _transactionsForCurrentTab();
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
    if (_selectedCategoryName != null && _selectedCategoryName!.isNotEmpty) {
      list = list.where((t) => t.category == _selectedCategoryName).toList();
    }
    return transactionsSortedByDateDescending(list);
  }

  Future<void> _openForm([TransactionModel? transaction]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => TransactionFormScreen(transaction: transaction),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _duplicate(TransactionModel t) async {
    setState(() => _loading = true);
    try {
      final res = await getIt<TransactionService>().duplicateTransaction(t.id);
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'Đã nhân bản giao dịch');
      } else {
        AppToast.showError(context, res.message);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
        AppToast.showError(context, 'Không thể nhân bản');
      }
    }
  }

  Future<void> _confirmDelete(TransactionModel t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa giao dịch'),
        content: const Text('Bạn có chắc muốn xóa giao dịch này?'),
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
    final res = await getIt<TransactionService>().deleteTransaction(t.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'Đã xóa giao dịch');
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _typeLabel(TransactionType type) {
    switch (type) {
      case TransactionType.income:
        return 'Thu';
      case TransactionType.expense:
        return 'Chi';
      case TransactionType.transfer:
        return 'Chuyển';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('Giao dịch', style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
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
      body: Column(
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
          // Chip filter Thu / Chi / Tổng + Dropdown danh mục
          Container(
            color: p.sectionContentBg,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _FilterChip(
                        label: 'Tổng',
                        selected: _filterType == _FilterType.all,
                        onTap: () => setState(() => _filterType = _FilterType.all),
                        p: p,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _FilterChip(
                        label: 'Thu',
                        selected: _filterType == _FilterType.income,
                        color: p.incomeColor,
                        onTap: () => setState(() => _filterType = _FilterType.income),
                        p: p,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _FilterChip(
                        label: 'Chi',
                        selected: _filterType == _FilterType.expense,
                        color: p.expenseColor,
                        onTap: () => setState(() => _filterType = _FilterType.expense),
                        p: p,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _selectedCategoryName,
                  decoration: InputDecoration(
                    labelText: 'Danh mục',
                    labelStyle: TextStyle(color: p.subtitleText, fontSize: 13),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: p.borderColor),
                    ),
                  ),
                  isExpanded: true,
                  hint: Text('Tất cả danh mục', style: TextStyle(color: p.subtitleText, fontSize: 14)),
                  items: [
                    DropdownMenuItem<String>(
                      value: null,
                      child: Text('Tất cả danh mục', style: TextStyle(color: p.primaryText)),
                    ),
                    ..._categories.map((c) => DropdownMenuItem<String>(
                          value: c.name,
                          child: Text(c.name, style: TextStyle(color: p.primaryText)),
                        )),
                  ],
                  onChanged: (v) => setState(() => _selectedCategoryName = v),
                ),
              ],
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
                    : _buildTabContent(p),
          ),
        ],
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
              'Không có giao dịch trong khoảng đã chọn',
              style: TextStyle(color: p.subtitleText, fontSize: 15),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _openForm(),
              icon: const Icon(Icons.add),
              label: const Text('Thêm giao dịch'),
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
                              t.description.isEmpty ? 'Không mô tả' : t.description,
                              style: TextStyle(color: p.primaryText, fontSize: 15, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${_typeLabel(t.type)} · ${t.date.day}/${t.date.month}/${t.date.year}${t.category.isNotEmpty ? ' · ${t.category}' : ''}',
                              style: TextStyle(color: p.subtitleText, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${t.amount.toStringAsFixed(0)} ₫',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: typeColor),
                      ),
                      PopupMenuButton<String>(
                        icon: Icon(Icons.more_vert, color: p.iconMuted),
                        onSelected: (v) {
                          if (v == 'edit') _openForm(t);
                          if (v == 'duplicate') _duplicate(t);
                          if (v == 'delete') _confirmDelete(t);
                        },
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(value: 'edit', child: Text('Sửa')),
                          const PopupMenuItem(value: 'duplicate', child: Text('Nhân bản')),
                          const PopupMenuItem(value: 'delete', child: Text('Xóa')),
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

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final PaletteColors p;
  final Color? color;

  const _FilterChip({
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
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? chipColor.withValues(alpha: 0.2) : p.borderColor.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? chipColor : p.borderColor.withValues(alpha: 0.5),
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? chipColor : p.subtitleText,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
