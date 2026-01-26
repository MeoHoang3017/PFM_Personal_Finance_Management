import 'package:flutter/material.dart';

class CustomField extends StatelessWidget {
  final String? hintText;
  const CustomField({super.key, this.hintText});

  @override
  Widget build(BuildContext context) {
    return TextField(decoration: InputDecoration(labelText: hintText));
  }
}
