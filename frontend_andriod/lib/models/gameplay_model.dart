// import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

class RoundInfo {
  final String? startTime;
  final String? endTime;
  final bool resultDeclared;

  const RoundInfo({this.startTime, this.endTime, required this.resultDeclared});

  factory RoundInfo.fromJson(Map<String, dynamic> json) {
    return RoundInfo(
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      resultDeclared: json['resultDeclared'] == true,
    );
  }
}

class GamePlay {
  final String id;
  final String userId;
  final String gameClass; // 'A', 'B', or 'C'
  final String selectedNumber;
  final double amount;
  final DateTime playedAt;
  final bool isWinner;
  final String? resultNumber; // Winning number for that day/game

  final RoundInfo? roundInfo;

  GamePlay({
    required this.id,
    required this.userId,
    required this.gameClass,
    required this.selectedNumber,
    required this.amount,
    required this.playedAt,
    required this.isWinner,
    this.resultNumber,
    this.roundInfo,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'gameClass': gameClass,
      'selectedNumber': selectedNumber,
      'amount': amount,
      'playedAt': playedAt.toIso8601String(),
      'isWinner': isWinner,
      'resultNumber': resultNumber,
    };
  }

  factory GamePlay.fromJson(Map<String, dynamic> json) {
    return GamePlay(
      id: json['id'] as String,
      userId: json['userId'] as String,
      gameClass: json['gameClass'] as String,
      selectedNumber: json['selectedNumber'] as String,
      amount: json['amount'].toDouble(),
      playedAt: DateTime.parse(json['playedAt']),
      isWinner: json['isWinner'] as bool,
      resultNumber: json['resultNumber'] as String?,
      roundInfo: json['roundInfo'] != null
          ? RoundInfo.fromJson(json['roundInfo'])
          : null,
    );
  }

  String get formattedDate {
    return DateFormat('dd-MM-yyyy').format(playedAt);
  }

  String get formattedTime {
    return DateFormat('hh:mm a').format(playedAt);
  }
}
