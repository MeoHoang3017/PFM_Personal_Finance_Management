import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// [context.tr] returns the raw [key] when the string is missing from the loaded
/// asset map (stale bundle, hot reload, delegate cache). Use fallbacks so UI
/// never shows internal key names.
String trResolved(
  BuildContext context,
  String key, {
  required String fallbackVi,
  required String fallbackEn,
}) {
  try {
    final out = context.tr(key);
    if (out != key) return out;
  } catch (_) {
    // Localization delegate missing (should be rare).
  }
  return context.locale.languageCode == 'vi' ? fallbackVi : fallbackEn;
}
