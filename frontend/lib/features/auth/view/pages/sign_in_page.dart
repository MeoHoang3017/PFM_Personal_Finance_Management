import 'package:flutter/material.dart';
import 'package:frontend/features/auth/view/widgets/auth_gradient_button.dart';
import 'package:frontend/features/auth/view/widgets/custom_field.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Padding(
        padding: const EdgeInsets.all(15.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: const Text(
                'Sign Up Page',
                style: TextStyle(fontSize: 50, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 30),
            CustomField(hintText: 'Email'),
            const SizedBox(height: 15),
            CustomField(hintText: 'Password'),
            const SizedBox(height: 15),
            CustomField(hintText: 'Confirm Password'),
            const SizedBox(height: 20),
            AuthGradientButton(),
          ],
        ),
      ),
    );
  }
}
