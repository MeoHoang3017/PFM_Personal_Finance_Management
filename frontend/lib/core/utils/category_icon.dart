import 'package:flutter/material.dart';

import '../../data/models/transaction_models.dart';

/// Ánh xạ chuỗi icon lưu trong DB (vd. restaurant) → [IconData].
IconData? iconFromCategoryKey(String? key) {
  if (key == null || key.isEmpty) return null;
  switch (key.trim().toLowerCase()) {
    case 'restaurant':
    case 'food':
      return Icons.restaurant;
    case 'directions_car':
    case 'car':
      return Icons.directions_car;
    case 'shopping_cart':
      return Icons.shopping_cart;
    case 'shopping_bag':
      return Icons.shopping_bag;
    case 'local_hospital':
    case 'medical_services':
      return Icons.local_hospital;
    case 'movie':
    case 'movie_filter':
      return Icons.movie;
    case 'home':
      return Icons.home;
    case 'school':
      return Icons.school;
    case 'phone_android':
    case 'devices':
      return Icons.phone_android;
    case 'card_giftcard':
      return Icons.card_giftcard;
    case 'account_balance_wallet':
    case 'wallet':
      return Icons.account_balance_wallet;
    case 'flight':
      return Icons.flight;
    case 'pets':
      return Icons.pets;
    default:
      return null;
  }
}

/// Icon theo tên danh mục (tiếng Việt / Anh).
IconData iconForCategoryLabel(String label) {
  final n = label.toLowerCase();
  if (n.isEmpty) return Icons.category;
  if (n.contains('ăn') || n.contains('uống') || n.contains('food') || n.contains('restaurant')) {
    return Icons.restaurant;
  }
  if (n.contains('di chuyển') || n.contains('xăng') || n.contains('transport') || n.contains('car')) {
    return Icons.directions_car;
  }
  if (n.contains('nhà') || n.contains('rent') || n.contains('home')) return Icons.home;
  if (n.contains('giải trí') || n.contains('entertain') || n.contains('movie')) return Icons.movie;
  if (n.contains('mua sắm') || n.contains('shopping')) return Icons.shopping_cart;
  if (n.contains('sức khỏe') || n.contains('health') || n.contains('medical')) return Icons.local_hospital;
  if (n.contains('giáo dục') || n.contains('education') || n.contains('school')) return Icons.school;
  if (n.contains('công nghệ') || n.contains('tech') || n.contains('phone')) return Icons.phone_android;
  if (n.contains('quà') || n.contains('gift')) return Icons.card_giftcard;
  if (n.contains('khác') || n.contains('other')) return Icons.category;
  return Icons.label_outline;
}

Color? colorFromHex(String? hex) {
  if (hex == null || hex.trim().isEmpty) return null;
  var s = hex.trim();
  if (s.startsWith('#')) s = s.substring(1);
  if (s.length == 6) {
    final v = int.tryParse(s, radix: 16);
    if (v == null) return null;
    return Color(0xFF000000 | v);
  }
  return null;
}

/// Icon cho một giao dịch: ưu tiên loại, sau đó tên danh mục.
IconData iconForTransaction(TransactionModel t) {
  if (t.type == TransactionType.exchange) return Icons.swap_horiz;
  if (t.type == TransactionType.income) return Icons.savings_outlined;
  final name = t.categoryDisplay;
  return iconForCategoryLabel(name);
}
