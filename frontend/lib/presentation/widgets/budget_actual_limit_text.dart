import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/currency_format.dart';

/// Màu xanh (chưa vượt hạn) / cam (đã vượt hạn) theo so sánh actual vs limit.
Color budgetSpentVsLimitAccent(PaletteColors p, double spent, double limit) {
  if (limit <= 0) return p.subtitleText;
  return spent <= limit ? p.incomeColor : const Color(0xFFE65100);
}

/// Icon danh mục khi không có màu — tránh dùng [subtitleText] làm accent.
Color budgetLeadingAccent(PaletteColors p, double spent, double limit) {
  if (limit <= 0) return p.primaryAction;
  return budgetSpentVsLimitAccent(p, spent, limit);
}

/// Một dòng: `actual / limit` (cùng màu accent theo [budgetSpentVsLimitAccent]).
class BudgetActualLimitText extends StatelessWidget {
  final double spent;
  final double limit;
  final String suffix;
  final bool compact;
  final double fontSize;
  final FontWeight fontWeight;
  final TextAlign textAlign;
  /// `true` (mặc định): full width — dùng khi dòng actual/limit chiếm cả chiều ngang.
  /// `false`: shrink-wrap — dùng trong [Row] giống cột số tiền giao dịch.
  final bool expandWidth;

  const BudgetActualLimitText({
    super.key,
    required this.spent,
    required this.limit,
    required this.suffix,
    this.compact = true,
    this.fontSize = 17,
    this.fontWeight = FontWeight.w500,
    this.textAlign = TextAlign.start,
    this.expandWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final accent = budgetSpentVsLimitAccent(p, spent, limit);
    final actualStr = formatCurrency(spent, suffix: suffix, compact: compact);
    final limitStr = formatCurrency(limit, suffix: suffix, compact: compact);
    final slashSize = (fontSize * 0.82).clamp(12.0, 16.0);
    final rich = Text.rich(
      TextSpan(
        style: TextStyle(fontSize: fontSize, fontWeight: fontWeight, letterSpacing: -0.15),
        children: [
          TextSpan(text: actualStr, style: TextStyle(color: accent)),
          TextSpan(
            text: ' / ',
            style: TextStyle(color: p.subtitleText, fontWeight: FontWeight.w400, fontSize: slashSize),
          ),
          TextSpan(text: limitStr, style: TextStyle(color: accent)),
        ],
      ),
      textAlign: textAlign,
    );
    if (!expandWidth) return rich;
    return SizedBox(
      width: double.infinity,
      child: rich,
    );
  }
}
