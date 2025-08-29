import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';

class AuthProvider with ChangeNotifier {
  User? _currentUser;
  bool _isLoading = false;
  bool _isLoggedIn = false;
  bool _isInitialized = false;

  // Services
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  UserService get userService => _userService;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  bool get isInitialized => _isInitialized;

  // Constructor
  AuthProvider() {
    _safeInitialize();
  }

  // Safe initialization that won't crash the app
  Future<void> _safeInitialize() async {
    try {
      // Delay initialization to avoid race conditions
      await Future.delayed(const Duration(milliseconds: 100));
      await _loadUserData();
    } catch (e) {
      debugPrint('Safe auth initialization error: $e');
    } finally {
      _isInitialized = true;
      if (!_isLoading) {
        notifyListeners();
      }
    }
  }

  // Verify token in background
  Future<void> _verifyTokenInBackground() async {
    try {
      final isAuthenticated = await _authService.isAuthenticated();
      if (!isAuthenticated) {
        // If token is invalid, log out
        await logout();
      } else {
        // Refresh user profile data
        try {
          final user = await _userService.getUserProfile();
          _currentUser = user;
          notifyListeners();
        } catch (e) {
          debugPrint('Background profile refresh error: $e');
        }
      }
    } catch (e) {
      debugPrint('Token verification error: $e');
    }
  }

  // Load user data from shared preferences
  Future<void> _loadUserData() async {
    try {
      _isLoading = true;
      if (_isInitialized) notifyListeners();

      // Load user from auth service
      final user = await _authService.getCurrentUser();

      if (user != null) {
        _currentUser = user;
        _isLoggedIn = true;

        // Verify token validity in background
        _verifyTokenInBackground();
      }
    } catch (e) {
      debugPrint('Error loading user data: $e');
      // Set safe defaults
      _isLoggedIn = false;
      _currentUser = null;
    } finally {
      _isLoading = false;
      if (_isInitialized) notifyListeners();
    }
  }

  // Login with real API
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _authService.login(email, password);
      _currentUser = user;
      _isLoggedIn = true;
      return true;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register user
  Future<bool> register(
    String username,
    String email,
    String password, [
    String? mobileNumber,
    String? referral,
  ]) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _authService.register(
        username: username,
        email: email,
        password: password,
        mobileNumber: mobileNumber,
        referral: referral,
      );
      _currentUser = user;
      _isLoggedIn = true;
      return true;
    } catch (e) {
      debugPrint('Registration error in provider: $e');
      // Error is already shown by AuthService, so we don't need to show it again
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update profile
  Future<bool> updateProfile(
    String username,
    String email, {
    String? mobileNumber,
    String? referral,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _userService.updateUserProfile(
        username: username,
        email: email,
        mobileNumber: mobileNumber,
        referral: referral,
      );
      _currentUser = user;
      return true;
    } catch (e) {
      debugPrint('Update profile error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update wallet balance from backend
  Future<bool> refreshWalletBalance() async {
    try {
      if (!_isLoggedIn) return false;

      final user = await _userService.getUserProfile();
      _currentUser = user;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Refresh wallet error: $e');
      return false;
    }
  }

  // Update wallet balance with the new balance from backend
  Future<bool> updateWalletBalance(double newBalance) async {
    try {
      if (!_isLoggedIn || _currentUser == null) return false;

      // Set the new balance directly
      _currentUser = User(
        id: _currentUser!.id,
        username: _currentUser!.username,
        email: _currentUser!.email,
        walletBalance: newBalance,
        isGuest: _currentUser!.isGuest,
      );

      notifyListeners();

      // If not a guest user, try to update on the server as well
      if (!_currentUser!.isGuest) {
        await refreshWalletBalance();
      }

      return true;
    } catch (e) {
      debugPrint('Update wallet balance error: $e');
      return false;
    }
  }

  // Change password
  Future<bool> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _userService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return result;
    } catch (e) {
      debugPrint('Change password error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logout();
      _currentUser = null;
      _isLoggedIn = false;
    } catch (e) {
      debugPrint('Logout error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login as guest
  Future<bool> loginAsGuest() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Create a guest user with limited functionality
      _currentUser = User(
        id: 'guest-${DateTime.now().millisecondsSinceEpoch}',
        username: 'Guest',
        email: 'guest@example.com',
        walletBalance: 1000.0, // Default starting balance for guests
        isGuest: true,
      );
      _isLoggedIn = true;

      // Save guest status to preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('is_guest_user', true);

      return true;
    } catch (e) {
      debugPrint('Guest login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Refresh user data
  Future<void> refreshUserData() async {
    try {
      if (_isLoggedIn && _currentUser != null && !_currentUser!.isGuest) {
        final user = await _userService.getUserProfile();
        _currentUser = user;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Refresh user data error: $e');
    }
  }
}
