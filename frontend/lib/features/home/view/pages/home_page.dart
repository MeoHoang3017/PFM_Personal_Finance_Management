import 'package:flutter/material.dart';
import 'package:frontend/core/theme/theme_provider.dart';
import 'package:frontend/core/theme/app_pallete_dark.dart';
import 'package:frontend/core/theme/app_pallete_light.dart';
import 'package:provider/provider.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;

    return Scaffold(
      backgroundColor: isDark
          ? PalleteDark.backgroundColor
          : PalleteLight.backgroundColor,
      appBar: AppBar(
        title: const Text('Personal Finance Manager'),
        backgroundColor: isDark
            ? PalleteDark.cardColor
            : PalleteLight.cardColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              color: isDark ? Colors.amber : Colors.indigo,
            ),
            onPressed: () {
              themeProvider.toggleTheme();
            },
            tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Card(
                color: isDark ? PalleteDark.cardColor : PalleteLight.cardColor,
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [
                        isDark ? PalleteDark.gradient1 : PalleteLight.gradient1,
                        isDark ? PalleteDark.gradient2 : PalleteLight.gradient2,
                        isDark ? PalleteDark.gradient3 : PalleteLight.gradient3,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome Back!',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Manage your finances with ease',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Theme Settings Section
              Text(
                'Theme Settings',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),

              Card(
                color: isDark ? PalleteDark.cardColor : PalleteLight.cardColor,
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: isDark
                        ? PalleteDark.borderColor
                        : PalleteLight.borderColor,
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: Icon(
                        Icons.dark_mode,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      title: Text(
                        'Dark Mode',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      trailing: Switch(
                        value: isDark,
                        onChanged: (value) {
                          themeProvider.toggleTheme();
                        },
                        activeColor: isDark
                            ? PalleteDark.gradient1
                            : PalleteLight.gradient1,
                      ),
                    ),
                    Divider(
                      height: 1,
                      color: isDark
                          ? PalleteDark.borderColor
                          : PalleteLight.borderColor,
                    ),
                    ListTile(
                      leading: Icon(
                        Icons.light_mode,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      title: Text(
                        'Light Mode',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      trailing: Switch(
                        value: !isDark,
                        onChanged: (value) {
                          themeProvider.toggleTheme();
                        },
                        activeColor: isDark
                            ? PalleteDark.gradient2
                            : PalleteLight.gradient2,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Current Theme Display
              Text(
                'Current Theme',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),

              Card(
                color: isDark ? PalleteDark.cardColor : PalleteLight.cardColor,
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: isDark
                        ? PalleteDark.borderColor
                        : PalleteLight.borderColor,
                    width: 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? PalleteDark.backgroundColor
                                  : PalleteLight.backgroundColor,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark
                                    ? PalleteDark.borderColor
                                    : PalleteLight.borderColor,
                                width: 2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isDark ? 'Dark Theme' : 'Light Theme',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? Colors.white
                                        : Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isDark
                                      ? 'Perfect for low-light environments'
                                      : 'Bright and clear for daytime use',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: isDark
                                        ? PalleteDark.subtitleText
                                        : PalleteLight.subtitleText,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text(
                        'Theme Colors Preview',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildColorCircle(
                            isDark
                                ? PalleteDark.gradient1
                                : PalleteLight.gradient1,
                            'Primary',
                          ),
                          const SizedBox(width: 12),
                          _buildColorCircle(
                            isDark
                                ? PalleteDark.gradient2
                                : PalleteLight.gradient2,
                            'Secondary',
                          ),
                          const SizedBox(width: 12),
                          _buildColorCircle(
                            isDark
                                ? PalleteDark.gradient3
                                : PalleteLight.gradient3,
                            'Accent',
                          ),
                          const SizedBox(width: 12),
                          _buildColorCircle(
                            isDark
                                ? PalleteDark.greenColor
                                : PalleteLight.greenColor,
                            'Success',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: _buildActionCard(
                      context,
                      icon: Icons.add_circle_outline,
                      title: 'Add Transaction',
                      color: isDark
                          ? PalleteDark.gradient1
                          : PalleteLight.gradient1,
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionCard(
                      context,
                      icon: Icons.analytics_outlined,
                      title: 'View Analytics',
                      color: isDark
                          ? PalleteDark.gradient2
                          : PalleteLight.gradient2,
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildActionCard(
                      context,
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'Budget',
                      color: isDark
                          ? PalleteDark.gradient3
                          : PalleteLight.gradient3,
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionCard(
                      context,
                      icon: Icons.settings_outlined,
                      title: 'Settings',
                      color: isDark
                          ? PalleteDark.greenColor
                          : PalleteLight.greenColor,
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildColorCircle(Color color, String label) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required bool isDark,
  }) {
    return Card(
      color: isDark ? PalleteDark.cardColor : PalleteLight.cardColor,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isDark ? PalleteDark.borderColor : PalleteLight.borderColor,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          // Add action handler
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
