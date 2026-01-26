import 'package:flutter/material.dart';
import 'package:frontend/core/theme/app_pallete_dark.dart';
import 'package:frontend/core/theme/app_pallete_light.dart';

class AppTheme {
  static OutlineInputBorder _border(Color color) => OutlineInputBorder(
    borderSide: BorderSide(color: color, width: 3),
    borderRadius: BorderRadius.circular(30),
  );

  static final darkThemeMode = ThemeData.dark().copyWith(
    scaffoldBackgroundColor: PalleteDark.backgroundColor,
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: const EdgeInsets.all(27),
      enabledBorder: _border(PalleteDark.borderColor),
      focusedBorder: _border(PalleteDark.gradient2),
    ),
  );
  static final lightThemeMode = ThemeData.light().copyWith(
    scaffoldBackgroundColor: PalleteLight.backgroundColor,
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: const EdgeInsets.all(27),
      enabledBorder: _border(PalleteLight.borderColor),
      focusedBorder: _border(PalleteLight.gradient2),
    ),
  );
}
