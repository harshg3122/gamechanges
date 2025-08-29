import 'package:flutter/material.dart';

class AppColors {
  // Primary colors
  static const Color primary = Color(0xFFF39C12); // Orange (main theme)
  static const Color secondary = Color(0xFF4834DF); // Royal Blue (secondary)
  static const Color accent = Color(0xFF20BF6B); // Turquoise Green

  // Background colors
  static const Color background = Color(0xFFF8F9FA);
  static const Color cardBackground = Colors.white;
  static const Color darkBackground = Color(0xFF2C3E50);

  // Text colors
  static const Color textPrimary = Color(0xFF2C3E50);
  static const Color textSecondary = Color(0xFF636E72);
  static const Color textLight = Color(0xFFB2BEC3);

  // Game class colors
  static const Color classA = Color(0xFFF39C12); // Orange
  static const Color classB = Color(0xFFFF6B6B); // Coral Red
  static const Color classC = Color(0xFF20BF6B); // Turquoise Green

  // Status colors
  static const Color success = Color(0xFF2ED573);
  static const Color error = Color(0xFFFF4757);
  static const Color warning = Color(0xFFFFAE00);
  static const Color info = Color(0xFF70A1FF);
  static const Color pending = Color(0xFF7F8FA6);

  // Gradient colors
  static const Color gradientStart = Color(0xFFF39C12); // Orange
  static const Color gradientEnd = Color(0xFFE67E22); // Darker Orange
  static const Color orangeGradientStart = Color(0xFFF39C12);
  static const Color orangeGradientEnd = Color(0xFFE67E22);
  static const Color greenGradientStart = Color(0xFF20BF6B);
  static const Color greenGradientEnd = Color(0xFF0DA751);

  // Number button colors - more vibrant set with orange theme
  static const List<Color> numberColors = [
    Color(0xFFF39C12), // Orange (primary)
    Color(0xFFE67E22), // Darker Orange
    Color(0xFFFF6B6B), // Coral Red
    Color(0xFF20BF6B), // Turquoise Green
    Color(0xFF4834DF), // Royal Blue
    Color(0xFF8E44AD), // Purple
    Color(0xFF3498DB), // Sky Blue
    Color(0xFFE74C3C), // Red
    Color(0xFF1ABC9C), // Teal
    Color(0xFFD980FA), // Light Purple
    Color(0xFFEA2027), // Red
    Color(0xFF009432), // Green
  ];

  // Transaction colors
  static const Color deposit = Color(0xFF26DE81);
  static const Color withdraw = Color(0xFFEB3B5A);
  static const Color bet = Color(0xFF4834DF);
  static const Color winAmount = Color(0xFF2ED573);

  // Card gradients
  static List<List<Color>> cardGradients = [
    [Color(0xFF4834DF), Color(0xFF6F5AE3)],
    [Color(0xFFFF6B6B), Color(0xFFFF9F80)],
    [Color(0xFF20BF6B), Color(0xFF2CDE85)],
  ];
}
