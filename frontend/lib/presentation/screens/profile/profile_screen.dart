import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/user_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/user_service.dart';
import '../../widgets/section_card.dart';
import '../categories/categories_screen.dart';
import '../wallets/wallets_screen.dart';
import 'change_password_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  /// Sau khi lưu cài đặt / hồ sơ hoặc quay lại từ màn quản lý ví–danh mục — làm mới Tổng quan & giao dịch.
  final VoidCallback? onHomeDataChanged;

  const ProfileScreen({super.key, this.onHomeDataChanged});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserInfo? _user;
  UserProfile? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = getIt<AuthService>();
    UserInfo? user = await auth.getStoredUser();
    final profileRes = await getIt<UserService>().getProfile();
    if (!mounted) return;
    if (profileRes.isSuccess && profileRes.result != null) {
      _profile = profileRes.result;
      user ??= UserInfo(
        id: _profile!.id,
        username: _profile!.username,
        email: _profile!.email,
        theme: _profile!.theme,
        language: _profile!.language,
        currency: _profile!.currency,
        avatarUrl: _profile!.avatarUrl,
      );
    }
    setState(() {
      _user = user;
      _loading = false;
    });
  }

  Future<void> _logout() async {
    await getIt<AuthService>().logout();
    if (!mounted) return;
    context.go('/get-started');
  }

  Future<void> _confirmDeleteAccount() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_account'.tr()),
        content: Text('delete_account_confirm'.tr()),
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
    final res = await getIt<UserService>().deleteProfile();
    if (!mounted) return;
    if (res.isSuccess) {
      AppToast.showSuccess(context, 'account_deleted'.tr());
      await getIt<AuthService>().logout();
      if (!mounted) return;
      context.go('/login');
    } else {
      AppToast.showError(context, res.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    if (_loading) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: AppBar(
        title: Text('nav_profile'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
        ),
        body: Center(child: CircularProgressIndicator(color: p.primaryAction)),
      );
    }
    final u = _user;
    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('nav_profile'.tr(), style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
        backgroundColor: p.appBarBg,
        elevation: 0,
        foregroundColor: p.primaryText,
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
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                SectionCard(
                  padding: const EdgeInsets.all(16),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 28,
                      backgroundColor: p.primaryAction.withValues(alpha: 0.2),
                      child: Text(
                        (u?.username.isNotEmpty == true) ? u!.username[0].toUpperCase() : '?',
                        style: TextStyle(color: p.primaryAction, fontSize: 22, fontWeight: FontWeight.w600),
                      ),
                    ),
                    title: Text(u?.username ?? '--', style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w600)),
                    subtitle: Text(u?.email ?? '--', style: TextStyle(color: p.subtitleText, fontSize: 13)),
                  ),
                ),
                const SizedBox(height: 12),
                SectionCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _profileTile(context, p, Icons.person_outline, 'profile_edit'.tr(), () async {
                        final result = await Navigator.push<bool>(
                          context,
                          MaterialPageRoute(builder: (context) => EditProfileScreen(initialProfile: _profile)),
                        );
                        if (result == true) {
                          await _load();
                          widget.onHomeDataChanged?.call();
                        }
                      }),
                      Divider(height: 1, color: p.borderColor),
                      _profileTile(context, p, Icons.lock_outline, 'change_password'.tr(), () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const ChangePasswordScreen()));
                      }),
                      Divider(height: 1, color: p.borderColor),
                      _profileTile(context, p, Icons.category_outlined, 'manage_categories'.tr(), () async {
                        await Navigator.push<void>(
                          context,
                          MaterialPageRoute(builder: (context) => const CategoriesScreen()),
                        );
                        if (mounted) widget.onHomeDataChanged?.call();
                      }),
                      Divider(height: 1, color: p.borderColor),
                      _profileTile(context, p, Icons.account_balance_wallet_outlined, 'manage_wallets'.tr(), () async {
                        await Navigator.push<void>(
                          context,
                          MaterialPageRoute(builder: (context) => const WalletsScreen()),
                        );
                        if (mounted) widget.onHomeDataChanged?.call();
                      }),
                      Divider(height: 1, color: p.borderColor),
                      _profileTile(context, p, Icons.delete_outline, 'delete_account'.tr(), _confirmDeleteAccount, isDestructive: true),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: _logout,
                    icon: const Icon(Icons.logout, size: 20),
                    label: Text('logout'.tr()),
                    style: FilledButton.styleFrom(
                      backgroundColor: p.errorColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _profileTile(BuildContext context, PaletteColors p, IconData icon, String title, VoidCallback onTap, {bool isDestructive = false}) {
    final color = isDestructive ? p.errorColor : p.primaryText;
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right, color: p.iconMuted, size: 20),
      onTap: onTap,
    );
  }
}
