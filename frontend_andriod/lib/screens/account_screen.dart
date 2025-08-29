import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../constants/colors.dart';
import '../providers/auth_provider.dart';
import '../utils/utils.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/loading_overlay.dart';
import '../widgets/add_token_dialog.dart';
import '../widgets/withdraw_dialog.dart';
import 'profile_edit_screen.dart';
import 'wallet_history_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Refresh user data when screen loads
    _refreshUserData();
  }

  Future<void> _refreshUserData() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.refreshWalletBalance();
    } catch (e) {
      debugPrint('Error refreshing user data: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      appBar: const CustomAppBar(title: 'Account'),
      body: LoadingOverlay(
        isLoading: _isLoading || authProvider.isLoading,
        child: RefreshIndicator(
          onRefresh: _refreshUserData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Avatar with username initial
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: AppColors.primary,
                          child: Text(
                            user?.username?.isNotEmpty == true
                                ? user!.username!.substring(0, 1).toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Username
                        Text(
                          user?.username ?? 'User',
                          style: theme.textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        // Email
                        Text(
                          user?.email ?? 'No email',
                          style: theme.textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 16),
                        // Edit Profile Button
                        OutlinedButton.icon(
                          icon: const Icon(Icons.edit),
                          label: const Text('Edit Profile'),
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const ProfileEditScreen(),
                              ),
                            );

                            if (result == true) {
                              _refreshUserData();
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Wallet Section
                Text('Wallet', style: theme.textTheme.titleLarge),
                const SizedBox(height: 16),
                Card(
                  elevation: 4,
                  color: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Row(
                          children: [
                            Icon(
                              Icons.account_balance_wallet,
                              color: Colors.white,
                              size: 30,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Available Balance',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '${user?.walletBalance.toStringAsFixed(0) ?? '0'} Tokens',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            ElevatedButton.icon(
                              icon: const Icon(Icons.add_circle_outline),
                              label: const Text('Add Token'),
                              style: ElevatedButton.styleFrom(
                                foregroundColor: Colors.white,
                                backgroundColor: AppColors.success,
                              ),
                              onPressed: () async {
                                final result = await showDialog(
                                  context: context,
                                  builder: (context) => const AddTokenDialog(),
                                );
                                // Refresh user data if request was successful
                                if (result == true) {
                                  await Provider.of<AuthProvider>(context, listen: false).refreshUserData();
                                }
                              },
                            ),
                            ElevatedButton.icon(
                              icon: const Icon(Icons.remove_circle_outline),
                              label: const Text('Withdraw'),
                              style: ElevatedButton.styleFrom(
                                foregroundColor: Colors.white,
                                backgroundColor: AppColors.warning,
                              ),
                              onPressed: () async {
                                final result = await showDialog(
                                  context: context,
                                  builder: (context) => const WithdrawDialog(),
                                );
                                // Refresh user data if request was successful
                                if (result == true) {
                                  await Provider.of<AuthProvider>(context, listen: false).refreshUserData();
                                }
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.history),
                          label: const Text('View Transaction History'),
                          style: ElevatedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            backgroundColor: Colors.white,
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const WalletHistoryScreen(),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Account Actions Section
                Text('Account Actions', style: theme.textTheme.titleLarge),
                const SizedBox(height: 16),
                _buildActionTile(
                  icon: Icons.lock,
                  title: 'Change Password',
                  onTap: () {
                    _showChangePasswordDialog(context);
                  },
                ),
                _buildActionTile(
                  icon: Icons.help,
                  title: 'Help & Support',
                  onTap: () {
                    // Navigate to help screen
                    Utils.showToast('Help & Support coming soon!');
                  },
                ),
                _buildActionTile(
                  icon: Icons.info,
                  title: 'About App',
                  onTap: () {
                    // Show About dialog
                    Utils.showToast('About App coming soon!');
                  },
                ),
                _buildActionTile(
                  icon: Icons.logout,
                  title: 'Logout',
                  onTap: () {
                    _showLogoutConfirmation(context);
                  },
                  color: Colors.red,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: color ?? Colors.black87),
        title: Text(
          title,
          style: TextStyle(
            color: color ?? Colors.black87,
            fontWeight: FontWeight.w500,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  // Logout confirmation dialog
  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _logout();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  // Logout function
  Future<void> _logout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();

    if (mounted) {
      // Navigate to login screen
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  // Change password dialog
  void _showChangePasswordDialog(BuildContext context) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool obscureCurrentPassword = true;
    bool obscureNewPassword = true;
    bool obscureConfirmPassword = true;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Change Password'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: currentPasswordController,
                      decoration: InputDecoration(
                        labelText: 'Current Password',
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscureCurrentPassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              obscureCurrentPassword = !obscureCurrentPassword;
                            });
                          },
                        ),
                      ),
                      obscureText: obscureCurrentPassword,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: newPasswordController,
                      decoration: InputDecoration(
                        labelText: 'New Password',
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscureNewPassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              obscureNewPassword = !obscureNewPassword;
                            });
                          },
                        ),
                      ),
                      obscureText: obscureNewPassword,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: confirmPasswordController,
                      decoration: InputDecoration(
                        labelText: 'Confirm New Password',
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscureConfirmPassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              obscureConfirmPassword = !obscureConfirmPassword;
                            });
                          },
                        ),
                      ),
                      obscureText: obscureConfirmPassword,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    if (newPasswordController.text.isEmpty ||
                        currentPasswordController.text.isEmpty) {
                      Utils.showToast('Please enter all fields', isError: true);
                      return;
                    }

                    if (newPasswordController.text !=
                        confirmPasswordController.text) {
                      Utils.showToast('Passwords do not match', isError: true);
                      return;
                    }

                    Navigator.pop(context);

                    if (mounted) {
                      setState(() {
                        _isLoading = true;
                      });
                    }

                    final authProvider = Provider.of<AuthProvider>(
                      context,
                      listen: false,
                    );

                    try {
                      final success = await authProvider.changePassword(
                        currentPasswordController.text,
                        newPasswordController.text,
                      );

                      if (success && mounted) {
                        Utils.showToast('Password changed successfully');
                      }
                    } catch (e) {
                      debugPrint('Error changing password: $e');
                      Utils.showToast(
                        'Failed to change password',
                        isError: true,
                      );
                    } finally {
                      if (mounted) {
                        setState(() {
                          _isLoading = false;
                        });
                      }
                    }
                  },
                  child: const Text('Change'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
