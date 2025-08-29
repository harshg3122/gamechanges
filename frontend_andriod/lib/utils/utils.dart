import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../constants/colors.dart';

class Utils {
  // Show toast message
  static void showToast(String message, {bool isError = false}) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      timeInSecForIosWeb: 1,
      backgroundColor: isError ? AppColors.error : AppColors.success,
      textColor: Colors.white,
      fontSize: 16.0,
    );
  }

  // Format currency
  static String formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0)} Tokens';
  }

  // Get color based on game class
  static Color getColorByClass(String gameClass) {
    switch (gameClass) {
      case 'A':
        return AppColors.classA;
      case 'B':
        return AppColors.classB;
      case 'C':
        return AppColors.classC;
      default:
        return AppColors.primary;
    }
  }

  // Get class description
  static String getClassDescription(String gameClass) {
    switch (gameClass) {
      case 'A':
        return 'Class A: Triple Same Digits\nNumbers like 111, 222, 333, etc. where all three digits are the same.';
      case 'B':
        return 'Class B: Double Same Digits\nNumbers like 112, 113, 223, etc. where exactly two digits are the same.';
      case 'C':
        return 'Class C: All Different Digits\nNumbers like 123, 456, 789, etc. where all three digits are different.';
      default:
        return '';
    }
  }

  // Generate random color from predefined list
  static Color getRandomColor(int index) {
    return AppColors.numberColors[index % AppColors.numberColors.length];
  }

  // Validate email
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  // Format date
  static String formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}';
  }
}
