import 'dart:math';
import '../models/user_model.dart';
import '../models/gameplay_model.dart';
import '../models/game_result_model.dart';

class MockData {
  // Generate a mock user
  static User getMockUser() {
    return User(
      id: 'user-${Random().nextInt(1000)}',
      username: 'testuser',
      email: 'test@example.com',
      walletBalance: 1000.0,
    );
  }

  // Generate numbers for Class A (all same digits like 111, 222, 333, etc.)
  static List<String> getClassANumbers() {
    List<String> numbers = [];
    // Start from 1 to avoid 000
    for (int i = 1; i <= 9; i++) {
      String num = i.toString() * 3; // Creates 111, 222, 333, etc.
      numbers.add(num);
    }
    return numbers;
  }

  // Generate numbers for Class B (first two digits same like 112, 113, 221, etc.)
  static List<String> getClassBNumbers() {
    List<String> numbers = [];
    // Start from 1 to avoid 001, 002, etc.
    for (int i = 1; i <= 9; i++) {
      for (int j = 1; j <= 9; j++) {
        if (i != j) {
          numbers.add('$i$i$j'); // Creates patterns like 112, 113, 114, etc.
        }
      }
    }
    return numbers;
  }

  // Generate numbers for Class C (all three digits different like 123, 145, 678, etc.)
  static List<String> getClassCNumbers() {
    List<String> numbers = [];
    for (int i = 1; i <= 9; i++) {
      for (int j = 1; j <= 9; j++) {
        if (j != i) {
          for (int k = 1; k <= 9; k++) {
            if (k != i && k != j) {
              numbers.add('$i$j$k');
            }
          }
        }
      }
    }
    return numbers.take(50).toList(); // Limiting to 50 for simplicity
  }

  // Generate mock game plays
  static List<GamePlay> getMockGamePlays(String userId) {
    final List<GamePlay> gamePlays = [];
    final Random random = Random();
    final List<String> gameClasses = ['A', 'B', 'C'];

    // Generate 10 random game plays
    for (int i = 0; i < 10; i++) {
      final gameClass = gameClasses[random.nextInt(gameClasses.length)];
      final String selectedNumber;

      // Select a number based on the game class
      if (gameClass == 'A') {
        final numbers = getClassANumbers();
        selectedNumber = numbers[random.nextInt(numbers.length)];
      } else if (gameClass == 'B') {
        final numbers = getClassBNumbers();
        selectedNumber = numbers[random.nextInt(numbers.length)];
      } else {
        final numbers = getClassCNumbers();
        selectedNumber = numbers[random.nextInt(numbers.length)];
      }

      // Random amount between 10 and 500
      final amount = (random.nextDouble() * 490 + 10).roundToDouble();

      // Random date within the last 30 days
      final playedAt = DateTime.now().subtract(
        Duration(days: random.nextInt(30)),
      );

      // Random result (win/lose)
      final isWinner = random.nextBool();

      // Generate result number (for simplicity, use random number)
      String resultNumber;
      if (gameClass == 'A') {
        final numbers = getClassANumbers();
        resultNumber = numbers[random.nextInt(numbers.length)];
      } else if (gameClass == 'B') {
        final numbers = getClassBNumbers();
        resultNumber = numbers[random.nextInt(numbers.length)];
      } else {
        final numbers = getClassCNumbers();
        resultNumber = numbers[random.nextInt(numbers.length)];
      }

      // Create the game play
      gamePlays.add(
        GamePlay(
          id: 'gp-${random.nextInt(1000)}',
          userId: userId,
          gameClass: gameClass,
          selectedNumber: selectedNumber,
          amount: amount,
          playedAt: playedAt,
          isWinner: isWinner,
          resultNumber: resultNumber,
        ),
      );
    }

    // Sort by date (newest first)
    gamePlays.sort((a, b) => b.playedAt.compareTo(a.playedAt));

    return gamePlays;
  }

  // Generate mock game results for past 7 days
  static List<GameResult> getMockGameResults() {
    final List<GameResult> results = [];
    final Random random = Random();
    final List<String> gameClasses = ['A', 'B', 'C'];

    // Generate results for past 7 days
    for (int day = 0; day < 7; day++) {
      for (String gameClass in gameClasses) {
        // Generate winning number based on game class
        final String winningNumber;
        if (gameClass == 'A') {
          final numbers = getClassANumbers();
          winningNumber = numbers[random.nextInt(numbers.length)];
        } else if (gameClass == 'B') {
          final numbers = getClassBNumbers();
          winningNumber = numbers[random.nextInt(numbers.length)];
        } else {
          final numbers = getClassCNumbers();
          winningNumber = numbers[random.nextInt(numbers.length)];
        }

        // Create result with date
        results.add(
          GameResult(
            id: 'res-${random.nextInt(1000)}',
            gameClass: gameClass,
            winningNumber: winningNumber,
            resultDate: DateTime.now().subtract(Duration(days: day)),
          ),
        );
      }
    }

    // Sort by date (newest first)
    results.sort((a, b) => b.resultDate.compareTo(a.resultDate));

    return results;
  }

  // Generate enhanced game results with more details
  static List<GameResult> generateGameResults(int count) {
    final List<GameResult> results = [];
    final Random random = Random();
    final List<String> gameClasses = ['A', 'B', 'C'];

    for (int i = 0; i < count; i++) {
      final String gameClass = gameClasses[random.nextInt(gameClasses.length)];
      final String winningNumber;

      // Generate winning number based on game class
      if (gameClass == 'A') {
        final numbers = getClassANumbers();
        winningNumber = numbers[random.nextInt(numbers.length)];
      } else if (gameClass == 'B') {
        final numbers = getClassBNumbers();
        winningNumber = numbers[random.nextInt(numbers.length)];
      } else {
        final numbers = getClassCNumbers();
        winningNumber = numbers[random.nextInt(numbers.length)];
      }

      // Create result with date
      results.add(
        GameResult(
          id: 'res-${random.nextInt(10000)}',
          gameClass: gameClass,
          winningNumber: winningNumber,
          resultDate: DateTime.now().subtract(
            Duration(days: i, hours: random.nextInt(24)),
          ),
        ),
      );
    }

    // Sort by date (newest first)
    results.sort((a, b) => b.resultDate.compareTo(a.resultDate));

    return results;
  }
}
