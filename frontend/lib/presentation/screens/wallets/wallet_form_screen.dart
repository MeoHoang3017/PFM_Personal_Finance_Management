import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../core/utils/currency_format.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/wallet_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/wallet_service.dart';

class WalletFormScreen extends StatefulWidget {
  final Wallet? wallet;
  final String? walletId;

  const WalletFormScreen({super.key, this.wallet, this.walletId});

  @override
  State<WalletFormScreen> createState() => _WalletFormScreenState();
}

class _WalletFormScreenState extends State<WalletFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _balanceController = TextEditingController(text: '0');
  bool _loading = false;
  String? _errorMessage;
  UserInfo? _user;

  @override
  void initState() {
    super.initState();
    if (widget.wallet != null) {
      _nameController.text = widget.wallet!.name;
      _balanceController.text = widget.wallet!.balance.toStringAsFixed(0);
    }
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await getIt<AuthService>().getStoredUser();
    if (mounted) setState(() => _user = user);
  }

  String get _balanceCurrencyLabel {
    final c = (_user?.currency ?? 'USD').toUpperCase();
    return '$c (${currencySymbolFromCode(c)})';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _balanceController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_user == null) {
      setState(() => _errorMessage = 'Chưa đăng nhập');
      return;
    }
    final balance = double.tryParse(_balanceController.text.replaceAll(',', '')) ?? 0;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<WalletService>();
      if (widget.wallet != null) {
        final res = await svc.updateWallet(widget.wallet!.id, UpdateWalletData(name: _nameController.text.trim(), balance: balance));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          AppToast.showSuccess(context, 'Đã cập nhật ví');
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createWallet(CreateWalletData(name: _nameController.text.trim(), balance: balance, user: _user!.id));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          AppToast.showSuccess(context, 'wallet_added'.tr());
          Navigator.pop(context, true);
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'Lỗi kết nối';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isEdit = widget.wallet != null;
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(isEdit ? 'edit_wallet'.tr() : 'add_wallet'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: p.errorColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_errorMessage!, style: TextStyle(color: p.errorColor, fontSize: 13)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Tên ví',
                    hintText: 'Ví tiền mặt, Ngân hàng...',
                    prefixIcon: Icon(Icons.account_balance_wallet_outlined, color: p.iconMuted),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Nhập tên ví' : null,
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _balanceController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'wallet_balance'.tr(),
                    hintText: '0',
                    suffixText: _balanceCurrencyLabel,
                    prefixIcon: Icon(Icons.attach_money, color: p.iconMuted),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Nhập số dư';
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'Số không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 6),
                Text(
                  'wallet_balance_currency_hint'.tr(namedArgs: {'ccy': _balanceCurrencyLabel}),
                  style: TextStyle(fontSize: 12, color: p.subtitleText),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  height: 52,
                  child: FilledButton(
                    onPressed: _loading
                        ? null
                        : () {
                            if (_formKey.currentState?.validate() ?? false) _save();
                          },
                    style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                    child: _loading
                        ? SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Theme.of(context).colorScheme.onPrimary))
                        : Text(isEdit ? 'Cập nhật' : 'Thêm ví', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
