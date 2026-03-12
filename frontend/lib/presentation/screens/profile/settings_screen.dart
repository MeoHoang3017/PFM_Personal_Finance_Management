import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/user_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/user_service.dart';

class SettingsScreen extends StatefulWidget {
  final UserProfile? initialProfile;

  const SettingsScreen({super.key, this.initialProfile});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _loading = false;
  bool _loadingData = true;
  String? _errorMessage;
  UserProfile? _profile;
  String _theme = 'light';
  String _language = 'vi';
  String _currency = 'VND';

  static const _themes = ['light', 'dark'];
  static const _languages = ['vi', 'en'];
  static const _currencies = ['VND', 'USD'];

  @override
  void initState() {
    super.initState();
    if (widget.initialProfile != null) {
      _profile = widget.initialProfile;
      _theme = widget.initialProfile!.theme;
      _language = widget.initialProfile!.language;
      _currency = widget.initialProfile!.currency;
      _loadingData = false;
    } else {
      _load();
    }
  }

  Future<void> _load() async {
    final res = await getIt<UserService>().getProfile();
    if (!mounted) return;
    setState(() {
      _loadingData = false;
      if (res.isSuccess && res.result != null) {
        _profile = res.result;
        _theme = res.result!.theme;
        _language = res.result!.language;
        _currency = res.result!.currency;
      }
    });
  }

  Future<void> _save() async {
    if (_profile == null) return;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final res = await getIt<UserService>().updateSettings(UpdateUserSettingsData(
        theme: _theme,
        language: _language,
        currency: _currency,
      ));
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess && res.result != null) {
        final p = res.result!;
        await getIt<AuthService>().updateStoredUser(UserInfo(
          id: p.id,
          username: p.username,
          email: p.email,
          theme: p.theme,
          language: p.language,
          currency: p.currency,
          avatarUrl: p.avatarUrl,
        ));
        if (!mounted) return;
        Navigator.pop(context, true);
        AppToast.showSuccess(context, 'Đã lưu cài đặt');
      } else {
        setState(() => _errorMessage = res.message);
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
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cài đặt')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Cài đặt')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
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
              DropdownButtonFormField<String>(
                value: _theme,
                decoration: const InputDecoration(labelText: 'Giao diện', border: OutlineInputBorder()),
                items: _themes.map((t) => DropdownMenuItem(value: t, child: Text(t == 'light' ? 'Sáng' : 'Tối'))).toList(),
                onChanged: (v) => setState(() => _theme = v ?? _theme),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _language,
                decoration: const InputDecoration(labelText: 'Ngôn ngữ', border: OutlineInputBorder()),
                items: _languages.map((t) => DropdownMenuItem(value: t, child: Text(t == 'vi' ? 'Tiếng Việt' : 'English'))).toList(),
                onChanged: (v) => setState(() => _language = v ?? _language),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _currency,
                decoration: const InputDecoration(labelText: 'Đơn vị tiền tệ', border: OutlineInputBorder()),
                items: _currencies.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _currency = v ?? _currency),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _save,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Lưu'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
