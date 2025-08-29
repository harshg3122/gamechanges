import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import '../constants/colors.dart';

class BottomNavigation extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get the bottom padding to ensure we avoid the navigation bar
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final labels = ['Home', 'Results', 'History', 'Profile'];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.primary.withValues(alpha: 0.9), AppColors.primary],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CurvedNavigationBar(
            backgroundColor: Colors.transparent,
            color: Colors.transparent,
            buttonBackgroundColor: AppColors.secondary,
            height: 60 + (bottomPadding / 4), // Reduced height for labels
            animationDuration: const Duration(milliseconds: 300),
            animationCurve: Curves.easeInOut,
            index: currentIndex,
            items: <Widget>[
              _buildNavIcon(Icons.home_rounded, 0),
              _buildNavIcon(Icons.bar_chart_rounded, 1),
              _buildNavIcon(Icons.history_rounded, 2),
              _buildNavIcon(Icons.person_rounded, 3),
            ],
            onTap: onTap,
          ),
          Container(
            padding: EdgeInsets.only(
              bottom: bottomPadding > 0 ? bottomPadding / 2 : 8,
              top: 4,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: labels.asMap().entries.map((entry) {
                final index = entry.key;
                final label = entry.value;
                final isSelected = currentIndex == index;

                return Text(
                  label,
                  style: TextStyle(
                    fontSize: isSelected ? 12 : 11,
                    color: isSelected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.7),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, int index) {
    final isSelected = currentIndex == index;

    return Container(
      padding: const EdgeInsets.all(8),
      child: Icon(
        icon,
        size: isSelected ? 28 : 24,
        color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.8),
      ),
    );
  }
}
