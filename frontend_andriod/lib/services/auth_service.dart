import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/api_constants.dart';
import '../models/user_model.dart';
import '../utils/utils.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Login user
  Future<User> login(String identifier, String password) async {
    try {
      final response = await _apiService.post(ApiConstants.loginEndpoint, {
        'identifier': identifier,
        'password': password,
      }, requireAuth: false);

      // Check if response indicates success
      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Login failed');
      }

      // Save auth tokens
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ApiConstants.tokenKey, response['token']);

      if (response['refreshToken'] != null) {
        await prefs.setString(
          ApiConstants.refreshTokenKey,
          response['refreshToken'],
        );
      }

      // Create user object from response
      final userJson = response['user'];
      final user = User.fromJson(userJson);

      // Save user data
      await prefs.setString(ApiConstants.userIdKey, user.id ?? '');
      await prefs.setString(ApiConstants.usernameKey, user.username ?? '');

      Utils.showToast('Login successful');
      return user;
    } catch (e) {
      debugPrint('Login error: $e');
      Utils.showToast('Login failed', isError: true);
      rethrow;
    }
  }

  // Register user
  Future<User> register({
    required String username,
    required String email,
    required String password,
    String? mobileNumber,
    String? referral,
  }) async {
    try {
      final Map<String, dynamic> requestData = {
        'username': username.trim(),
        'email': email.trim(),
        'password': password,
      };

      // Add optional fields
      if (mobileNumber != null && mobileNumber.trim().isNotEmpty) {
        requestData['mobileNumber'] = mobileNumber.trim();
      }

      if (referral != null && referral.trim().isNotEmpty) {
        requestData['referral'] = referral.trim();
      }

      final response = await _apiService.post(
        ApiConstants.registerEndpoint,
        requestData,
        requireAuth: false,
      );

      // Check if response indicates success
      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Registration failed');
      }

      // Save auth tokens if provided
      final prefs = await SharedPreferences.getInstance();
      if (response['token'] != null) {
        await prefs.setString(ApiConstants.tokenKey, response['token']);
      }

      // Create user object from response
      final userJson = response['user'];
      final user = User.fromJson(userJson);

      Utils.showToast('Registration successful');
      return user;
    } catch (e) {
      debugPrint('Registration error: $e');
      Utils.showToast('Registration failed', isError: true);
      rethrow;
    }
  }

  // Logout user
  Future<void> logout() async {
    try {
      // Call logout endpoint if authenticated
      try {
        await _apiService.post(ApiConstants.logoutEndpoint, {});
      } catch (e) {
        debugPrint('Logout API call failed: $e');
        // Continue with local logout even if API fails
      }

      // Clear local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ApiConstants.tokenKey);
      await prefs.remove(ApiConstants.refreshTokenKey);
      await prefs.remove(ApiConstants.userIdKey);
      await prefs.remove(ApiConstants.usernameKey);

      Utils.showToast('Logged out successfully');
    } catch (e) {
      debugPrint('Logout error: $e');
      Utils.showToast('Logout failed', isError: true);
      rethrow;
    }
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiConstants.tokenKey);

      if (token == null || token.isEmpty) {
        return false;
      }

      // Verify token with server
      await _apiService.get(ApiConstants.verifyTokenEndpoint);
      return true;
    } catch (e) {
      debugPrint('Authentication check failed: $e');
      return false;
    }
  }

  // Get current user data
  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiConstants.tokenKey);

      if (token == null || token.isEmpty) {
        return null;
      }

      // Get user profile from server
      final response = await _apiService.get(ApiConstants.userProfileEndpoint);

      if (response['success'] == true && response['user'] != null) {
        return User.fromJson(response['user']);
      }

      return null;
    } catch (e) {
      debugPrint('Get current user error: $e');
      return null;
    }
  }

  // Clear authentication data
  Future<void> clearAuthData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ApiConstants.tokenKey);
      await prefs.remove(ApiConstants.refreshTokenKey);
      await prefs.remove(ApiConstants.userIdKey);
      await prefs.remove(ApiConstants.usernameKey);
    } catch (e) {
      debugPrint('Clear auth data error: $e');
    }
  }
}
