import 'package:flutter/material.dart';
import 'package:frontend/core/theme/app_pallete_dark.dart';
import 'package:frontend/core/theme/app_pallete_light.dart';

class AppTheme {
  static final darkThemeMode = ThemeData.dark().copyWith(
    scaffoldBackgroundColor: PalleteDark.backgroundColor,
  );
  static final lightThemeMode = ThemeData.light().copyWith(
    scaffoldBackgroundColor: PalleteLight.backgroundColor,
  );
}
