import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/user_model.dart';
import '../utils/utils.dart';
import 'api_service.dart';

class UserService {
  final ApiService _apiService = ApiService();

  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  // Get user profile
  Future<User> getUserProfile() async {
    try {
      final response = await _apiService.get(ApiConstants.userProfileEndpoint);

      if (response['success'] == true && response['user'] != null) {
        return User.fromJson(response['user']);
      } else {
        throw Exception('Failed to get user profile');
      }
    } catch (e) {
      debugPrint('Get user profile error: $e');
      rethrow;
    }
  }

  // Get user history (selections) for history screen
  Future<Map<String, dynamic>> getUserHistory({
    int page = 1,
    int limit = 20,
  }) async {
    return await getUserBets(page: page, limit: limit);
  }

  // Get user bets/selections
  Future<Map<String, dynamic>> getUserBets({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.userBetsEndpoint}?page=$page&limit=$limit',
      );
      return response;
    } catch (e) {
      debugPrint('Get user bets error: $e');
      rethrow;
    }
  }

  // Update user profile
  Future<User> updateUserProfile({
    required String username,
    required String email,
    String? mobileNumber,
    String? referral,
  }) async {
    try {
      final requestData = {
        'username': username,
        'email': email,
        if (mobileNumber != null) 'mobileNumber': mobileNumber,
        if (referral != null) 'referral': referral,
      };

      final response = await _apiService.put(
        ApiConstants.updateProfileEndpoint,
        requestData,
      );

      if (response['success'] == true && response['user'] != null) {
        final user = User.fromJson(response['user']);
        Utils.showToast('Profile updated successfully');
        return user;
      } else {
        throw Exception('Failed to update profile');
      }
    } catch (e) {
      debugPrint('Update user profile error: $e');
      Utils.showToast('Failed to update profile', isError: true);
      rethrow;
    }
  }

  // Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.changePasswordEndpoint,
        {'currentPassword': currentPassword, 'newPassword': newPassword},
      );

      if (response['success'] == true) {
        Utils.showToast('Password changed successfully');
        return true;
      } else {
        throw Exception(response['message'] ?? 'Failed to change password');
      }
    } catch (e) {
      debugPrint('Change password error: $e');
      Utils.showToast('Failed to change password', isError: true);
      return false;
    }
  }

  // Get user wallet transactions
  Future<Map<String, dynamic>> getWalletTransactions({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.walletTransactionsEndpoint}?page=$page&limit=$limit',
      );
      return response;
    } catch (e) {
      debugPrint('Get wallet transactions error: $e');
      rethrow;
    }
  }

  // Get user referral info
  Future<Map<String, dynamic>> getReferralInfo() async {
    try {
      final response = await _apiService.get(ApiConstants.referralInfoEndpoint);
      return response;
    } catch (e) {
      debugPrint('Get referral info error: $e');
      rethrow;
    }
  }
}
