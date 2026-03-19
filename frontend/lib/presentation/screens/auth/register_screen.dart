import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/di/injection.dart';
import '../../../core/preferences/app_preferences.dart';
import '../../../core/theme/app_palette_dark.dart';
import '../../../core/theme/app_palette_light.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/services/auth_service.dart';

/// Đăng ký — giao diện FinTracker: nút back, tiêu đề, input chỉ viền, nút đen/trắng, link Đăng nhập.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _loading = false;
  bool _sendingOtp = false;
  String? _errorMessage;
  String? _otpSentMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMessage = 'hint_email'.tr());
      return;
    }
    setState(() {
      _errorMessage = null;
      _otpSentMessage = null;
      _sendingOtp = true;
    });
    try {
      final auth = getIt<AuthService>();
      final res = await auth.requestRegisterOtp(email);
      if (!mounted) return;
      setState(() => _sendingOtp = false);
      if (res.isSuccess) {
        setState(() => _otpSentMessage = 'otp_sent_hint'.tr());
      } else {
        setState(() => _errorMessage = res.message);
      }
    } catch (_) {
      if (mounted) setState(() {
        _sendingOtp = false;
        _errorMessage = 'error_connection'.tr();
      });
    }
  }

  Future<void> _register() async {
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final auth = getIt<AuthService>();
      final otp = _otpController.text.trim();
      final res = await auth.register(RegisterRequest(
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        otp: otp.isEmpty ? null : otp,
      ));
      if (!mounted) return;
      setState(() => _loading = false);
      if (res.isSuccess && res.result != null) {
        getIt<AppPreferences>().updateFromUser(res.result!.user);
        context.go('/home');
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

  InputDecoration _inputDecoration({
    required String labelText,
    required String hintText,
    required IconData prefixIcon,
    bool isDark = false,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      prefixIcon: Icon(
        prefixIcon,
        color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
      ),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? PaletteDark.whiteColor : Colors.black,
          width: 2,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? PaletteDark.backgroundColor : Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  IconButton(
                    onPressed: () => context.go('/get-started'),
                    icon: Icon(
                      Icons.arrow_back_ios_new,
                      color: isDark ? PaletteDark.whiteColor : Colors.black87,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(height: 40),
                  Text(
                    'Tạo tài khoản',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      color: isDark ? PaletteDark.whiteColor : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'create_account_subtitle'.tr(),
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                    ),
                  ),
                  const SizedBox(height: 48),
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: (isDark ? PaletteDark.errorColor : PaletteLight.errorColor).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(
                          color: isDark ? PaletteDark.errorColor : PaletteLight.errorColor,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextFormField(
                    controller: _usernameController,
                    decoration: _inputDecoration(
                      labelText: 'full_name'.tr(),
                      hintText: 'hint_full_name'.tr(),
                      prefixIcon: Icons.person_outline,
                      isDark: isDark,
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'hint_full_name'.tr() : null,
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration(
                      labelText: 'email'.tr(),
                      hintText: 'hint_email'.tr(),
                      prefixIcon: Icons.email_outlined,
                      isDark: isDark,
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'hint_email'.tr() : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          decoration: _inputDecoration(
                            labelText: 'Mã OTP',
                            hintText: 'Nhập mã 6 số',
                            prefixIcon: Icons.pin_outlined,
                            isDark: isDark,
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Vui lòng nhập mã OTP';
                            if (v.length != 6) return 'Mã OTP phải có 6 số';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(
                        height: 56,
                        child: OutlinedButton(
                          onPressed: _sendingOtp
                              ? null
                              : () {
                                  if (_emailController.text.trim().isNotEmpty) _sendOtp();
                                },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: isDark ? PaletteDark.borderColor : PaletteLight.borderColor,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: _sendingOtp
                              ? SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text('Gửi mã', style: TextStyle(fontSize: 14)),
                        ),
                      ),
                    ],
                  ),
                  if (_otpSentMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _otpSentMessage!,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? PaletteDark.incomeColor : Colors.green.shade700,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: _inputDecoration(
                      labelText: 'password'.tr(),
                      hintText: 'password_min'.tr(),
                      prefixIcon: Icons.lock_outline,
                      isDark: isDark,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'hint_password'.tr();
                      if (v.length < 6) return 'password_min_6'.tr();
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    decoration: _inputDecoration(
                      labelText: 'confirm_password'.tr(),
                      hintText: 'hint_confirm_password'.tr(),
                      prefixIcon: Icons.lock_outline,
                      isDark: isDark,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                        ),
                        onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'hint_confirm_password_validation'.tr();
                      if (v != _passwordController.text) return 'password_mismatch'.tr();
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _loading
                          ? null
                          : () {
                              if (_formKey.currentState?.validate() ?? false) _register();
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? Colors.white : Colors.black,
                        foregroundColor: isDark ? Colors.black : Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _loading
                          ? SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: isDark ? Colors.black : Colors.white,
                              ),
                            )
                          : Text(
                              'register'.tr(),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton(
                      onPressed: () => context.pop(),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Đã có tài khoản? ',
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark ? PaletteDark.subtitleText : PaletteLight.subtitleText,
                            ),
                          ),
                          Text(
                            'login'.tr(),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isDark ? PaletteDark.whiteColor : Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
