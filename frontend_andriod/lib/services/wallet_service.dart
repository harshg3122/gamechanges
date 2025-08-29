import 'package:flutter/foundation.dart';
import 'api_service.dart';
import '../constants/api_constants.dart';
import '../utils/utils.dart';

class WalletService {
  final ApiService _apiService = ApiService();

  // Singleton pattern
  static final WalletService _instance = WalletService._internal();
  factory WalletService() => _instance;
  WalletService._internal();

  // Get wallet balance
  Future<Map<String, dynamic>> getWalletBalance() async {
    try {
      final response = await _apiService.get(
        ApiConstants.walletBalanceEndpoint,
      );
      return response;
    } catch (e) {
      debugPrint('Get wallet balance error: $e');
      rethrow;
    }
  }

  // Get wallet transactions
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

  // Request Add Balance (Token)
  Future<Map<String, dynamic>> requestAddBalance({
    required double amount,
    required String upiId,
    required String userName,
    required String paymentApp,
    required String referralNumber,
    required String phoneNumber,
    String? transactionId,
  }) async {
    try {
      final response = await _apiService.post(ApiConstants.addBalanceEndpoint, {
        'amount': amount,
        'upiId': upiId,
        'userName': userName,
        'paymentApp': paymentApp,
        'referralNumber': referralNumber,
        'phoneNumber': phoneNumber,
        if (transactionId != null) 'transactionId': transactionId,
      });

      Utils.showToast('Add balance request submitted successfully');
      return response;
    } catch (e) {
      debugPrint('Add balance request error: $e');
      Utils.showToast('Failed to submit add balance request', isError: true);
      rethrow;
    }
  }

  // Request Withdraw
  Future<Map<String, dynamic>> requestWithdraw({
    required double amount,
    required String phoneNumber,
    required String paymentApp,
    required String referralNumber,
    String? upiId,
  }) async {
    try {
      final response = await _apiService.post(ApiConstants.withdrawEndpoint, {
        'amount': amount,
        'phoneNumber': phoneNumber,
        'paymentApp': paymentApp,
        'referralNumber': referralNumber,
        if (upiId != null) 'upiId': upiId,
      });

      Utils.showToast('Withdraw request submitted successfully');
      return response;
    } catch (e) {
      debugPrint('Withdraw request error: $e');
      Utils.showToast('Failed to submit withdraw request', isError: true);
      rethrow;
    }
  }

  // Request Add Token (alias for requestAddBalance)
  Future<Map<String, dynamic>> requestAddToken(
    double amount,
    String paymentApp,
    String phoneNumber,
    String referralNumber,
  ) async {
    // For backward compatibility, use the main requestAddBalance method
    return await requestAddBalance(
      amount: amount,
      upiId: '', // Will be handled by the UI
      userName: '', // Will be handled by the UI
      paymentApp: paymentApp,
      referralNumber: referralNumber,
      phoneNumber: phoneNumber,
    );
  }
}
