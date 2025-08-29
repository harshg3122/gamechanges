class Bet {
  final String id;
  final String gameClass;
  final String selectedNumber;
  final int betAmount;
  final String timeSlot;
  final String status;
  final int? winAmount;
  final DateTime createdAt;
  final DateTime? resultDeclaredAt;
  final bool resultDeclared;

  Bet({
    required this.id,
    required this.gameClass,
    required this.selectedNumber,
    required this.betAmount,
    required this.timeSlot,
    required this.status,
    this.winAmount,
    required this.createdAt,
    this.resultDeclaredAt,
    required this.resultDeclared,
  });

  factory Bet.fromJson(Map<String, dynamic> json) {
    return Bet(
      id: json['_id'] ?? '',
      gameClass: json['gameClass'] ?? '',
      selectedNumber: json['selectedNumber'] ?? '',
      betAmount: json['betAmount'] ?? 0,
      timeSlot: json['timeSlot'] ?? '',
      status: json['status'] ?? 'pending',
      winAmount: json['winAmount'],
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      resultDeclaredAt: json['resultDeclaredAt'] != null
          ? DateTime.parse(json['resultDeclaredAt'])
          : null,
      resultDeclared: json['resultDeclared'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'gameClass': gameClass,
      'selectedNumber': selectedNumber,
      'betAmount': betAmount,
      'timeSlot': timeSlot,
      'status': status,
      'winAmount': winAmount,
      'createdAt': createdAt.toIso8601String(),
      'resultDeclaredAt': resultDeclaredAt?.toIso8601String(),
      'resultDeclared': resultDeclared,
    };
  }

  // Helper methods
  bool get isWon => status == 'won';
  bool get isLost => status == 'lost';
  bool get isPending => status == 'pending';

  String get statusDisplayText {
    switch (status) {
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  }
}
