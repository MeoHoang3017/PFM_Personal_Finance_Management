import 'package:flutter/material.dart';

import '../../../core/theme/theme_palette.dart';
import 'dashboard_screen.dart';
import '../transactions/transactions_screen.dart';
import 'add_menu_screen.dart';
import '../budgets/budgets_screen.dart';
import '../profile/profile_screen.dart';

/// Home chính — giao diện FinTracker: BottomNavigationBar 5 tab (Tổng quan, Giao dịch, Thêm, Ngân sách, Cá nhân), ô giữa là nút Thêm.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  static const _tabs = [
    (icon: Icons.home_outlined, label: 'Tổng quan'),
    (icon: Icons.receipt_long_outlined, label: 'Giao dịch'),
    (icon: Icons.add, label: 'Thêm'),
    (icon: Icons.pie_chart_outline, label: 'Ngân sách'),
    (icon: Icons.person_outline, label: 'Cá nhân'),
  ];

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final pages = [
      DashboardScreen(
        onViewAllTransactions: () => setState(() => _currentIndex = 1),
      ),
      const TransactionsScreen(),
      const AddMenuScreen(),
      const BudgetsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: p.backgroundColor,
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: p.appBarBg,
        selectedItemColor: p.primaryAction,
        unselectedItemColor: p.subtitleText,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          BottomNavigationBarItem(
            icon: Icon(_tabs[0].icon),
            activeIcon: Icon(_tabs[0].icon),
            label: _tabs[0].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(_tabs[1].icon),
            activeIcon: Icon(_tabs[1].icon),
            label: _tabs[1].label,
          ),
          BottomNavigationBarItem(
            icon: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: p.primaryAction,
                child: const Icon(Icons.add, color: Colors.white, size: 24),
              ),
            ),
            activeIcon: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: p.primaryAction,
                child: const Icon(Icons.add, color: Colors.white, size: 24),
              ),
            ),
            label: _tabs[2].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(_tabs[3].icon),
            activeIcon: Icon(_tabs[3].icon),
            label: _tabs[3].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(_tabs[4].icon),
            activeIcon: Icon(_tabs[4].icon),
            label: _tabs[4].label,
          ),
        ],
      ),
    );
  }
}
