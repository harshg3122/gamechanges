class HistoryItem {
  final String id;
  final String selectedNumber;
  final String gameClass;
  final int betAmount;
  final String? resultNumber;
  final String status;
  final String timeSlot;
  final DateTime createdAt;
  final bool resultDeclared;
  final int winAmount;

  HistoryItem({
    required this.id,
    required this.selectedNumber,
    required this.gameClass,
    required this.betAmount,
    this.resultNumber,
    required this.status,
    required this.timeSlot,
    required this.createdAt,
    required this.resultDeclared,
    required this.winAmount,
  });

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    // Map backend status to frontend display status
    String displayStatus = 'IN PROCESS';
    
    final backendStatus = json['status']?.toString().toLowerCase();
    final resultDeclared = json['resultDeclared'] ?? false;
    final winAmount = json['winAmount'] ?? 0;
    
    if (resultDeclared || backendStatus == 'won' || backendStatus == 'lost') {
      if (backendStatus == 'won' || winAmount > 0) {
        displayStatus = 'WIN';
      } else if (backendStatus == 'lost') {
        displayStatus = 'LOSE';
      }
    } else if (backendStatus == 'pending' || backendStatus == 'placed') {
      displayStatus = 'IN PROCESS';
    }

    return HistoryItem(
      id: json['_id'] ?? '',
      selectedNumber: json['selectedNumber'] ?? '',
      gameClass: json['gameClass'] ?? '',
      betAmount: json['betAmount'] ?? 0,
      resultNumber: json['resultNumber']?.toString(),
      status: displayStatus,
      timeSlot: json['timeSlot'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      resultDeclared: resultDeclared,
      winAmount: winAmount,
    );
  }
}
