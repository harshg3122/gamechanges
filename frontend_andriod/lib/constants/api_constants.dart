/// API Constants class
/// Contains all API related constants for the application
class ApiConstants {
  // Base URL for API
  static const String baseUrl = 'https://game-39rz.onrender.com/api';

  // User Authentication endpoints
  static const String registerEndpoint = '/auth/register';
  static const String loginEndpoint = '/auth/login';
  static const String logoutEndpoint = '/auth/logout';
  static const String refreshTokenEndpoint = '/auth/refresh';
  static const String verifyTokenEndpoint = '/auth/verify';

  // Game endpoints
  static const String gameNumbersEndpoint = '/game/numbers';
  static const String currentRoundEndpoint = '/game/current-round';
  static const String placeBetEndpoint = '/game/bet';
  static const String cancelBetEndpoint = '/game/bet/cancel';
  static const String userBetsEndpoint = '/game/bets';
  static const String resultsEndpoint = '/game/results';

  // User Profile endpoints
  static const String userProfileEndpoint = '/user/profile';
  static const String updateProfileEndpoint = '/user/profile';
  static const String changePasswordEndpoint = '/user/change-password';

  // Wallet endpoints
  static const String walletBalanceEndpoint = '/wallet/balance';
  static const String walletTransactionsEndpoint = '/wallet/transactions';
  static const String addBalanceEndpoint = '/wallet/add-token';
  static const String withdrawEndpoint = '/wallet/withdraw';

  // User specific endpoints
  static const String userSelectionsEndpoint = '/user/selections';
  static const String userResultsEndpoint = '/user/results';
  static const String userStatsEndpoint = '/user/stats';

  // Transaction history endpoints
  static const String transactionHistoryEndpoint = '/transactions';
  static const String withdrawalHistoryEndpoint = '/withdrawals';

  // Settings endpoints
  static const String settingsEndpoint = '/settings';
  static const String referralInfoEndpoint = '/user/referral';

  // Local storage keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String usernameKey = 'username';

  // Request timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds

  // HTTP Status codes
  static const int statusOk = 200;
  static const int statusCreated = 201;
  static const int statusBadRequest = 400;
  static const int statusUnauthorized = 401;
  static const int statusForbidden = 403;
  static const int statusNotFound = 404;
  static const int statusInternalServerError = 500;
}
