import 'package:flutter/material.dart';

import '../../core/utils/category_icon.dart';

/// Avatar trái cho card ngân sách: ưu tiên icon/color từ API, fallback theo tên danh mục.
class BudgetCategoryLeading extends StatelessWidget {
  final double size;
  final String categoryName;
  final String? iconKey;
  final String? colorHex;
  final Color accentWhenNoColor;

  const BudgetCategoryLeading({
    super.key,
    this.size = 44,
    required this.categoryName,
    this.iconKey,
    this.colorHex,
    required this.accentWhenNoColor,
  });

  @override
  Widget build(BuildContext context) {
    final icon = iconFromCategoryKey(iconKey) ?? iconForCategoryLabel(categoryName);
    final bg = colorFromHex(colorHex)?.withValues(alpha: 0.12) ?? accentWhenNoColor.withValues(alpha: 0.12);
    final fg = colorFromHex(colorHex) ?? accentWhenNoColor;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: fg, size: size * 0.5),
    );
  }
}
