import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/category_icon.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/transaction_models.dart';

/// Một dòng giao dịch gần đây trên homepage kiểu FinTracker.
class HomeTransactionItem extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;

  const HomeTransactionItem({super.key, required this.transaction, this.onTap});

  String _defaultTitle() {
    final t = transaction;
    if (t.type == TransactionType.income) return 'type_income_label'.tr();
    if (t.type == TransactionType.exchange) return 'type_exchange'.tr();
    return 'type_expense_label'.tr();
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isIncome = transaction.type == TransactionType.income;
    final isExchange = transaction.type == TransactionType.exchange;
    final color = isIncome ? p.incomeColor : isExchange ? p.primaryAction : p.expenseColor;
    final title = transaction.description.isEmpty ? _defaultTitle() : transaction.description;
    final dateStr = '${transaction.date.day}/${transaction.date.month}/${transaction.date.year}';
    final amountStr = formatCurrencyRows(transaction.amount, suffix: transaction.currencySuffix);
    final catIcon = iconForTransaction(transaction);

    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              catIcon,
              size: 22,
              color: color,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: p.primaryText,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (transaction.type == TransactionType.expense && transaction.categoryDisplay.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    transaction.categoryDisplay,
                    style: TextStyle(color: p.subtitleText, fontSize: 11, fontWeight: FontWeight.w500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 2),
                Text(
                  dateStr,
                  style: TextStyle(color: p.subtitleText, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            amountStr,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: content,
        ),
      );
    }
    return content;
  }
}
