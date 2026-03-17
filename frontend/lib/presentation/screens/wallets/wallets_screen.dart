import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/currency_format.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/wallet_models.dart';
import '../../../data/services/wallet_service.dart';
import '../../widgets/section_card.dart';
import 'wallet_form_screen.dart';

class WalletsScreen extends StatefulWidget {
  const WalletsScreen({super.key});

  @override
  State<WalletsScreen> createState() => _WalletsScreenState();
}

class _WalletsScreenState extends State<WalletsScreen> {
  List<Wallet> _wallets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await getIt<WalletService>().getWallets();
      if (!mounted) return;
      setState(() {
        _wallets = res.isSuccess && res.result != null ? res.result!.data : [];
        _loading = false;
        _error = res.isSuccess ? null : res.message;
      });
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _error = 'error_load_wallets'.tr();
      });
    }
  }

  Future<void> _openForm([Wallet? wallet]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => WalletFormScreen(wallet: wallet),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _confirmDelete(Wallet w) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_wallet'.tr()),
        content: Text('delete_wallet_confirm'.tr(namedArgs: {'name': w.name})),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('cancel'.tr())),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text('delete'.tr()),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<WalletService>().deleteWallet(w.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'Đã xóa ví');
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('wallets'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
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
                            Text(_error!, style: TextStyle(color: p.errorColor), textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            FilledButton(onPressed: _load, child: Text('retry'.tr())),
                          ],
                        ),
                      )
                    : _wallets.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.account_balance_wallet_outlined, size: 64, color: p.iconMuted),
                                const SizedBox(height: 16),
                                Text('no_wallets'.tr(), style: TextStyle(color: p.primaryText, fontSize: 16, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                FilledButton.icon(
                                  onPressed: () => _openForm(),
                                  icon: const Icon(Icons.add),
                                  label: Text('add_wallet'.tr()),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: p.primaryAction,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              itemCount: _wallets.length,
                              itemBuilder: (context, index) {
                                final w = _wallets[index];
                                return SectionCard(
                                  padding: EdgeInsets.zero,
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      ListTile(
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        leading: CircleAvatar(
                                          radius: 22,
                                          backgroundColor: p.primaryAction.withValues(alpha: 0.2),
                                          child: Icon(Icons.account_balance_wallet_outlined, color: p.primaryAction, size: 20),
                                        ),
                                        title: Text(w.name, style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w500)),
                                        subtitle: Text(formatCurrency(w.balance), style: TextStyle(color: p.subtitleText, fontSize: 13)),
                                        trailing: PopupMenuButton<String>(
                                          icon: Icon(Icons.more_vert, color: p.iconMuted),
                                          onSelected: (v) {
                                            if (v == 'edit') _openForm(w);
                                            if (v == 'delete') _confirmDelete(w);
                                          },
                                          itemBuilder: (ctx) => [
                                            PopupMenuItem(value: 'edit', child: Text('edit'.tr())),
                                            PopupMenuItem(value: 'delete', child: Text('delete'.tr())),
                                          ],
                                        ),
                                        onTap: () => _openForm(w),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: _wallets.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _openForm(),
              backgroundColor: p.primaryAction,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
