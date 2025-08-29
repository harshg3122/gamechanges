class User {
  final String? id;
  final String? username;
  final String? email;
  final double walletBalance;
  final String? mobileNumber;
  final String? referral;
  final bool isGuest;

  User({
    this.id,
    this.username,
    this.email,
    required this.walletBalance,
    this.mobileNumber,
    this.referral,
    this.isGuest = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id ?? '',
      'username': username ?? '',
      'email': email ?? '',
      'walletBalance': walletBalance,
      'mobileNumber': mobileNumber ?? '',
      'referral': referral ?? '',
      'isGuest': isGuest,
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id']?.toString() ?? json['id']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      walletBalance: (json['balance'] ?? json['walletBalance'] ?? 0).toDouble(),
      mobileNumber: json['phoneNumber']?.toString() ?? json['mobileNumber']?.toString(),
      referral: json['referral']?.toString(),
      isGuest: json['isGuest'] ?? false,
    );
  }

  User copyWith({
    String? id,
    String? username,
    String? email,
    double? walletBalance,
    String? mobileNumber,
    String? referral,
    bool? isGuest,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      walletBalance: walletBalance ?? this.walletBalance,
      mobileNumber: mobileNumber ?? this.mobileNumber,
      referral: referral ?? this.referral,
      isGuest: isGuest ?? this.isGuest,
    );
  }
}
