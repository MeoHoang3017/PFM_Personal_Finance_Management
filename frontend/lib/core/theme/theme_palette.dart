import 'package:flutter/material.dart';

import 'app_palette_dark.dart';
import 'app_palette_light.dart';

PaletteColors pfmPaletteOf(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark
      ? PaletteColors.dark
      : PaletteColors.light;
}

Color pfmShadowColorOf(BuildContext context) {
  return Theme.of(context).brightness == Brightness.dark
      ? Colors.black.withValues(alpha: 0.2)
      : Colors.black.withValues(alpha: 0.08);
}

class PaletteColors {
  const PaletteColors._({
    required this.backgroundColor,
    required this.cardSurface,
    required this.sectionContentBg,
    required this.primaryAction,
    required this.incomeColor,
    required this.expenseColor,
    required this.primaryText,
    required this.subtitleText,
    required this.iconMuted,
    required this.appBarBg,
    required this.borderColor,
    required this.overlayOnInk,
    required this.errorColor,
    required this.tabSelectedBg,
  });

  final Color backgroundColor;
  final Color cardSurface;
  final Color sectionContentBg;
  final Color primaryAction;
  final Color incomeColor;
  final Color expenseColor;
  final Color primaryText;
  final Color subtitleText;
  final Color iconMuted;
  final Color appBarBg;
  final Color borderColor;
  final Color overlayOnInk;
  final Color errorColor;
  final Color tabSelectedBg;

  static const PaletteColors dark = PaletteColors._(
    backgroundColor: PaletteDark.backgroundColor,
    cardSurface: PaletteDark.cardSurface,
    sectionContentBg: PaletteDark.sectionContentBg,
    primaryAction: PaletteDark.primaryAction,
    incomeColor: PaletteDark.incomeColor,
    expenseColor: PaletteDark.expenseColor,
    primaryText: PaletteDark.primaryText,
    subtitleText: PaletteDark.subtitleText,
    iconMuted: PaletteDark.iconMuted,
    appBarBg: PaletteDark.appBarBg,
    borderColor: PaletteDark.borderColor,
    overlayOnInk: Colors.white24,
    errorColor: PaletteDark.errorColor,
    tabSelectedBg: PaletteDark.tabSelectedBg,
  );

  static const PaletteColors light = PaletteColors._(
    backgroundColor: PaletteLight.backgroundColor,
    cardSurface: PaletteLight.cardSurface,
    sectionContentBg: PaletteLight.sectionContentBg,
    primaryAction: PaletteLight.primaryAction,
    incomeColor: PaletteLight.incomeColor,
    expenseColor: PaletteLight.expenseColor,
    primaryText: PaletteLight.primaryText,
    subtitleText: PaletteLight.subtitleText,
    iconMuted: PaletteLight.iconMuted,
    appBarBg: PaletteLight.appBarBg,
    borderColor: PaletteLight.borderColor,
    overlayOnInk: PaletteLight.overlayLight,
    errorColor: PaletteLight.errorColor,
    tabSelectedBg: PaletteLight.tabSelectedBg,
  );
}
