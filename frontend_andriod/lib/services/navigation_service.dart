import 'package:flutter/material.dart';

// Global navigation service to handle navigation between screens
class NavigationService {
  static final NavigationService _instance = NavigationService._internal();

  factory NavigationService() {
    return _instance;
  }

  NavigationService._internal();

  // Global key for navigator
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  // Tab index for MainScreen
  int mainScreenTabIndex = 0;

  // Method to update main screen tab index
  void updateMainTab(int index) {
    mainScreenTabIndex = index;
  }

  // Get current navigator state
  NavigatorState? get currentState => navigatorKey.currentState;

  // Navigate to a named route
  Future<dynamic> navigateTo(String routeName, {Object? arguments}) {
    return currentState!.pushNamed(routeName, arguments: arguments);
  }

  // Navigate to a page and replace current route
  Future<dynamic> navigateToReplacement(String routeName, {Object? arguments}) {
    return currentState!.pushReplacementNamed(routeName, arguments: arguments);
  }

  // Navigate to a page and clear all previous routes
  Future<dynamic> navigateToAndClearStack(
    String routeName, {
    Object? arguments,
  }) {
    return currentState!.pushNamedAndRemoveUntil(
      routeName,
      (Route<dynamic> route) => false,
      arguments: arguments,
    );
  }
}
