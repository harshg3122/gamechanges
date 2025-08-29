import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';
import '../models/wallet_transaction_model.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../services/user_service.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/loading_spinner.dart';
import '../utils/utils.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen>
    with SingleTickerProviderStateMixin {
  final UserService _userService = UserService();
  late TabController _tabController;
  bool _isLoading = false;
  List<WalletTransaction> _transactions = [];
  int _page = 1;
  final int _limit = 20;
  int _totalTransactions = 0;
  bool _hasMoreData = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadTransactions();
    _loadWalletRequests();
    _scrollController.addListener(_scrollListener);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollListener() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      if (_hasMoreData && !_isLoading && _tabController.index == 0) {
        _loadMoreTransactions();
      }
    }
  }

  Future<void> _loadWalletRequests() async {
    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    await walletProvider.fetchWalletRequests();
  }

  Future<void> _loadTransactions() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _userService.getWalletTransactions(
        page: _page,
        limit: _limit,
      );

      final result = WalletTransactionResponse.fromJson(response);

      setState(() {
        _transactions = result.transactions;
        _totalTransactions = result.total;
        _hasMoreData = result.transactions.length < result.total;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      Utils.showToast('Failed to load transactions', isError: true);
    }
  }

  Future<void> _loadMoreTransactions() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _userService.getWalletTransactions(
        page: _page + 1,
        limit: _limit,
      );

      final result = WalletTransactionResponse.fromJson(response);

      setState(() {
        _transactions.addAll(result.transactions);
        _page++;
        _hasMoreData = (_page * _limit) < result.total;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      Utils.showToast('Failed to load more transactions', isError: true);
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _page = 1;
      _transactions = [];
    });
    await _loadTransactions();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final walletProvider = Provider.of<WalletProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Scaffold(body: Center(child: Text('User not found')));
    }

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Transactions',
        walletBalance: user.walletBalance,
        showWallet: true,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppColors.primary,
              tabs: const [
                Tab(text: 'All Transactions'),
                Tab(text: 'Wallet Requests'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // All Transactions Tab
                RefreshIndicator(
                  onRefresh: _refresh,
                  child: _isLoading && _transactions.isEmpty
                      ? const Center(child: LoadingSpinner())
                      : _transactions.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Text(
                              'No transactions found',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Text(
                                'Total Transactions: $_totalTransactions',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Expanded(
                              child: ListView.builder(
                                controller: _scrollController,
                                itemCount:
                                    _transactions.length +
                                    (_hasMoreData ? 1 : 0),
                                padding: const EdgeInsets.all(8),
                                itemBuilder: (context, index) {
                                  if (index == _transactions.length) {
                                    return const Center(
                                      child: Padding(
                                        padding: EdgeInsets.all(16.0),
                                        child: CircularProgressIndicator(),
                                      ),
                                    );
                                  }
                                  return _buildTransactionItem(
                                    _transactions[index],
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                ),
                // Wallet Requests Tab
                RefreshIndicator(
                  onRefresh: _loadWalletRequests,
                  child: walletProvider.isLoading
                      ? const Center(child: LoadingSpinner())
                      : walletProvider.walletRequests.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Text(
                              'No wallet requests found',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: walletProvider.walletRequests.length,
                          padding: const EdgeInsets.all(8),
                          itemBuilder: (context, index) {
                            final request =
                                walletProvider.walletRequests[index];
                            return _buildWalletRequestItem(request);
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletRequestItem(dynamic request) {
    final isAddRequest = request.type == 'add_token';
    final statusColor = _getStatusColor(request.status);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isAddRequest
                ? AppColors.success.withValues(alpha: 0.2)
                : AppColors.error.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            isAddRequest ? Icons.add : Icons.remove,
            color: isAddRequest ? AppColors.success : AppColors.error,
            size: 20,
          ),
        ),
        title: Text(
          isAddRequest ? 'Add Token Request' : 'Withdraw Token Request',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    request.status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat(
                    'MMM dd, yyyy • hh:mm a',
                  ).format(request.createdAt),
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
            if (request.adminNotes != null &&
                request.adminNotes.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                'Admin Notes: ${request.adminNotes}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              (isAddRequest ? '+' : '-') + Utils.formatCurrency(request.amount),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: isAddRequest ? AppColors.success : AppColors.error,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionItem(WalletTransaction transaction) {
    final isCredit = transaction.type == 'deposit' || transaction.type == 'win';

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isCredit
                    ? AppColors.success.withValues(alpha: 0.2)
                    : AppColors.error.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                color: isCredit ? AppColors.success : AppColors.error,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getTransactionTitle(transaction.type),
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(
                            transaction.status,
                          ).withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          transaction.status.toUpperCase(),
                          style: TextStyle(
                            color: _getStatusColor(transaction.status),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat(
                          'MMM dd, yyyy • hh:mm a',
                        ).format(transaction.timestamp),
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                  if (transaction.description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      transaction.description,
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  DateFormat('MMM dd').format(transaction.timestamp),
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
                Text(
                  (isCredit ? '+' : '-') +
                      Utils.formatCurrency(transaction.amount),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 17,
                    color: isCredit ? AppColors.success : AppColors.error,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getTransactionTitle(String type) {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'Wallet Deposit';
      case 'withdraw':
        return 'Wallet Withdrawal';
      case 'bet':
        return 'Game Bet';
      case 'win':
        return 'Game Win';
      case 'refund':
        return 'Bet Refund';
      default:
        return 'Transaction';
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return AppColors.success;
      case 'pending':
        return AppColors.warning;
      case 'failed':
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }
}
