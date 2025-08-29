import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../providers/wallet_provider.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/app_drawer.dart';
import '../widgets/loading_shimmer.dart';
import '../screens/game_screen.dart';
import '../screens/results_screen.dart';
import '../models/game_result_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();

    // Set up periodic refresh for game data
    // This ensures the dashboard stays updated with the latest information
    _setupPeriodicRefresh();
  }

  Timer? _refreshTimer;

  void _setupPeriodicRefresh() {
    // Refresh data every 60 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      if (mounted) {
        final gameProvider = Provider.of<GameProvider>(
          context,
          listen: false,
        );
        gameProvider.loadGameData();
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    // Use the GameProvider to load actual data
    final gameProvider = Provider.of<GameProvider>(
      context,
      listen: false,
    );
    await gameProvider.loadGameData();

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        return Scaffold(
          appBar: CustomAppBar(
            title: 'Dashboard',
            showWallet: true,
            walletBalance: authProvider.currentUser?.walletBalance ?? 0.0,
          ),
          drawer: const AppDrawer(),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [AppColors.background, Color(0xFFF5F7FA)],
              ),
            ),
            child: _isLoading
                ? const DashboardLoadingShimmer()
                : _buildMobileLayout(context, authProvider),
          ),
        );
      },
    );
  }

  Widget _buildMobileLayout(BuildContext context, AuthProvider authProvider) {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
          horizontal: MediaQuery.of(context).size.width * 0.04,
          vertical: 16,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWelcomeSection(context, authProvider),
            const SizedBox(height: 20),
            const SizedBox(height: 20),
            _buildGameClassesSection(context),
            const SizedBox(height: 20),
            _buildRecentResultsSection(context),
            const SizedBox(height: 100), // Extra space for bottom nav
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.currentUser;
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;
    final fontSize = isTablet ? 28.0 : 24.0;
    final subtitleSize = isTablet ? 16.0 : 14.0;

    return Container(
      padding: EdgeInsets.all(isTablet ? 24 : 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.gradientStart,
            AppColors.gradientEnd,
            AppColors.primary,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Welcome back,',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: subtitleSize,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.username ?? 'Guest',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: fontSize,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (user?.id != null && user!.id!.isNotEmpty)
                      Text(
                        'ID: ${user.id}',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: subtitleSize,
                        ),
                      ),
                    if (user?.mobileNumber != null &&
                        user!.mobileNumber!.isNotEmpty)
                      Text(
                        'Mobile: ${user.mobileNumber}',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: subtitleSize,
                        ),
                      ),
                    if (user?.referral != null && user!.referral!.isNotEmpty)
                      Text(
                        'Referral: ${user.referral}',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: subtitleSize,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.account_balance_wallet,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Balance: ₹${user?.walletBalance.toStringAsFixed(2) ?? '0.00'}',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: subtitleSize,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: isTablet ? 60 : 50,
                height: isTablet ? 60 : 50,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: IconButton(
                  onPressed: () => _goToPlayGame(context),
                  icon: Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: isTablet ? 30 : 25,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGameClassesSection(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;

    // A, B, C, D order (ascending)
    final classOrder = ['A', 'B', 'C', 'D'];
    final classDescriptions = {
      'A': 'Triple Same Digits (111, 222, 333, ...)',
      'B': 'Double Same Digits (112, 113, 223, ...)',
      'C': 'All Different Digits (123, 456, 789, ...)',
      'D': 'Single Digit (1-9)',
    };
    final classColors = {
      'A': AppColors.classA,
      'B': AppColors.classB,
      'C': AppColors.classC,
      'D': AppColors.primary,
    };

    // Get numbers for each class (ascending)
    // If you want to use backend dashboard stats, replace below with gameProvider.dashboardStats['classStats']
    // Here, we use getValidNumbers for each class
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Game Classes',
          style: GoogleFonts.poppins(
            fontSize: isTablet ? 24 : 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 15),
        Column(
          children: classOrder.map((classType) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildGameClassCard(
                  classType,
                  classDescriptions[classType]!,
                  classColors[classType]!,
                  context,
                ),
                const SizedBox(height: 12),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildGameClassCard(
    String gameClass,
    String description,
    Color color,
    BuildContext context,
  ) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isTablet ? 20 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isTablet ? 30 : 24,
                  vertical: isTablet ? 14 : 12,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withValues(alpha: 0.2),
                      color.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Text(
                  'Class $gameClass',
                  style: TextStyle(
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: () => _playGameClass(gameClass, context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: color,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: isTablet ? 24 : 20,
                    vertical: isTablet ? 14 : 12,
                  ),
                  elevation: 2,
                ),
                child: Text(
                  'Play Now',
                  style: TextStyle(
                    fontSize: isTablet ? 16 : 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: TextStyle(
              fontSize: isTablet ? 16 : 14,
              color: Colors.black87,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentResultsSection(BuildContext context) {
    final gameProvider = Provider.of<GameProvider>(context);
    final results = gameProvider.gameResults;
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;
    final isLoading = gameProvider.isLoading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Results',
              style: GoogleFonts.poppins(
                fontSize: isTablet ? 24 : 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            TextButton.icon(
              onPressed: () => _viewAllResults(context),
              icon: const Icon(Icons.arrow_forward, size: 16),
              label: const Text('View All'),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 15),
        if (isLoading)
          const Center(child: CircularProgressIndicator())
        else if (results.isEmpty)
          const Center(child: Text('No recent results found'))
        else
          ...results.take(3).map((result) => _buildResultItem(result, context)),
      ],
    );
  }

  Widget _buildResultItem(GameResult result, BuildContext context) {
    final formattedDate = DateFormat('d MMM, h:mm a').format(result.resultDate);
    final resultColor = _getResultColor(result.gameClass);
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(isTablet ? 20 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: resultColor.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: resultColor.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(isTablet ? 14 : 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  resultColor.withValues(alpha: 0.2),
                  resultColor.withValues(alpha: 0.1),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: Text(
              result.gameClass,
              style: TextStyle(
                fontSize: isTablet ? 18 : 16,
                fontWeight: FontWeight.bold,
                color: resultColor,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Game #${result.id}',
                  style: TextStyle(
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formattedDate,
                  style: TextStyle(
                    fontSize: isTablet ? 14 : 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: isTablet ? 16 : 12,
              vertical: isTablet ? 10 : 8,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  resultColor.withValues(alpha: 0.2),
                  resultColor.withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(25),
              border: Border.all(color: resultColor.withValues(alpha: 0.3)),
            ),
            child: Text(
              result.winningNumber,
              style: TextStyle(
                fontSize: isTablet ? 16 : 14,
                fontWeight: FontWeight.bold,
                color: resultColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getResultColor(String gameClass) {
    switch (gameClass) {
      case 'A':
        return AppColors.classA;
      case 'B':
        return AppColors.classB;
      case 'C':
        return AppColors.classC;
      case 'D':
        return AppColors.primary;
      default:
        return Colors.blue;
    }
  }

  void _goToPlayGame(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const GameScreen(gameClass: 'A')),
    );
  }

  void _playGameClass(String gameClass, BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => GameScreen(gameClass: gameClass)),
    );
  }

  void _viewAllResults(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(
      builder: (context) => MultiProvider(
        providers: [
          ChangeNotifierProvider.value(
            value: Provider.of<AuthProvider>(context, listen: false),
          ),
          ChangeNotifierProvider.value(
            value: Provider.of<GameProvider>(context, listen: false),
          ),
          ChangeNotifierProvider.value(
            value: Provider.of<WalletProvider>(context, listen: false),
          ),
        ],
        child: const ResultsScreen(),
      ),
    ));
  }
}
