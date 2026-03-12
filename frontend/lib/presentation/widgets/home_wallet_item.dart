import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../data/models/wallet_models.dart';

/// Một dòng ví trên homepage kiểu FinTracker.
class HomeWalletItem extends StatelessWidget {
  final Wallet wallet;

  const HomeWalletItem({super.key, required this.wallet});

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final formatted = _formatBalance(wallet.balance);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: CircleAvatar(
        radius: 22,
        backgroundColor: p.primaryAction.withValues(alpha: 0.2),
        child: Icon(Icons.account_balance_wallet_outlined, color: p.primaryAction, size: 20),
      ),
      title: Text(
        wallet.name,
        style: TextStyle(
          color: p.primaryText,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: Text(
        '$formatted ₫',
        style: TextStyle(
          color: p.primaryText,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }

  String _formatBalance(double value) {
    if (value.abs() >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    }
    if (value.abs() >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toStringAsFixed(0);
  }
}
