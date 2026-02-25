import 'package:flutter/material.dart';

import 'dashboard_screen.dart';
import '../wallets/wallets_screen.dart';
import '../transactions/transactions_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  static const _tabs = [
    (icon: Icons.dashboard_outlined, label: 'Tổng quan'),
    (icon: Icons.account_balance_wallet_outlined, label: 'Ví'),
    (icon: Icons.receipt_long_outlined, label: 'Giao dịch'),
    (icon: Icons.person_outline, label: 'Cá nhân'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          DashboardScreen(),
          WalletsScreen(),
          TransactionsScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: _tabs
            .map((t) => NavigationDestination(
                  icon: Icon(t.icon),
                  selectedIcon: Icon(t.icon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}
