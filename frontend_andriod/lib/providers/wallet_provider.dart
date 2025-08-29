import 'package:flutter/material.dart';
import 'dart:io';
import '../services/api_service.dart';
import '../constants/api_constants.dart';

class WalletProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Map<String, dynamic>> _transactions = [];
  List<Map<String, dynamic>> _withdrawalRequests = [];
  List<WalletRequest> _walletRequests = [];
  String? _paymentPhotoUrl;
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get transactions => _transactions;
  List<Map<String, dynamic>> get withdrawalRequests => _withdrawalRequests;
  List<WalletRequest> get walletRequests => _walletRequests;
  String? get paymentPhotoUrl => _paymentPhotoUrl;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // NEW REQUEST-BASED SYSTEM

  // Create add token request
  Future<bool> createAddTokenRequest(double amount, File? screenshotFile) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _apiService.createAddTokenRequest(amount, screenshotFile);
      
      if (response['success'] == true) {
        // Refresh wallet requests
        await fetchWalletRequests();
        _setLoading(false);
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to create add token request');
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _setError('Network error. Please try again.');
      _setLoading(false);
      return false;
    }
  }

  // Create withdraw token request
  Future<bool> createWithdrawTokenRequest(double amount) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _apiService.createWithdrawTokenRequest(amount);
      
      if (response['success'] == true) {
        // Refresh wallet requests
        await fetchWalletRequests();
        _setLoading(false);
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to create withdraw request');
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _setError('Network error. Please try again.');
      _setLoading(false);
      return false;
    }
  }

  // Fetch user's wallet requests
  Future<void> fetchWalletRequests() async {
    try {
      final response = await _apiService.getUserWalletRequests();
      
      if (response['success'] == true) {
        // Handle both response formats: nested in 'data' or direct 'requests'
        List<dynamic> requestsList = [];
        if (response['data'] != null && response['data']['requests'] != null) {
          requestsList = response['data']['requests'] as List;
        } else if (response['requests'] != null) {
          requestsList = response['requests'] as List;
        }
        
        _walletRequests = requestsList
            .map((request) => WalletRequest.fromJson(request))
            .toList();
      } else {
        _setError(response['message'] ?? 'Failed to fetch wallet requests');
      }
    } catch (e) {
      _setError('Network error. Please try again.');
    }
    notifyListeners();
  }

  // Get payment photo URL
  Future<void> fetchPaymentPhotoUrl() async {
    try {
      final response = await _apiService.getPaymentPhotoUrl();
      
      if (response['success'] == true) {
        _paymentPhotoUrl = response['photoUrl'];
      }
    } catch (e) {
      debugPrint('Error fetching payment photo URL: $e');
    }
    notifyListeners();
  }

  // Add tokens to wallet
  Future<bool> addToken({
    required int amount,
    required String paymentApp,
    String upiId = '',
    String userName = '',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(ApiConstants.addBalanceEndpoint, {
        'amount': amount,
        'paymentApp': paymentApp,
        'upiId': upiId,
        'userName': userName,
      });

      if (response['success']) {
        // Reload transactions
        await loadTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to add tokens: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Request withdrawal
  Future<bool> withdrawToken({
    required int amount,
    required String phoneNumber,
    required String paymentApp,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(ApiConstants.withdrawEndpoint, {
        'amount': amount,
        'phoneNumber': phoneNumber,
        'paymentApp': paymentApp,
      });

      if (response['success']) {
        // Reload transactions and withdrawal requests
        await Future.wait([loadTransactions(), loadWithdrawalRequests()]);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to request withdrawal: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Get wallet balance
  Future<Map<String, dynamic>?> getWalletBalance() async {
    try {
      final response = await _apiService.get(
        ApiConstants.walletBalanceEndpoint,
      );

      if (response['success']) {
        return response['data'];
      } else {
        _error = response['message'];
        return null;
      }
    } catch (e) {
      _error = 'Failed to get wallet balance: $e';
      debugPrint('Error getting wallet balance: $e');
      return null;
    }
  }

  // Load wallet transactions
  Future<void> loadTransactions({int page = 1, String? type}) async {
    try {
      _isLoading = true;
      notifyListeners();

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': '20',
      };

      if (type != null) queryParams['type'] = type;

      final response = await _apiService.get(
        ApiConstants.walletTransactionsEndpoint,
        queryParams: queryParams,
      );

      if (response['success']) {
        _transactions = List<Map<String, dynamic>>.from(
          response['data']['transactions'],
        );
      } else {
        _error = response['message'];
      }
    } catch (e) {
      _error = 'Failed to load transactions: $e';
      debugPrint('Error loading transactions: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load withdrawal requests
  Future<void> loadWithdrawalRequests({int page = 1, String? status}) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': '20',
      };

      if (status != null) queryParams['status'] = status;

      final response = await _apiService.get(
        ApiConstants.withdrawalHistoryEndpoint,
        queryParams: queryParams,
      );

      if (response['success']) {
        _withdrawalRequests = List<Map<String, dynamic>>.from(
          response['data']['withdrawalRequests'],
        );
      } else {
        _error = response['message'];
      }
    } catch (e) {
      _error = 'Failed to load withdrawal requests: $e';
      debugPrint('Error loading withdrawal requests: $e');
    }
    notifyListeners();
  }

  // Initialize wallet provider
  Future<void> initialize() async {
    await Future.wait([loadTransactions(), loadWithdrawalRequests()]);
  }
}

class WalletRequest {
  final String id;
  final String type; // 'add' or 'withdraw'
  final double amount;
  final String status; // 'pending', 'approved', 'rejected'
  final String? screenshot;
  final String? adminNote;
  final DateTime createdAt;
  final DateTime? processedAt;

  WalletRequest({
    required this.id,
    required this.type,
    required this.amount,
    required this.status,
    this.screenshot,
    this.adminNote,
    required this.createdAt,
    this.processedAt,
  });

  factory WalletRequest.fromJson(Map<String, dynamic> json) {
    return WalletRequest(
      id: json['_id'] ?? '',
      type: json['type'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      screenshot: json['screenshot'],
      adminNote: json['adminNote'],
      createdAt: DateTime.parse(json['createdAt']),
      processedAt: json['processedAt'] != null 
          ? DateTime.parse(json['processedAt']) 
          : null,
    );
  }

  String get displayStatus {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  String get displayType {
    return type == 'add' ? 'Add Tokens' : 'Withdraw Tokens';
  }
}
