import 'package:flutter/material.dart';
import 'package:google_sign_in_web/web_only.dart' show renderButton;

/// Nút đăng nhập Google do GIS SDK render (chỉ web).
Widget buildWebGoogleSignInButton() => renderButton();
