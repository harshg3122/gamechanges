import 'package:flutter/material.dart';
import '../widgets/bottom_navigation.dart';
import '../screens/dashboard_screen.dart';
import '../screens/results_screen.dart';
import '../screens/history_screen.dart';
import '../screens/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  // Using static to allow external access to control current tab
  static int _currentTab = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const ResultsScreen(),
    const HistoryScreen(),
    const ProfileScreen(),
  ];

  void _onTabTapped(int index) {
    setState(() {
      _currentTab = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentTab, children: _screens),
      bottomNavigationBar: BottomNavigation(
        currentIndex: _currentTab,
        onTap: _onTabTapped,
      ),
      extendBody: true, // Important for curved navigation bar to work properly
      backgroundColor: const Color(0xFFF8F9FA), // Light background
    );
  }
}
