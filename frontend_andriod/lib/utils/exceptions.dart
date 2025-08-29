// Custom exceptions for API calls and data handling
// These exceptions help with proper error handling throughout the app

class AppException implements Exception {
  final String message;
  final String? prefix;
  final String? url;

  AppException([this.message = '', this.prefix, this.url]);

  @override
  String toString() {
    return "$prefix$message";
  }
}

class FetchDataException extends AppException {
  FetchDataException([String message = ""])
    : super(message, "Error During Communication: ");
}

class BadRequestException extends AppException {
  BadRequestException([String message = ""])
    : super(message, "Invalid Request: ");
}

class UnauthorizedException extends AppException {
  UnauthorizedException([String message = ""])
    : super(message, "Unauthorized: ");
}

class NotFoundException extends AppException {
  NotFoundException([String message = ""]) : super(message, "Not Found: ");
}

class InvalidInputException extends AppException {
  InvalidInputException([String message = ""])
    : super(message, "Invalid Input: ");
}

class ServerException extends AppException {
  ServerException([String message = ""]) : super(message, "Server Error: ");
}

class TooManyRequestsException extends AppException {
  TooManyRequestsException([String message = ""])
    : super(message, "Too Many Requests: ");
}
