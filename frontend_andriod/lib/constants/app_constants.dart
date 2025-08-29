class AppConstants {
  // App Information
  static const String appName = "Game 999";
  static const String appVersion = "1.0.0";
  static const String appTagline = "Play Smart, Win Big!";

  // Content Pages
  static const String privacyPolicyContent = '''
Privacy Policy for Number Game App

Last updated: June 1, 2023

This Privacy Policy describes how we collect, use, and disclose your information when you use our Number Game mobile application.

1. Information We Collect
- Personal Information: When you create an account, we collect your email address, username, and password.
- Game Data: We collect information about your gameplay, including bets placed, results, and transaction history.
- Device Information: We collect information about your device, including device type, operating system, and unique device identifiers.

2. How We Use Your Information
- To provide and maintain our Service
- To process your transactions
- To communicate with you about updates and promotions
- To improve our app and user experience
- To detect and prevent fraud

3. Data Security
We implement reasonable security measures to protect your personal information from unauthorized access, alteration, or disclosure.

4. Third-Party Services
Our app may contain links to other services that are not operated by us. We are not responsible for the privacy practices of these third-party services.

5. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

6. Contact Us
If you have any questions about this Privacy Policy, please contact us at support@numbergame.com.
''';

  static const String termsAndConditionsContent = '''
Terms and Conditions for Number Game App

Last updated: June 1, 2023

Please read these Terms and Conditions carefully before using our Number Game mobile application.

1. Acceptance of Terms
By downloading, installing, or using our app, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our app.

2. Age Restrictions
You must be at least 18 years old to use this app. By using this app, you confirm that you are over 18 years of age.

3. User Accounts
- You are responsible for maintaining the confidentiality of your account credentials.
- You are responsible for all activities that occur under your account.
- You agree to notify us immediately of any unauthorized use of your account.

4. Game Rules and Payments
- All bets are final once placed.
- Winnings will be credited to your wallet immediately after results are declared.
- We reserve the right to void any bets in case of technical errors.
- Minimum and maximum bet amounts apply as specified in the app.

5. Prohibited Activities
- You may not use the app for any illegal purpose.
- You may not attempt to gain unauthorized access to other users' accounts.
- You may not use any automated system to access the app.

6. Termination
We reserve the right to terminate or suspend your account without prior notice for violation of these Terms.

7. Disclaimer of Warranties
The app is provided "as is" without warranties of any kind.

8. Limitation of Liability
We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

9. Changes to Terms
We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the new Terms.

10. Contact Us
For questions about these Terms, please contact us at support@numbergame.com.
''';

  static const String howToPlayContent = '''
How to Play Number Game

Welcome to Number Game! Follow these simple steps to start playing and winning:

1. Choose Your Game Class
   - Class A: Pick from repeating 3-digit numbers (e.g., 111, 222, 333)
   - Class B: Pick from 2x1 pattern numbers (e.g., 112, 221, 334)
   - Class C: Pick from unique 3-digit numbers (e.g., 123, 456, 789)

2. Select Your Numbers
   - Tap on the numbers you want to bet on
   - You can select multiple numbers in a single game

3. Place Your Bet
   - Enter the amount you want to bet on each number
   - Minimum bet: ₹10
   - Maximum bet: ₹1,000

4. Confirm Your Bet
   - Review your selections and bet amount
   - Tap "Place Bet" to confirm

5. Check Results
   - Results are announced daily at 2:00 PM and 8:00 PM
   - Winning payouts:
     * Class A: 70x your bet amount
     * Class B: 650x your bet amount
     * Class C: 6500x your bet amount

6. Claim Your Winnings
   - Winnings are automatically credited to your wallet
   - You can withdraw your winnings at any time

Tips for Beginners:
- Start with small bets to get familiar with the game
- Try different game classes to find your preference
- Keep track of your betting history to identify patterns
- Set a budget and stick to it

Good luck and enjoy playing!
''';

  static const String helpAndSupportContent = '''
Help & Support

Need assistance with Number Game? We're here to help!

Frequently Asked Questions:

1. How do I create an account?
   Tap on "Sign Up" on the login screen and fill in your details.

2. How do I add money to my wallet?
   Go to Profile > Wallet > Add Money and follow the instructions.

3. I can't place a bet. What's wrong?
   Check if you have sufficient balance in your wallet or if you're trying to bet outside the allowed time window.

4. When are results announced?
   Results are announced daily at 2:00 PM and 8:00 PM.

5. How do I withdraw my winnings?
   Go to Profile > Wallet > Withdraw and follow the instructions.

6. I didn't receive my winnings. What should I do?
   Please allow up to 15 minutes for winnings to be credited. If still not received, contact our support team.

7. How do I change my password?
   Go to Profile > Settings > Change Password.

8. The app is not working properly. What should I do?
   Try closing and reopening the app. If the issue persists, try updating the app or clearing the app cache.

Contact Us:

If you need further assistance, please contact our support team:

Email: support@numbergame.com
Phone: +1-800-123-4567
Available: Monday to Friday, 9:00 AM to 6:00 PM

You can also reach us through our social media channels:
- Facebook: /NumberGameApp
- Twitter: @NumberGameApp
- Instagram: @NumberGameOfficial
''';

  // Game Classes
  static const String classA = "A";
  static const String classB = "B";
  static const String classC = "C";

  // Class descriptions
  static const String classADesc = "1x3 repeating numbers (e.g. 111, 222)";
  static const String classBDesc = "2x1 pattern (e.g. 112, 221)";
  static const String classCDesc = "Unique 3-digit numbers (e.g. 123, 456)";

  // Minimum and maximum bet amounts
  static const double minBetAmount = 10.0;
  static const double maxBetAmount = 1000.0;

  // Shared Preferences Keys
  static const String userKey = "user_data";
  static const String gamesPlayedKey = "games_played";
  static const String resultsKey = "game_results";
  static const String isLoggedInKey = "is_logged_in";
  static const String themeKey = "app_theme";
  static const String transactionsKey = "wallet_transactions";

  // Routes
  static const String splashRoute = "/splash";
  static const String loginRoute = "/login";
  static const String homeRoute = "/home";
  static const String gameClassRoute = "/game-class";
  static const String profileRoute = "/profile";
  static const String resultsRoute = "/results";
  static const String historyRoute = "/history";
  static const String helpRoute = "/help";
  static const String privacyRoute = "/privacy";
  static const String termsRoute = "/terms";
  static const String howToPlayRoute = "/how-to-play";

  // Navigation bar item labels
  static const String navHome = "Home";
  static const String navResults = "Results";
  static const String navHistory = "History";
  static const String navProfile = "Profile";

  // Transaction Types
  static const String transactionBet = "BET";
  static const String transactionWin = "WIN";
  static const String transactionDeposit = "DEPOSIT";

  // Game Status
  static const String statusPending = "In Process";
  static const String statusWin = "WIN";
  static const String statusLose = "LOSE";

  // Toast messages
  static const String betPlacedSuccess = "Bet placed successfully!";
  static const String lowBalanceError = "Insufficient wallet balance";
  static const String invalidAmountError = "Please enter a valid amount";
  static const String loginSuccess = "Login successful";
  static const String loginError = "Invalid username or password";
  static const String walletUpdated = "Wallet updated successfully";

  // Content Pages
  static const String privacyPolicyTitle = "Privacy Policy";
  static const String termsConditionsTitle = "Terms & Conditions";
  static const String helpSupportTitle = "Help & Support";
  static const String howToPlayTitle = "How to Play";
}
