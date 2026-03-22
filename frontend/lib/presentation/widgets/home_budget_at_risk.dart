import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/budget_models.dart';
import 'budget_category_leading.dart';
import 'section_card.dart';
import 'section_header.dart';

/// Khối Tổng quan: các ngân sách đang dùng gần hết hạn mức nhất (tối đa 3).
class HomeBudgetAtRisk extends StatelessWidget {
  final List<BudgetModel> budgets;
  final VoidCallback? onViewAll;
  final void Function(BudgetModel budget) onOpenBudget;

  const HomeBudgetAtRisk({
    super.key,
    required this.budgets,
    this.onViewAll,
    required this.onOpenBudget,
  });

  @override
  Widget build(BuildContext context) {
    if (budgets.isEmpty) return const SizedBox.shrink();

    final p = pfmPaletteOf(context);

    return SectionCard(
      padding: EdgeInsets.zero,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SectionHeader(
            title: context.tr('home_budget_at_risk'),
            actionText: context.tr('view_all'),
            onActionTap: onViewAll,
          ),
          Divider(height: 1, color: p.borderColor),
          for (int i = 0; i < budgets.length; i++) ...[
            _BudgetAtRiskTile(
              budget: budgets[i],
              onTap: () => onOpenBudget(budgets[i]),
            ),
            if (i < budgets.length - 1)
              Divider(
                height: 1,
                indent: 16,
                endIndent: 16,
                color: p.borderColor.withValues(alpha: 0.6),
              ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _BudgetAtRiskTile extends StatelessWidget {
  final BudgetModel budget;
  final VoidCallback onTap;

  const _BudgetAtRiskTile({
    required this.budget,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final spent = budget.spentAmount ?? 0;
    final limit = budget.amount;
    final ratio = limit > 0 ? (spent / limit).clamp(0.0, 2.0) : 0.0;
    final progress = ratio > 1.0 ? 1.0 : ratio;
    final isOver = budget.isOverBudget == true;
    final barColor = isOver ? p.expenseColor : (ratio >= 0.85 ? const Color(0xFFE65100) : p.primaryAction);

    final name = budget.categoryName?.isNotEmpty == true
        ? budget.categoryName!
        : context.tr('budget_category_fallback');
    final suffix = ' ${currencySymbolFromCode(budget.currency)}';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 14, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BudgetCategoryLeading(
                size: 40,
                categoryName: name,
                iconKey: budget.categoryIcon,
                colorHex: budget.categoryColor,
                accentWhenNoColor: isOver ? p.expenseColor : p.primaryAction,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              color: p.primaryText,
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isOver)
                          Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: p.expenseColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                context.tr('budget_over_limit'),
                                style: TextStyle(color: p.expenseColor, fontSize: 10, fontWeight: FontWeight.w700),
                              ),
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: Text(
                              '${(ratio * 100).clamp(0, 999).toStringAsFixed(0)}%',
                              style: TextStyle(color: barColor, fontWeight: FontWeight.w800, fontSize: 13),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 5,
                        backgroundColor: p.borderColor.withValues(alpha: 0.45),
                        valueColor: AlwaysStoppedAnimation<Color>(barColor),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            formatCurrency(spent, suffix: suffix, compact: true),
                            style: TextStyle(
                              color: p.expenseColor,
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        Text(
                          '/ ${formatCurrency(limit, suffix: suffix, compact: true)}',
                          style: TextStyle(
                            color: p.subtitleText,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
