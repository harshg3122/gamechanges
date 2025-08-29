import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Utils {
  // Format currency with locale
  static String formatCurrency(double amount) {
    return NumberFormat.currency(locale: 'en_US', symbol: '\$').format(amount);
  }

  // Show toast message
  static void showToast(String message, {bool isError = false}) {
    final messenger = ScaffoldMessenger.of(
      GlobalKey<ScaffoldMessengerState>().currentContext!,
    );
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Get formatted date
  static DateFormat getDateTimeFormatter() {
    return DateFormat('MMM dd, yyyy hh:mm a');
  }

  // Get formatted date only
  static DateFormat getDateFormatter() {
    return DateFormat('MMM dd, yyyy');
  }

  // Get formatted time only
  static DateFormat getTimeFormatter() {
    return DateFormat('hh:mm a');
  }
}
