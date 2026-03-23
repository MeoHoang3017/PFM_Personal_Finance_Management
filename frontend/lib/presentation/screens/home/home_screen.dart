import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/app/home_data_notifier.dart';
import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import 'dashboard_screen.dart';
import '../transactions/transactions_screen.dart';
import 'add_menu_screen.dart';
import '../budgets/budgets_screen.dart';
import '../profile/profile_screen.dart';

/// Home chính — BottomNavigationBar 5 tab (Tổng quan, Giao dịch, Thêm, Ngân sách, Cá nhân).
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey _dashboardKey = GlobalKey();
  final GlobalKey _budgetsKey = GlobalKey();
  final GlobalKey _transactionsKey = GlobalKey();

  static List<({IconData icon, String label})> _tabs(BuildContext context) => [
    (icon: Icons.home_outlined, label: 'nav_overview'.tr()),
    (icon: Icons.receipt_long_outlined, label: 'nav_transactions'.tr()),
    (icon: Icons.add, label: 'nav_add'.tr()),
    (icon: Icons.pie_chart_outline, label: 'nav_budget'.tr()),
    (icon: Icons.person_outline, label: 'nav_profile'.tr()),
  ];

  void _refreshOverviewAndBudgets() {
    (_dashboardKey.currentState as dynamic)?.refresh();
    (_budgetsKey.currentState as dynamic)?.refresh();
  }

  /// Sau CRUD giao dịch / đổi tiền tệ / hub: làm mới tổng quan, ngân sách, danh sách giao dịch.
  void _refreshAll() {
    _refreshOverviewAndBudgets();
    (_transactionsKey.currentState as dynamic)?.refresh(force: true);
  }

  void _onHomeHubNotify() {
    if (!mounted) return;
    _refreshAll();
  }

  void _onTransactionSaved() {
    _refreshAll();
  }

  @override
  void initState() {
    super.initState();
    getIt<HomeDataNotifier>().addListener(_onHomeHubNotify);
  }

  @override
  void dispose() {
    getIt<HomeDataNotifier>().removeListener(_onHomeHubNotify);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final tabs = _tabs(context);
    final pages = [
      DashboardScreen(
        key: _dashboardKey,
        onViewAllTransactions: () => setState(() => _currentIndex = 1),
        onViewAllBudgets: () => setState(() => _currentIndex = 3),
      ),
      TransactionsScreen(
        key: _transactionsKey,
        onTransactionSaved: _onTransactionSaved,
      ),
      AddMenuScreen(onDataChanged: () => getIt<HomeDataNotifier>().requestRefresh(force: true)),
      BudgetsScreen(key: _budgetsKey),
      ProfileScreen(
        onHomeDataChanged: () => getIt<HomeDataNotifier>().requestRefresh(force: true),
      ),
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
        onTap: (index) {
          setState(() => _currentIndex = index);
          // Vào tab Giao dịch: fetch lại danh sách (theo tháng đang chọn); force để luôn có dữ liệu mới khi quay lại tab.
          if (index == 1) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              (_transactionsKey.currentState as dynamic)?.refresh(force: true);
            });
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(tabs[0].icon),
            activeIcon: Icon(tabs[0].icon),
            label: tabs[0].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(tabs[1].icon),
            activeIcon: Icon(tabs[1].icon),
            label: tabs[1].label,
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
            label: tabs[2].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(tabs[3].icon),
            activeIcon: Icon(tabs[3].icon),
            label: tabs[3].label,
          ),
          BottomNavigationBarItem(
            icon: Icon(tabs[4].icon),
            activeIcon: Icon(tabs[4].icon),
            label: tabs[4].label,
          ),
        ],
      ),
    );
  }
}
