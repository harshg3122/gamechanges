import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../services/wallet_service.dart';
import '../utils/utils.dart';

class AddTokenDialog extends StatefulWidget {
  const AddTokenDialog({super.key});

  @override
  State<AddTokenDialog> createState() => _AddTokenDialogState();
}

class _AddTokenDialogState extends State<AddTokenDialog> {
  final WalletService _walletService = WalletService();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _upiIdController = TextEditingController();
  final TextEditingController _userNameController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _referralNumberController = TextEditingController();

  String _selectedApp = 'GooglePay';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    // Fetch payment photo when dialog loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WalletProvider>().fetchPaymentPhotoUrl();
    });
  }

  Future<void> _loadUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;

    if (user != null) {
      _userNameController.text = user.username ?? '';
      _phoneNumberController.text = user.mobileNumber ?? '';
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _upiIdController.dispose();
    _userNameController.dispose();
    _phoneNumberController.dispose();
    _referralNumberController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_validateForm()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _walletService.requestAddBalance(
        amount: double.parse(_amountController.text),
        paymentApp: _selectedApp,
        upiId: _upiIdController.text,
        userName: _userNameController.text,
        phoneNumber: _phoneNumberController.text,
        referralNumber: _referralNumberController.text,
      );

      if (response['success'] == true) {
        Navigator.of(context).pop(true);
        Utils.showToast('Add token request submitted successfully!');
      } else {
        Utils.showToast(response['message'] ?? 'Failed to submit request', isError: true);
      }
    } catch (e) {
      Utils.showToast('Failed to submit request', isError: true);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  bool _validateForm() {
    if (_amountController.text.isEmpty) {
      Utils.showToast('Please enter amount', isError: true);
      return false;
    }

    final amount = int.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      Utils.showToast('Please enter a valid amount', isError: true);
      return false;
    }

    if (_upiIdController.text.isEmpty) {
      Utils.showToast('Please enter UPI ID', isError: true);
      return false;
    }

    if (_userNameController.text.isEmpty) {
      Utils.showToast('Please enter your name', isError: true);
      return false;
    }

    if (_phoneNumberController.text.isEmpty) {
      Utils.showToast('Please enter phone number', isError: true);
      return false;
    }

    if (_referralNumberController.text.isEmpty) {
      Utils.showToast('Please enter referral number', isError: true);
      return false;
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<WalletProvider>(
      builder: (context, walletProvider, child) {
        return AlertDialog(
          title: const Text('Add Balance'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Payment QR Code from Admin Panel
                Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: walletProvider.paymentPhotoUrl != null 
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          walletProvider.paymentPhotoUrl!,
                          fit: BoxFit.contain,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.error_outline, size: 40, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text(
                                    'Failed to load QR code',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      )
                    : const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.qr_code, size: 40, color: Colors.grey),
                            SizedBox(height: 8),
                            Text(
                              'No QR code added',
                              style: TextStyle(color: Colors.grey),
                            ),
                            Text(
                              'Contact admin to add payment QR',
                              style: TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                ),
                const SizedBox(height: 16),

                // Amount Field
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Enter Amount *',
                    border: OutlineInputBorder(),
                    prefixText: '₹ ',
                  ),
                ),
                const SizedBox(height: 16),

                // Payment App Dropdown
                DropdownButtonFormField<String>(
                  value: _selectedApp,
                  decoration: const InputDecoration(
                    labelText: 'Payment App *',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'GooglePay', child: Text('Google Pay')),
                    DropdownMenuItem(value: 'PhonePe', child: Text('PhonePe')),
                    DropdownMenuItem(value: 'Paytm', child: Text('Paytm')),
                    DropdownMenuItem(value: 'BHIM', child: Text('BHIM UPI')),
                    DropdownMenuItem(value: 'Other', child: Text('Other')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedApp = value!;
                    });
                  },
                ),
                const SizedBox(height: 12),

                // UPI ID Field
                TextField(
                  controller: _upiIdController,
                  decoration: const InputDecoration(
                    labelText: 'UPI ID *',
                    border: OutlineInputBorder(),
                    hintText: 'your-upi@bank',
                  ),
                ),
                const SizedBox(height: 12),

                // User Name Field
                TextField(
                  controller: _userNameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),

                // Phone Number Field
                TextField(
                  controller: _phoneNumberController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number *',
                    border: OutlineInputBorder(),
                    prefixText: '+91 ',
                  ),
                ),
                const SizedBox(height: 12),

                // Referral Number Field
                TextField(
                  controller: _referralNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Referral Number *',
                    border: OutlineInputBorder(),
                    hintText: 'REF12345',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _isLoading ? null : _submitRequest,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit Request'),
            ),
          ],
        );
      },
    );
  }
}
