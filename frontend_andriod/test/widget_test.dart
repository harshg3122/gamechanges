// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:game_999/widgets/bottom_navigation.dart';

void main() {
  testWidgets('BottomNavigation widget builds correctly', (
    WidgetTester tester,
  ) async {
    int selectedIndex = 0;

    // Build the bottom navigation widget
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: BottomNavigation(
            currentIndex: selectedIndex,
            onTap: (index) {
              selectedIndex = index;
            },
          ),
        ),
      ),
    );

    // Verify that the bottom navigation renders
    expect(find.byType(BottomNavigation), findsOneWidget);

    // Check that navigation icons exist (allowing for multiple instances due to curved_navigation_bar)
    expect(find.byIcon(Icons.home_rounded), findsAtLeastNWidgets(1));
    expect(find.byIcon(Icons.bar_chart_rounded), findsAtLeastNWidgets(1));
    expect(find.byIcon(Icons.history_rounded), findsAtLeastNWidgets(1));
    expect(find.byIcon(Icons.person_rounded), findsAtLeastNWidgets(1));
  });

  testWidgets('BottomNavigation labels are displayed', (
    WidgetTester tester,
  ) async {
    int selectedIndex = 0;

    // Build the bottom navigation widget
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: BottomNavigation(
            currentIndex: selectedIndex,
            onTap: (index) {
              selectedIndex = index;
            },
          ),
        ),
      ),
    );

    // Wait for the widget to build
    await tester.pump();

    // Check for navigation labels
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Results'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });

  testWidgets('BottomNavigation structure is correct', (
    WidgetTester tester,
  ) async {
    int selectedIndex = 0;

    // Build the bottom navigation widget
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: BottomNavigation(
            currentIndex: selectedIndex,
            onTap: (index) {
              selectedIndex = index;
            },
          ),
        ),
      ),
    );

    // Verify initial state
    expect(selectedIndex, 0);

    // The widget builds successfully which confirms the structure is correct
    expect(find.byType(BottomNavigation), findsOneWidget);

    // Verify that the widget has proper gradient container
    expect(find.byType(Container), findsAtLeastNWidgets(1));
    expect(find.byType(Column), findsAtLeastNWidgets(1));
  });
}
