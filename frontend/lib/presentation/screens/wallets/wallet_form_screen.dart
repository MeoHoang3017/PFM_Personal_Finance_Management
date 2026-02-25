import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
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
          Navigator.pop(context, true);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã cập nhật ví')));
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createWallet(CreateWalletData(name: _nameController.text.trim(), balance: balance, user: _user!.id));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã thêm ví')));
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
    final isEdit = widget.wallet != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Sửa ví' : 'Thêm ví'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_errorMessage!, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tên ví',
                    hintText: 'Ví tiền mặt, Ngân hàng...',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Nhập tên ví' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _balanceController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Số dư hiện tại',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Nhập số dư';
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'Số không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : () {
                    if (_formKey.currentState?.validate() ?? false) _save();
                  },
                  child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(isEdit ? 'Cập nhật' : 'Thêm ví'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
