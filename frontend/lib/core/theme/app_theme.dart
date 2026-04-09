import 'package:flutter/material.dart';

import 'app_palette_dark.dart';
import 'app_palette_light.dart';

class AppTheme {
  static OutlineInputBorder _inputBorder(Color color) => OutlineInputBorder(
        borderSide: BorderSide(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      );

  static ThemeData get lightTheme => ThemeData.light().copyWith(
        useMaterial3: true,
        scaffoldBackgroundColor: PaletteLight.backgroundColor,
        colorScheme: ColorScheme.light(
          primary: PaletteLight.primaryAction,
          onPrimary: Colors.white,
          surface: PaletteLight.cardSurface,
          onSurface: PaletteLight.primaryText,
          error: PaletteLight.errorColor,
          onError: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: PaletteLight.appBarBg,
          foregroundColor: PaletteLight.primaryText,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          filled: true,
          fillColor: PaletteLight.cardSurface,
          enabledBorder: _inputBorder(PaletteLight.borderColor),
          focusedBorder: _inputBorder(PaletteLight.primaryAction),
          errorBorder: _inputBorder(PaletteLight.errorColor),
          border: _inputBorder(PaletteLight.borderColor),
        ),
        cardTheme: CardThemeData(
          color: PaletteLight.cardSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: PaletteLight.primaryAction,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: PaletteLight.cardSurface,
          indicatorColor: PaletteLight.tabSelectedBg,
          elevation: 0,
        ),
      );

  static ThemeData get darkTheme => ThemeData.dark().copyWith(
        useMaterial3: true,
        scaffoldBackgroundColor: PaletteDark.backgroundColor,
        colorScheme: ColorScheme.dark(
          primary: PaletteDark.primaryAction,
          onPrimary: PaletteDark.backgroundColor,
          surface: PaletteDark.cardSurface,
          onSurface: PaletteDark.primaryText,
          error: PaletteDark.errorColor,
          onError: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: PaletteDark.appBarBg,
          foregroundColor: PaletteDark.primaryText,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          filled: true,
          fillColor: PaletteDark.cardSurface,
          enabledBorder: _inputBorder(PaletteDark.borderColor),
          focusedBorder: _inputBorder(PaletteDark.primaryAction),
          errorBorder: _inputBorder(PaletteDark.errorColor),
          border: _inputBorder(PaletteDark.borderColor),
        ),
        cardTheme: CardThemeData(
          color: PaletteDark.cardSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: PaletteDark.primaryAction,
            foregroundColor: PaletteDark.backgroundColor,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: PaletteDark.cardSurface,
          indicatorColor: PaletteDark.tabSelectedBg,
          elevation: 0,
        ),
      );
}
