import 'package:flutter/material.dart';

import '../../core/theme/theme_palette.dart';
import '../../core/utils/currency_format.dart';
import '../../data/models/wallet_models.dart';

/// Một dòng ví trên homepage kiểu FinTracker.
class HomeWalletItem extends StatelessWidget {
  final Wallet wallet;

  const HomeWalletItem({super.key, required this.wallet});

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
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
        formatCurrencyAggregates(wallet.balance, suffix: wallet.currencySuffix),
        style: TextStyle(
          color: p.primaryText,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }
}
