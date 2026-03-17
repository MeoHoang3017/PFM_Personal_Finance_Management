import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/transaction_models.dart';

/// Một dòng giao dịch gần đây trên homepage kiểu FinTracker.
class HomeTransactionItem extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;

  const HomeTransactionItem({super.key, required this.transaction, this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isIncome = transaction.type == TransactionType.income;
    final color = isIncome ? p.incomeColor : p.expenseColor;
    final title = transaction.description.isEmpty ? (isIncome ? 'Thu nhập' : 'Chi tiêu') : transaction.description;
    final dateStr = '${transaction.date.day}/${transaction.date.month}/${transaction.date.year}';
    final amountStr = formatCurrency(transaction.amount);

    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
              isIncome ? Icons.arrow_downward : Icons.arrow_upward,
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
