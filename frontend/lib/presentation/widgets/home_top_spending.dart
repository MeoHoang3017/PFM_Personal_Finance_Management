import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/transaction_models.dart';
import 'section_card.dart';
import 'section_header.dart';

/// Section "Chi tiêu nhiều nhất" kiểu FinTracker: tab Tuần/Tháng, top 3 danh mục chi.
class HomeTopSpending extends StatefulWidget {
  final List<TransactionModel> transactions;
  /// Gọi khi bấm "Xem chi tiết" (màn chi tiết chi tiêu theo tháng).
  final VoidCallback? onViewDetail;

  const HomeTopSpending({
    super.key,
    required this.transactions,
    this.onViewDetail,
  });

  @override
  State<HomeTopSpending> createState() => _HomeTopSpendingState();
}

class _HomeTopSpendingState extends State<HomeTopSpending> {
  bool _isWeek = true;

  /// Tuần: 7 ngày gần đây nhất (từ 6 ngày trước đến hôm nay, tính theo ngày hiện tại).
  /// Tháng: tháng hiện tại (từ ngày 1 đến hôm nay).
  List<TransactionModel> get _filtered {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    if (_isWeek) {
      // 1 tuần gần nhất = 7 ngày kết thúc bằng hôm nay (today - 6 → today)
      final weekStart = today.subtract(const Duration(days: 6));
      return widget.transactions.where((t) {
        if (t.type != TransactionType.expense) return false;
        final tDay = DateTime(t.date.year, t.date.month, t.date.day);
        return tDay.compareTo(weekStart) >= 0 && tDay.compareTo(today) <= 0;
      }).toList();
    }

    // 1 tháng gần nhất = tháng hiện tại (từ ngày 1 đến hôm nay)
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    return widget.transactions.where((t) {
      if (t.type != TransactionType.expense) return false;
      final tDay = DateTime(t.date.year, t.date.month, t.date.day);
      return tDay.compareTo(firstDayOfMonth) >= 0 && tDay.compareTo(today) <= 0;
    }).toList();
  }

  List<({String category, double amount})> get _byCategory {
    final map = <String, double>{};
    for (final t in _filtered) {
      final name = t.categoryDisplay.isEmpty ? 'other_category'.tr() : t.categoryDisplay;
      map[name] = (map[name] ?? 0) + t.amount;
    }
    final list = map.entries.map((e) => (category: e.key, amount: e.value)).toList();
    list.sort((a, b) => b.amount.compareTo(a.amount));
    return list.take(3).toList();
  }

  static IconData _iconForCategory(String name) {
    final n = name.toLowerCase();
    if (n.contains('ăn') || n.contains('uống')) return Icons.restaurant;
    if (n.contains('di chuyển') || n.contains('xăng')) return Icons.directions_car;
    if (n.contains('nhà')) return Icons.home;
    if (n.contains('giải trí')) return Icons.movie;
    if (n.contains('mua sắm')) return Icons.shopping_cart;
    if (n.contains('sức khỏe')) return Icons.local_hospital;
    if (n.contains('giáo dục')) return Icons.school;
    return Icons.category;
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final items = _byCategory;
    final total = _filtered.fold<double>(0, (s, t) => s + t.amount);
    final suffix = _filtered.isNotEmpty ? _filtered.first.currencySuffix : ' ₫';

    return SectionCard(
      padding: EdgeInsets.zero,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SectionHeader(
            title: 'top_spending'.tr(),
            actionText: 'view_detail'.tr(),
            onActionTap: items.isEmpty ? null : widget.onViewDetail,
          ),
          Divider(height: 1, color: p.borderColor),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _TabChip(
                        label: 'week'.tr(),
                        selected: _isWeek,
                        onTap: () => setState(() => _isWeek = true),
                        p: p,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _TabChip(
                        label: 'month'.tr(),
                        selected: !_isWeek,
                        onTap: () => setState(() => _isWeek = false),
                        p: p,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (items.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Column(
                      children: [
                        Icon(Icons.analytics_outlined, size: 52, color: p.iconMuted),
                        const SizedBox(height: 16),
                        Text(
                          'top_spending_empty'.tr(),
                          style: TextStyle(color: p.subtitleText, fontSize: 15),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                else
                  ...items.map((item) {
                    final pct = total > 0 ? (item.amount / total * 100) : 0.0;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: p.expenseColor.withValues(alpha: 0.2),
                            child: Icon(_iconForCategory(item.category), color: p.expenseColor, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.category,
                                  style: TextStyle(
                                    color: p.primaryText,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                if (pct > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      formatPercentageDisplay(pct),
                                      style: TextStyle(color: p.subtitleText, fontSize: 13),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Text(
                            formatCurrencyRows(item.amount, suffix: suffix),
                            style: TextStyle(
                              color: p.expenseColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final PaletteColors p;

  const _TabChip({required this.label, required this.selected, required this.onTap, required this.p});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? p.tabSelectedBg : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? p.primaryText : p.iconMuted,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
