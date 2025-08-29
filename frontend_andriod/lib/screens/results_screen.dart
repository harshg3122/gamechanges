import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../models/game_result_model.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/loading_spinner.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, GameResult?> _todaysResults = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    // Add listener to refresh results when tab changes
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _refreshCurrentTabResults();
      }
    });

    // Fetch results when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshCurrentTabResults();
    });
  }

  void _refreshCurrentTabResults() async {
    final gameProvider = Provider.of<GameProvider>(context, listen: false);
    
    // Load general game data
    await gameProvider.loadGameData();
    
    // Load today's results for all time slots
    final results = await gameProvider.getTodaysResults();
    setState(() {
      _todaysResults = results;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final gameProvider = Provider.of<GameProvider>(context);
    final user = authProvider.currentUser;
    final isLoading = gameProvider.isLoading;
    final results = gameProvider.gameResults;

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Results',
        walletBalance: user?.walletBalance,
        showWallet: true,
      ),
      body: isLoading
          ? const Center(child: LoadingSpinner())
          : _buildResultsList(results),
    );
  }

  Widget _buildResultsList(List<GameResult> results) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final List<String> timeSlots = [
      '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
      '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
      '11:00 PM', '12:00 AM'
    ];

    return ListView.builder(
      itemCount: timeSlots.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final timeSlot = timeSlots[index];
        final slotTime = DateTime(
          today.year,
          today.month,
          today.day,
          index + 11 > 23 ? 0 : index + 11, // Handle midnight (24:00 becomes 0:00)
        );
        final isPast = now.isAfter(slotTime);
        
        // Get result for this time slot from our cache
        final GameResult? slotResult = _todaysResults[timeSlot];
        final displayResult = isPast && slotResult != null
            ? '${slotResult.gameClass}-${slotResult.winningNumber}'
            : isPast 
                ? 'No Result'
                : '***-*';

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            leading: Container(
              width: 80,
              alignment: Alignment.center,
              child: Text(
                timeSlot,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            title: Text(
              displayResult,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: displayResult == '***-*' || displayResult == 'No Result'
                    ? Colors.grey
                    : AppColors.gradientStart,
                letterSpacing: 2,
              ),
              textAlign: TextAlign.right,
            ),
            subtitle: slotResult != null && isPast ? Text(
              'Declared at ${DateFormat('h:mm a').format(slotResult.resultDate)}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.right,
            ) : null,
          ),
        );
      },
    );
  }

  // Removed _getClassColor, always use AppColors.gradientStart for result color
}
