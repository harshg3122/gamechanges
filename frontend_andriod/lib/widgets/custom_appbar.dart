import 'package:flutter/material.dart';
import '../constants/colors.dart';
import '../utils/utils.dart';
import '../screens/transactions_screen.dart';
import 'add_token_dialog.dart';
import 'withdraw_dialog.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final double? walletBalance;
  final bool showWallet;
  final List<Widget>? actions;

  const CustomAppBar({
    super.key,
    required this.title,
    this.walletBalance,
    this.showWallet = false,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      backgroundColor: AppColors.primary,
      elevation: 2,
      actions: [
        if (showWallet && walletBalance != null)
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: InkWell(
                onTap: () {
                  // Show wallet options when tapped
                  showDialog(
                    context: context,
                    builder: (context) =>
                        _buildWalletDialog(context, walletBalance!),
                  );
                },
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color.fromRGBO(255, 255, 255, 0.2),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.account_balance_wallet, size: 20),
                      const SizedBox(width: 5),
                      Text(
                        Utils.formatCurrency(walletBalance!),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down, size: 16),
                    ],
                  ),
                ),
              ),
            ),
          ),
        if (actions != null) ...actions!,
      ],
    );
  }

  Widget _buildWalletDialog(BuildContext context, double balance) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            const Text(
              'Your Token Wallet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),

            // Balance display
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Text(
                    'Available Tokens',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    Utils.formatCurrency(balance),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _walletActionButton(
                  context,
                  'Add Tokens',
                  Icons.add_circle_outline,
                  AppColors.success,
                  () {
                    Navigator.pop(context);
                    _showAddTokensDialog(context);
                  },
                ),
                _walletActionButton(
                  context,
                  'Withdraw',
                  Icons.account_balance,
                  AppColors.warning,
                  () {
                    Navigator.pop(context);
                    _showWithdrawDialog(context);
                  },
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Transaction history button
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                // Navigate to transaction history screen
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TransactionsScreen(),
                  ),
                );
              },
              child: const Text('View Transaction History'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _walletActionButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(color: color, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  // Show dialog to add tokens
  void _showAddTokensDialog(BuildContext context) {
    showDialog(context: context, builder: (context) => const AddTokenDialog());
  }

  // Show dialog to withdraw tokens
  void _showWithdrawDialog(BuildContext context) {
    showDialog(context: context, builder: (context) => const WithdrawDialog());
  }
}
