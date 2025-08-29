import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../utils/exceptions.dart';

class ApiService {
  final String baseUrl = ApiConstants.baseUrl;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Headers with authentication
  Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiConstants.tokenKey);

      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      } else {
        throw UnauthorizedException('No authentication token found');
      }
    }

    return headers;
  }

  // HTTP GET request
  Future<dynamic> get(
    String endpoint, {
    bool requireAuth = true,
    Map<String, String>? queryParams,
  }) async {
    try {
      final headers = await _getHeaders(requireAuth: requireAuth);

      // Build URL with query parameters
      String url = '$baseUrl$endpoint';
      if (queryParams != null && queryParams.isNotEmpty) {
        final queryString = queryParams.entries
            .map(
              (e) =>
                  '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}',
            )
            .join('&');
        url += '?$queryString';
      }

      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 30));

      return _handleResponse(response);
    } on SocketException {
      throw FetchDataException('No Internet connection');
    } on HttpException {
      throw BadRequestException('Failed to process the request');
    } catch (e) {
      if (e is UnauthorizedException) rethrow;
      throw FetchDataException('Error During Communication: ${e.toString()}');
    }
  }

  // HTTP POST request with retry for critical operations
  Future<dynamic> post(
    String endpoint,
    dynamic body, {
    bool requireAuth = true,
    int maxRetries = 2,
  }) async {
    int attempts = 0;

    while (attempts <= maxRetries) {
      try {
        final headers = await _getHeaders(requireAuth: requireAuth);

        // Use longer timeout for registration and critical operations
        int timeoutSeconds = 15;
        if (endpoint.contains('/create') || endpoint.contains('/register')) {
          timeoutSeconds = 30;
        }

        final response = await http
            .post(
              Uri.parse('$baseUrl$endpoint'),
              headers: headers,
              body: json.encode(body),
            )
            .timeout(Duration(seconds: timeoutSeconds));

        return _handleResponse(response);
      } on SocketException {
        if (attempts == maxRetries) {
          throw FetchDataException('No Internet connection');
        }
      } on HttpException {
        if (attempts == maxRetries) {
          throw BadRequestException('Failed to process the request');
        }
      } catch (e) {
        if (e is UnauthorizedException) rethrow;

        // Retry on timeout for critical operations
        if (e.toString().contains('TimeoutException') &&
            endpoint.contains('/create') &&
            attempts < maxRetries) {
          attempts++;
          debugPrint(
            'Retrying request (attempt ${attempts + 1}/${maxRetries + 1}) for $endpoint',
          );
          await Future.delayed(Duration(seconds: 2));
          continue;
        }

        if (attempts == maxRetries) {
          throw FetchDataException(
            'Error During Communication: ${e.toString()}',
          );
        }
      }
      attempts++;
    }

    throw FetchDataException('Max retries exceeded');
  }

  // HTTP PUT request
  Future<dynamic> put(
    String endpoint,
    dynamic body, {
    bool requireAuth = true,
  }) async {
    try {
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await http
          .put(
            Uri.parse('$baseUrl$endpoint'),
            headers: headers,
            body: json.encode(body),
          )
          .timeout(const Duration(seconds: 30));

      return _handleResponse(response);
    } on SocketException {
      throw FetchDataException('No Internet connection');
    } on HttpException {
      throw BadRequestException('Failed to process the request');
    } catch (e) {
      if (e is UnauthorizedException) rethrow;
      throw FetchDataException('Error During Communication: ${e.toString()}');
    }
  }

  // HTTP DELETE request
  Future<dynamic> delete(String endpoint, {bool requireAuth = true}) async {
    try {
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await http
          .delete(Uri.parse('$baseUrl$endpoint'), headers: headers)
          .timeout(const Duration(seconds: 30));

      return _handleResponse(response);
    } on SocketException {
      throw FetchDataException('No Internet connection');
    } on HttpException {
      throw BadRequestException('Failed to process the request');
    } catch (e) {
      if (e is UnauthorizedException) rethrow;
      throw FetchDataException('Error During Communication: ${e.toString()}');
    }
  }

  // Handle HTTP response
  dynamic _handleResponse(http.Response response) {
    debugPrint('Response status: ${response.statusCode}');
    debugPrint('Response body: ${response.body}');

    switch (response.statusCode) {
      case 200:
      case 201:
        return json.decode(response.body);
      case 400:
        throw BadRequestException(response.body);
      case 401:
      case 403:
        throw UnauthorizedException(response.body);
      case 404:
        throw NotFoundException(response.body);
      case 429:
        throw TooManyRequestsException(response.body);
      case 500:
        throw ServerException(
          'Server error: ${response.statusCode} - ${response.body}',
        );
      default:
        throw ServerException(
          'Server error: ${response.statusCode} - ${response.body}',
        );
    }
  }

  // Method to refresh token
  Future<bool> refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString(ApiConstants.refreshTokenKey);

      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await prefs.setString(ApiConstants.tokenKey, data['token']);
        await prefs.setString(
          ApiConstants.refreshTokenKey,
          data['refreshToken'],
        );
        return true;
      } else {
        // Clear tokens if refresh fails
        await prefs.remove(ApiConstants.tokenKey);
        await prefs.remove(ApiConstants.refreshTokenKey);
        return false;
      }
    } catch (e) {
      debugPrint('Token refresh error: $e');
      return false;
    }
  }

  // NEW WALLET REQUEST METHODS

  // Create add token request with screenshot
  Future<Map<String, dynamic>> createAddTokenRequest(double amount, File? screenshotFile) async {
    try {
      final headers = await _getHeaders(requireAuth: true);
      
      var request = http.MultipartRequest(
        'POST', 
        Uri.parse('$baseUrl/api/wallet/request/add'),
      );
      
      // Add headers
      request.headers.addAll(headers);
      
      // Add amount field
      request.fields['amount'] = amount.toString();
      
      // Add screenshot if provided
      if (screenshotFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'screenshot',
            screenshotFile.path,
          ),
        );
      }
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      return json.decode(response.body);
    } catch (e) {
      debugPrint('Create add token request error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // Create withdraw token request
  Future<Map<String, dynamic>> createWithdrawTokenRequest(double amount) async {
    try {
      return await post('/api/wallet/request/withdraw', {
        'amount': amount,
      });
    } catch (e) {
      debugPrint('Create withdraw token request error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // Get user's wallet requests
  Future<Map<String, dynamic>> getWalletRequests() async {
    try {
      return await get('/api/wallet/requests');
    } catch (e) {
      debugPrint('Get wallet requests error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // Get payment photo URL
  Future<Map<String, dynamic>> getPaymentPhotoUrl() async {
    try {
      return await get('/api/wallet/payment-photo');
    } catch (e) {
      debugPrint('Get payment photo URL error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // Get user's transactions
  Future<Map<String, dynamic>> getUserTransactions({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      return await get('/transactions/user', queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      });
    } catch (e) {
      debugPrint('Get user transactions error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  // Get user's wallet requests with pagination
  Future<Map<String, dynamic>> getUserWalletRequests({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      return await get('/wallet/requests', queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      });
    } catch (e) {
      debugPrint('Get wallet requests error: $e');
      return {'success': false, 'message': 'Network error occurred'};
    }
  }
}
