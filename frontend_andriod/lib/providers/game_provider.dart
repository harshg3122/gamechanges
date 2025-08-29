import 'package:flutter/material.dart';
import '../models/gameplay_model.dart';
import '../models/game_result_model.dart';
import '../utils/utils.dart';
import '../services/game_service.dart';
import '../services/user_service.dart';
import '../providers/auth_provider.dart';

class GameProvider with ChangeNotifier {
  final GameService _gameService = GameService();
  final UserService _userService = UserService();

  List<GamePlay> _gamePlays = [];
  List<GameResult> _gameResults = [];
  Map<String, dynamic>? _currentRound;
  bool _isLoading = false;

  List<GamePlay> get gamePlays => _gamePlays;
  List<GameResult> get gameResults => _gameResults;
  Map<String, dynamic>? get currentRound => _currentRound;
  bool get isLoading => _isLoading;

  // Constructor to initialize state
  GameProvider() {
    loadGameData();
  }

  // Safe load game data with error handling
  Future<void> loadGameData() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.wait([
        _loadCurrentRound(),
        _loadResults(),
        _loadGamePlays(),
      ]);
    } catch (e) {
      debugPrint('Error in safe load game data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load current round information
  Future<void> _loadCurrentRound() async {
    try {
      final response = await _gameService.getCurrentRound();
      _currentRound = response;
    } catch (e) {
      debugPrint('Error loading current round: $e');
    }
  }

  // Load recent results
  Future<void> _loadResults() async {
    try {
      final response = await _gameService.getResults(limit: 20);

      if (response['success'] == true && response['results'] != null) {
        final results = (response['results'] as List)
            .map((item) => GameResult.fromJson(item))
            .toList();

        _gameResults = results;
      }
    } catch (e) {
      debugPrint('Error loading game results: $e');
    }
  }

  // Load user game plays
  Future<void> _loadGamePlays() async {
    try {
      final response = await _userService.getUserBets(limit: 50);

      if (response['success'] == true && response['bets'] != null) {
        final plays = (response['bets'] as List)
            .map((item) => GamePlay.fromJson(item))
            .toList();

        _gamePlays = plays;
      }
    } catch (e) {
      debugPrint('Error loading game plays: $e');
    }
  }

  // Select a number for the current game
  Future<bool> selectNumber({
    required String gameClass,
    required String number,
    required double amount,
    required AuthProvider authProvider,
    String? timeSlot,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _gameService.placeBet(
        gameClass: gameClass,
        selectedNumber: int.parse(number),
        betAmount: amount,
        timeSlot: timeSlot,
      );

      // Refresh user wallet balance
      await authProvider.refreshWalletBalance();

      // Reload user game plays
      await _loadGamePlays();

      Utils.showToast('Number selected successfully!');
      return true;
    } catch (e) {
      debugPrint('Select number error: $e');
      Utils.showToast('Failed to select number', isError: true);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Cancel a selection
  Future<bool> cancelSelection(
    String selectionId,
    AuthProvider authProvider,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _gameService.cancelSelection(selectionId);

      // Refresh user wallet balance
      await authProvider.refreshWalletBalance();

      // Reload user game plays
      await _loadGamePlays();

      Utils.showToast('Selection cancelled successfully!');
      return true;
    } catch (e) {
      debugPrint('Cancel selection error: $e');
      Utils.showToast('Failed to cancel selection', isError: true);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get valid numbers for a specific class
  Future<List<String>> getValidNumbers(String gameClass) async {
    try {
      final response = await _gameService.getNumbersByClass(gameClass);

      if (response['success'] == true && response['numbers'] != null) {
        final validNumbers = (response['numbers'] as List)
            .map((item) => item.toString())
            .toList();

        return validNumbers;
      }
      return [];
    } catch (e) {
      debugPrint('Get valid numbers error: $e');
      return [];
    }
  }

  // Get all game rounds with pagination
  Future<Map<String, dynamic>> getAllRounds({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _gameService.getResults(page: page, limit: limit);
      return response;
    } catch (e) {
      debugPrint('Get all rounds error: $e');
      return {'rounds': [], 'total': 0, 'page': page, 'limit': limit};
    }
  }

  // Get current user selections for the current round
  Future<List<GamePlay>> getCurrentSelections() async {
    try {
      final response = await _gameService.getUserBets();

      if (response['success'] == true && response['bets'] != null) {
        final selections = (response['bets'] as List)
            .map((item) => GamePlay.fromJson(item))
            .toList();

        return selections;
      }
      return [];
    } catch (e) {
      debugPrint('Get current selections error: $e');
      return [];
    }
  }

  // Filter game results by class
  List<GameResult> getGameResultsByClass(String gameClass) {
    return _gameResults
        .where((result) => result.gameClass == gameClass)
        .toList();
  }

  // Get results by class from API
  Future<List<GameResult>> fetchGameResultsByClass(String gameClass) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _gameService.getResultsByClass(gameClass);

      final results = (response['results'] as List)
          .map((item) => GameResult.fromJson(item))
          .toList();

      // Update the local results for this class
      _gameResults.removeWhere((result) => result.gameClass == gameClass);
      _gameResults.addAll(results);

      return results;
    } catch (e) {
      debugPrint('Error fetching results by class: $e');
      return [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get result for a specific time slot
  Future<GameResult?> getResultForTimeSlot(String timeSlot) async {
    try {
      final response = await _gameService.getResultForTimeSlot(timeSlot: timeSlot);

      if (response['success'] == true && response['data'] != null) {
        return GameResult.fromJson(response['data']);
      }

      return null;
    } catch (e) {
      debugPrint('Get result for time slot error: $e');
      return null;
    }
  }

  // Get all results for today's time slots
  Future<Map<String, GameResult?>> getTodaysResults() async {
    final Map<String, GameResult?> todaysResults = {};
    
    // Generate time slots from 11 AM to 12 AM
    final List<String> timeSlots = [
      '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
      '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
      '11:00 PM'
    ];

    for (String timeSlot in timeSlots) {
      todaysResults[timeSlot] = await getResultForTimeSlot(timeSlot);
    }

    return todaysResults;
  }

  // Get user's game plays (selections)
  List<GamePlay> getGamePlaysByUser(String userId) {
    return _gamePlays.where((play) => play.userId == userId).toList();
  }

  // Place a bet
  Future<bool> placeBet({
    required String gameClass,
    required String number,
    required double amount,
    required AuthProvider authProvider,
    String? timeSlot,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      // Call the game service to place the bet
      final response = await _gameService.placeBet(
        gameClass: gameClass,
        selectedNumber: number,
        betAmount: amount,
        timeSlot: timeSlot,
      );

      if (response['success'] == true) {
        // Update user's wallet balance if returned
        if (response['data'] != null &&
            response['data']['newWalletBalance'] != null) {
          await authProvider.updateWalletBalance(
            response['data']['newWalletBalance'],
          );
        }

        // Reload game data to reflect the new bet
        await loadGameData();

        Utils.showToast('Bet placed successfully');
        return true;
      } else {
        Utils.showToast(
          response['message'] ?? 'Failed to place bet',
          isError: true,
        );
        return false;
      }
    } catch (e) {
      debugPrint('Place bet error: $e');
      Utils.showToast('Failed to place bet', isError: true);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // For demo/testing purposes - reset mock data
  Future<bool> resetMockData(String userId) async {
    try {
      _isLoading = true;
      notifyListeners();

      // Reload all data from server
      await loadGameData();

      return true;
    } catch (e) {
      debugPrint('Reset mock data error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
