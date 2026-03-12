import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../data/models/transaction_models.dart';
import '../../../data/models/wallet_models.dart';
import '../../../data/services/transaction_service.dart';
import '../../../data/services/wallet_service.dart';
import '../../widgets/section_card.dart';
import '../../widgets/section_header.dart';
import '../../widgets/home_wallet_item.dart';
import '../../widgets/home_transaction_item.dart';
import '../../widgets/home_top_spending.dart';
import '../../widgets/home_spending_chart.dart';
import '../wallets/wallets_screen.dart';
import '../transactions/transaction_form_screen.dart';
import '../report/report_detail_screen.dart';
import '../report/top_spending_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onViewAllTransactions;

  const DashboardScreen({super.key, this.onViewAllTransactions});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Wallet> _wallets = [];
  List<TransactionModel> _transactions = [];
  double _totalBalance = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Tải ví và giao dịch từ backend. Chart, báo cáo (khi mở màn), top spending và giao dịch gần đây đều dùng dữ liệu thật từ API.
  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final walletRes = await getIt<WalletService>().getWallets(pageSize: 100);
      final txRes = await getIt<TransactionService>().getTransactions(page: 1, pageSize: 200);

      double total = 0;
      if (walletRes.isSuccess && walletRes.result != null) {
        _wallets = walletRes.result!.data;
        for (final w in _wallets) {
          total += w.balance;
        }
      }
      if (txRes.isSuccess && txRes.result != null) {
        _transactions = txRes.result!.data; // Dữ liệu từ backend cho chart, top spending, giao dịch gần đây
      }
      if (!mounted) return;
      setState(() {
        _totalBalance = total;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Không tải được dữ liệu';
        });
      }
    }
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

  List<TransactionModel> get _recentTransactions {
    final list = List<TransactionModel>.from(_transactions);
    list.sort((a, b) => b.date.compareTo(a.date));
    return list.take(5).toList();
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        backgroundColor: p.appBarBg,
        elevation: 0,
        title: Row(
          children: [
            Text(
              '${_formatBalance(_totalBalance)} ₫',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.2,
                color: p.primaryAction,
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.visibility_outlined, size: 18, color: p.iconMuted),
          ],
        ),
        foregroundColor: p.primaryText,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: p.iconMuted),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [p.primaryAction, p.expenseColor],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(color: p.primaryAction))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _error!,
                              style: TextStyle(color: p.errorColor),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            FilledButton(onPressed: _load, child: const Text('Thử lại')),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        color: p.primaryAction,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 6),
                              // 1. Ví của tôi
                              SectionCard(
                                padding: EdgeInsets.zero,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SectionHeader(
                                      title: 'Ví của tôi',
                                      actionText: 'Xem tất cả',
                                      onActionTap: () async {
                                        await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => const WalletsScreen(),
                                          ),
                                        );
                                        _load();
                                      },
                                    ),
                                    Divider(height: 1, color: p.borderColor),
                                    if (_wallets.isEmpty)
                                      Padding(
                                        padding: const EdgeInsets.all(24),
                                        child: Text(
                                          'Chưa có ví. Thêm ví từ tab Thêm.',
                                          style: TextStyle(color: p.subtitleText, fontSize: 14),
                                        ),
                                      )
                                    else
                                      Column(
                                        children: [
                                          for (int i = 0; i < _wallets.length && i < 5; i++) ...[
                                            HomeWalletItem(wallet: _wallets[i]),
                                            if (i < _wallets.length - 1 && i < 4)
                                              Divider(
                                                height: 1,
                                                indent: 72,
                                                endIndent: 16,
                                                color: p.borderColor.withValues(alpha: 0.6),
                                              ),
                                          ],
                                        ],
                                      ),
                                  ],
                                ),
                              ),
                              // 2. Báo cáo tháng này (chart thu/chi)
                              SectionCard(
                                padding: EdgeInsets.zero,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SectionHeader(
                                      title: 'Báo cáo tháng này',
                                      actionText: 'Xem báo cáo',
                                      onActionTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => const ReportDetailScreen(),
                                          ),
                                        );
                                      },
                                    ),
                                    Divider(height: 1, color: p.borderColor),
                                    Padding(
                                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                                      child: HomeSpendingChart(transactions: _transactions),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),
                              // 3. Chi tiêu nhiều nhất
                              HomeTopSpending(
                                transactions: _transactions,
                                onViewDetail: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const TopSpendingDetailScreen(),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(height: 6),
                              // 4. Giao dịch gần đây
                              SectionCard(
                                padding: EdgeInsets.zero,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SectionHeader(
                                      title: 'Giao dịch gần đây',
                                      actionText: 'Xem tất cả',
                                      onActionTap: widget.onViewAllTransactions,
                                    ),
                                    Divider(height: 1, color: p.borderColor),
                                    if (_recentTransactions.isEmpty)
                                      Padding(
                                        padding: const EdgeInsets.all(24),
                                        child: Text(
                                          'Chưa có giao dịch.',
                                          style: TextStyle(color: p.subtitleText, fontSize: 14),
                                        ),
                                      )
                                    else
                                      Column(
                                        children: [
                                          for (final t in _recentTransactions)
                                            HomeTransactionItem(
                                              transaction: t,
                                              onTap: () async {
                                                final ok = await Navigator.push<bool>(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) =>
                                                        TransactionFormScreen(transaction: t),
                                                  ),
                                                );
                                                if (ok == true && mounted) _load();
                                              },
                                            ),
                                          const SizedBox(height: 8),
                                        ],
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
