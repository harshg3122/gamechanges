class GameResult {
  final String id;
  final String gameClass; // A, B, C
  final DateTime date;
  final int winningNumber;
  final List<int> drawnNumbers;
  final int totalPrize;
  final int totalPlayers;

  GameResult({
    required this.id,
    required this.gameClass,
    required this.date,
    required this.winningNumber,
    required this.drawnNumbers,
    required this.totalPrize,
    required this.totalPlayers,
  });

  // Convert GameResult to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'gameClass': gameClass,
      'date': date.toIso8601String(),
      'winningNumber': winningNumber,
      'drawnNumbers': drawnNumbers,
      'totalPrize': totalPrize,
      'totalPlayers': totalPlayers,
    };
  }

  // Create GameResult from JSON
  factory GameResult.fromJson(Map<String, dynamic> json) {
    return GameResult(
      id: json['id'],
      gameClass: json['gameClass'],
      date: DateTime.parse(json['date']),
      winningNumber: json['winningNumber'],
      drawnNumbers: List<int>.from(json['drawnNumbers']),
      totalPrize: json['totalPrize'],
      totalPlayers: json['totalPlayers'],
    );
  }
}
