import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/wallet_service.dart';
import '../utils/utils.dart';

class WithdrawDialog extends StatefulWidget {
  const WithdrawDialog({super.key});

  @override
  State<WithdrawDialog> createState() => _WithdrawDialogState();
}

class _WithdrawDialogState extends State<WithdrawDialog> {
  final WalletService _walletService = WalletService();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _referralNumberController =
      TextEditingController();
  final TextEditingController _upiIdController = TextEditingController();

  String _selectedApp = 'GooglePay';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _phoneNumberController.dispose();
    _referralNumberController.dispose();
    _upiIdController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;

    if (user != null) {
      _phoneNumberController.text = user.mobileNumber ?? '';
    }
  }

  Future<void> _submitRequest() async {
    if (_amountController.text.isEmpty ||
        _phoneNumberController.text.isEmpty ||
        _referralNumberController.text.isEmpty) {
      Utils.showToast('Please fill all required fields', isError: true);
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;

    if (user == null) {
      Utils.showToast('User not logged in', isError: true);
      return;
    }

    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      Utils.showToast('Please enter a valid amount', isError: true);
      return;
    }

    if (amount > user.walletBalance) {
      Utils.showToast('Insufficient balance', isError: true);
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _walletService.requestWithdraw(
        amount: amount,
        phoneNumber: _phoneNumberController.text,
        paymentApp: _selectedApp,
        referralNumber: _referralNumberController.text,
        upiId: _upiIdController.text.isNotEmpty ? _upiIdController.text : null,
      );

      if (response['success'] == true) {
        Navigator.of(context).pop(true);
        Utils.showToast('Withdraw request submitted successfully');
      }
    } catch (e) {
      Utils.showToast('Failed to submit withdraw request', isError: true);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;
    final walletBalance = user?.walletBalance ?? 0.0;

    return AlertDialog(
      title: const Text('Withdraw Balance'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Balance Display
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                children: [
                  const Text(
                    'Available Balance',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  Text(
                    '₹ ${walletBalance.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Amount Field
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Withdraw Amount *',
                border: OutlineInputBorder(),
                prefixText: '₹ ',
                helperText: 'Enter amount to withdraw',
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
                prefixIcon: Icon(Icons.phone),
              ),
            ),
            const SizedBox(height: 12),

            // Payment App Dropdown
            DropdownButtonFormField<String>(
              value: _selectedApp,
              decoration: const InputDecoration(
                labelText: 'Payment App *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.payment),
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

            // Referral Number Field
            TextField(
              controller: _referralNumberController,
              decoration: const InputDecoration(
                labelText: 'Referral Number *',
                border: OutlineInputBorder(),
                hintText: 'REF12345',
                prefixIcon: Icon(Icons.confirmation_number),
              ),
            ),
            const SizedBox(height: 12),

            // UPI ID Field (Optional)
            TextField(
              controller: _upiIdController,
              decoration: const InputDecoration(
                labelText: 'UPI ID (Optional)',
                border: OutlineInputBorder(),
                hintText: 'your-upi@bank',
                prefixIcon: Icon(Icons.account_balance),
              ),
            ),

            const SizedBox(height: 16),

            // Note
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info, color: Colors.amber, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Withdraw requests are processed within 24-48 hours',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),
                ],
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
  }
}
