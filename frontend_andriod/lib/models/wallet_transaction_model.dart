class WalletTransaction {
  final String id;
  final double amount;
  final String type; // credit, debit
  final String description;
  final String status; // completed, pending, failed
  final DateTime timestamp;

  WalletTransaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.status,
    required this.timestamp,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'],
      amount: json['amount'].toDouble(),
      type: json['type'],
      description: json['description'],
      status: json['status'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'amount': amount,
      'type': type,
      'description': description,
      'status': status,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class WalletTransactionResponse {
  final List<WalletTransaction> transactions;
  final int total;
  final int page;
  final int limit;

  WalletTransactionResponse({
    required this.transactions,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory WalletTransactionResponse.fromJson(Map<String, dynamic> json) {
    final transactions = (json['transactions'] as List)
        .map((item) => WalletTransaction.fromJson(item))
        .toList();

    return WalletTransactionResponse(
      transactions: transactions,
      total: json['total'],
      page: json['page'],
      limit: json['limit'],
    );
  }
}
