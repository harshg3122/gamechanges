import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../utils/utils.dart';
import 'api_service.dart';

class GameService {
  final ApiService _apiService = ApiService();

  // Singleton pattern
  static final GameService _instance = GameService._internal();
  factory GameService() => _instance;
  GameService._internal();

  // Get current game round
  Future<Map<String, dynamic>> getCurrentRound() async {
    try {
      final response = await _apiService.get(
        ApiConstants.currentRoundEndpoint,
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get current round error: $e');
      rethrow;
    }
  }

  // Get all game numbers
  Future<Map<String, dynamic>> getAllGameNumbers() async {
    try {
      final response = await _apiService.get(
        ApiConstants.gameNumbersEndpoint,
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get all game numbers error: $e');
      rethrow;
    }
  }

  // Get numbers for specific class (A, B, C, D)
  Future<Map<String, dynamic>> getNumbersByClass(String gameClass) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.gameNumbersEndpoint}/$gameClass',
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get numbers by class error: $e');
      rethrow;
    }
  }

  // Place a bet
  Future<Map<String, dynamic>> placeBet({
    required String gameClass,
    required dynamic selectedNumber,
    required double betAmount,
    String? timeSlot,
  }) async {
    try {
      final response = await _apiService.post(ApiConstants.placeBetEndpoint, {
        'gameClass': gameClass,
        'selectedNumber': selectedNumber,
        'betAmount': betAmount,
        if (timeSlot != null) 'timeSlot': timeSlot,
      });

      Utils.showToast('Bet placed successfully');
      return response;
    } catch (e) {
      debugPrint('Place bet error: $e');
      Utils.showToast('Failed to place bet', isError: true);
      rethrow;
    }
  }

  // Get user's bets
  Future<Map<String, dynamic>> getUserBets() async {
    try {
      final response = await _apiService.get(ApiConstants.userBetsEndpoint);
      return response;
    } catch (e) {
      debugPrint('Get user bets error: $e');
      rethrow;
    }
  }

  // Get results
  Future<Map<String, dynamic>> getResults({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.resultsEndpoint}?page=$page&limit=$limit',
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get results error: $e');
      rethrow;
    }
  }

  // Cancel a bet/selection (if supported by backend)
  Future<Map<String, dynamic>> cancelSelection(String selectionId) async {
    try {
      final response = await _apiService.delete(
        '${ApiConstants.cancelBetEndpoint}/$selectionId',
      );

      Utils.showToast('Selection cancelled successfully');
      return response;
    } catch (e) {
      debugPrint('Cancel selection error: $e');
      Utils.showToast('Failed to cancel selection', isError: true);
      rethrow;
    }
  }

  // Get results by class type
  Future<Map<String, dynamic>> getResultsByClass(String gameClass) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.resultsEndpoint}?gameClass=$gameClass',
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get results by class error: $e');
      rethrow;
    }
  }

  // Get result for a specific time slot or round ID
  Future<Map<String, dynamic>> getResultForTimeSlot({
    String? timeSlot,
    String? roundId,
  }) async {
    try {
      String query = '';
      if (timeSlot != null) query = 'timeSlot=$timeSlot';
      if (roundId != null) query = query.isEmpty ? 'roundId=$roundId' : '$query&roundId=$roundId';
      
      final response = await _apiService.get(
        '/game/result?$query',
        requireAuth: false,
      );
      return response;
    } catch (e) {
      debugPrint('Get result for time slot error: $e');
      rethrow;
    }
  }
}
