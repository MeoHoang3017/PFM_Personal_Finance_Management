import 'package:flutter/material.dart';

import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../transactions/transaction_form_screen.dart';
import '../wallets/wallet_form_screen.dart';
import '../budgets/budget_form_screen.dart';
import '../goals/goal_form_screen.dart';

/// Màn "Thêm" kiểu FinTracker: nút bấm Thêm giao dịch, Thêm ví, Thêm ngân sách, Thêm mục tiêu.
class AddMenuScreen extends StatelessWidget {
  const AddMenuScreen({super.key});

  Future<void> _openTransaction(BuildContext context) async {
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const TransactionFormScreen(),
      ),
    );
    if (ok == true && context.mounted) {
      AppToast.showSuccess(context, 'Đã thêm giao dịch');
    }
  }

  Future<void> _openWallet(BuildContext context) async {
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const WalletFormScreen(),
      ),
    );
    if (ok == true && context.mounted) {
      AppToast.showSuccess(context, 'Đã thêm ví');
    }
  }

  Future<void> _openBudget(BuildContext context) async {
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const BudgetFormScreen(),
      ),
    );
    if (ok == true && context.mounted) {
      AppToast.showSuccess(context, 'Đã thêm ngân sách');
    }
  }

  Future<void> _openGoal(BuildContext context) async {
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const GoalFormScreen(),
      ),
    );
    if (ok == true && context.mounted) {
      AppToast.showSuccess(context, 'Đã thêm mục tiêu');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Text(
                'Thêm mới',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: p.primaryText,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Chọn loại bạn muốn thêm',
                style: TextStyle(
                  fontSize: 14,
                  color: p.subtitleText,
                ),
              ),
              const SizedBox(height: 32),
              _OptionTile(
                icon: Icons.receipt_long_outlined,
                title: 'Thêm giao dịch',
                subtitle: 'Thu chi, chuyển khoản',
                color: p.primaryAction,
                onTap: () => _openTransaction(context),
              ),
              const SizedBox(height: 12),
              _OptionTile(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Thêm ví',
                subtitle: 'Ví tiền mặt, ngân hàng',
                color: p.primaryAction,
                onTap: () => _openWallet(context),
              ),
              const SizedBox(height: 12),
              _OptionTile(
                icon: Icons.pie_chart_outline,
                title: 'Thêm ngân sách',
                subtitle: 'Đặt giới hạn chi tiêu',
                color: p.expenseColor,
                onTap: () => _openBudget(context),
              ),
              const SizedBox(height: 12),
              _OptionTile(
                icon: Icons.flag_outlined,
                title: 'Thêm mục tiêu',
                subtitle: 'Tiết kiệm, mục tiêu tài chính',
                color: p.incomeColor,
                onTap: () => _openGoal(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _OptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Material(
      color: p.cardSurface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: p.primaryText,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: p.subtitleText,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: p.iconMuted),
            ],
          ),
        ),
      ),
    );
  }
}
