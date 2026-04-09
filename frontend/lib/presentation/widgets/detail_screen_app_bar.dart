import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';

/// AppBar thống nhất cho các màn chi tiết (Báo cáo, Chi tiêu theo category...).
class DetailScreenAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onBack;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final bool centerTitle;

  const DetailScreenAppBar({
    super.key,
    required this.title,
    this.onBack,
    this.actions,
    this.bottom,
    this.centerTitle = true,
  });

  @override
  Size get preferredSize =>
      Size.fromHeight(kToolbarHeight + (bottom != null ? 48.0 : 0));

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return AppBar(
      elevation: 0,
      scrolledUnderElevation: 2,
      surfaceTintColor: Colors.transparent,
      backgroundColor: p.appBarBg,
      centerTitle: centerTitle,
      leadingWidth: 56,
      leading: IconButton(
        icon: Icon(Icons.arrow_back_ios_new, size: 20, color: p.primaryText),
        onPressed: onBack ?? () => Navigator.maybePop(context),
        tooltip: 'Quay lại',
        style: IconButton.styleFrom(
          overlayColor: p.overlayOnInk,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: p.primaryText,
          letterSpacing: -0.2,
        ),
      ),
      iconTheme: IconThemeData(color: p.primaryText, size: 22),
      actions: actions,
      bottom: bottom,
    );
  }
}
