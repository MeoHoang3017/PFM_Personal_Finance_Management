import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/tr_resolved.dart';
import '../../../core/preferences/app_preferences.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/user_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/user_service.dart';

class EditProfileScreen extends StatefulWidget {
  final UserProfile? initialProfile;

  const EditProfileScreen({super.key, this.initialProfile});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
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
      _usernameController.text = widget.initialProfile!.username;
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
        _usernameController.text = res.result!.username;
        _theme = res.result!.theme;
        _language = res.result!.language;
        _currency = res.result!.currency;
      }
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_profile == null) return;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final res = await getIt<UserService>().updateProfile(UpdateProfileData(
        username: _usernameController.text.trim(),
        theme: _theme,
        language: _language,
        currency: _currency,
      ));
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess && res.result != null) {
        final p = res.result!;
        final userInfo = UserInfo(
          id: p.id,
          username: p.username,
          email: p.email,
          theme: p.theme,
          language: p.language,
          currency: p.currency,
          avatarUrl: p.avatarUrl,
        );
        await getIt<AuthService>().updateStoredUser(userInfo);
        if (!mounted) return;
        getIt<AppPreferences>().updateFromUser(userInfo);
        await context.setLocale(Locale(_language));
        if (!mounted) return;
        AppToast.showSuccess(context, context.tr('profile_updated'));
        Navigator.pop(context, true);
      } else {
        setState(() => _errorMessage = res.message);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = context.tr('error_connection');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: Text(context.tr('profile_edit'))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('profile_edit'))),
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
                Text(
                  trResolved(
                    context,
                    'profile_section_account',
                    fallbackVi: 'Tài khoản',
                    fallbackEn: 'Account',
                  ),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: context.tr('display_name'),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? context.tr('hint_display_name') : null,
                ),
                const SizedBox(height: 16),
                InputDecorator(
                  decoration: InputDecoration(
                    labelText: context.tr('email'),
                    helperText: trResolved(
                      context,
                      'email_readonly_hint',
                      fallbackVi: 'Không thể đổi email tại đây',
                      fallbackEn: 'Email cannot be changed here',
                    ),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                  child: SelectableText(
                    _profile?.email ?? '',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  context.tr('settings'),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _theme,
                  decoration: InputDecoration(
                    labelText: context.tr('theme_label'),
                    border: const OutlineInputBorder(),
                  ),
                  items: _themes
                      .map((t) => DropdownMenuItem(
                            value: t,
                            child: Text(
                              t == 'light'
                                  ? context.tr('theme_light')
                                  : context.tr('theme_dark'),
                            ),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _theme = v ?? _theme),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _language,
                  decoration: InputDecoration(
                    labelText: context.tr('language_label'),
                    border: const OutlineInputBorder(),
                  ),
                  items: _languages
                      .map((t) => DropdownMenuItem(
                            value: t,
                            child: Text(
                              t == 'vi' ? context.tr('lang_vi') : context.tr('lang_en'),
                            ),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _language = v ?? _language),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _currency,
                  decoration: InputDecoration(
                    labelText: context.tr('currency_label'),
                    border: const OutlineInputBorder(),
                  ),
                  items: _currencies.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => setState(() => _currency = v ?? _currency),
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _loading
                      ? null
                      : () {
                          if (_formKey.currentState?.validate() ?? false) _save();
                        },
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(context.tr('save')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
