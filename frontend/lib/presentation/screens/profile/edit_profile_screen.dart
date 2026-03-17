import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
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
  final _emailController = TextEditingController();
  bool _loading = false;
  bool _loadingData = true;
  String? _errorMessage;
  UserProfile? _profile;

  @override
  void initState() {
    super.initState();
    if (widget.initialProfile != null) {
      _profile = widget.initialProfile;
      _usernameController.text = widget.initialProfile!.username;
      _emailController.text = widget.initialProfile!.email;
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
        _emailController.text = res.result!.email;
      }
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
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
        email: _emailController.text.trim(),
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
        AppToast.showSuccess(context, 'profile_updated'.tr());
      } else {
        setState(() => _errorMessage = res.message);
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'error_connection'.tr();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: Text('profile_edit'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text('profile_edit'.tr())),
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
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: 'display_name'.tr(),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'hint_display_name'.tr() : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'email'.tr(),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'hint_email'.tr() : null,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading
                      ? null
                      : () {
                          if (_formKey.currentState?.validate() ?? false) _save();
                        },
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('update'.tr()),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
