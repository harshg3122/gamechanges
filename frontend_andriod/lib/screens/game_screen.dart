import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/bet_dialog.dart';
import '../utils/utils.dart';

class GameScreen extends StatefulWidget {
  final String gameClass;

  const GameScreen({super.key, required this.gameClass});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late List<String> _numbers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNumbers();
  }

  Future<void> _loadNumbers() async {
    setState(() {
      _isLoading = true;
    });

    await Future.delayed(const Duration(milliseconds: 300)); // Simulate loading

    List<String> nums = [];
    switch (widget.gameClass) {
      case 'A':
        nums = [
          '0',
          '127',
          '136',
          '145',
          '190',
          '235',
          '280',
          '370',
          '479',
          '460',
          '569',
          '389',
          '578',
          '1',
          '128',
          '137',
          '146',
          '236',
          '245',
          '290',
          '380',
          '470',
          '489',
          '560',
          '678',
          '579',
          '2',
          '129',
          '138',
          '147',
          '156',
          '237',
          '246',
          '345',
          '390',
          '480',
          '570',
          '589',
          '679',
          '3',
          '120',
          '139',
          '148',
          '157',
          '238',
          '247',
          '256',
          '346',
          '490',
          '580',
          '175',
          '256',
          '4',
          '130',
          '149',
          '158',
          '167',
          '239',
          '248',
          '257',
          '347',
          '356',
          '590',
          '680',
          '789',
          '5',
          '140',
          '159',
          '168',
          '230',
          '249',
          '258',
          '267',
          '348',
          '357',
          '456',
          '690',
          '780',
          '6',
          '123',
          '150',
          '169',
          '178',
          '240',
          '259',
          '268',
          '349',
          '358',
          '457',
          '367',
          '790',
          '7',
          '124',
          '160',
          '179',
          '250',
          '269',
          '278',
          '340',
          '359',
          '368',
          '458',
          '467',
          '890',
          '8',
          '125',
          '134',
          '170',
          '189',
          '260',
          '279',
          '350',
          '369',
          '378',
          '459',
          '567',
          '468',
          '9',
          '135',
          '180',
          '234',
          '270',
          '289',
          '360',
          '379',
          '450',
          '469',
          '478',
          '568',
          '679',
        ];
        break;
      case 'B':
        nums = [
          '0',
          '550',
          '668',
          '244',
          '299',
          '226',
          '334',
          '488',
          '667',
          '118',
          '1',
          '100',
          '119',
          '155',
          '227',
          '335',
          '344',
          '399',
          '588',
          '669',
          '2',
          '200',
          '110',
          '228',
          '255',
          '336',
          '449',
          '660',
          '688',
          '778',
          '3',
          '300',
          '166',
          '229',
          '337',
          '355',
          '445',
          '599',
          '779',
          '788',
          '4',
          '400',
          '112',
          '220',
          '266',
          '338',
          '446',
          '455',
          '699',
          '770',
          '5',
          '500',
          '113',
          '122',
          '177',
          '339',
          '366',
          '447',
          '799',
          '889',
          '6',
          '600',
          '114',
          '277',
          '330',
          '448',
          '466',
          '556',
          '880',
          '899',
          '7',
          '700',
          '115',
          '133',
          '188',
          '223',
          '377',
          '449',
          '557',
          '566',
          '8',
          '800',
          '116',
          '224',
          '233',
          '288',
          '440',
          '477',
          '558',
          '990',
          '9',
          '900',
          '117',
          '144',
          '199',
          '225',
          '388',
          '559',
          '577',
          '667',
        ];
        break;
      case 'C':
        nums = [
          '000',
          '111',
          '222',
          '333',
          '444',
          '555',
          '666',
          '777',
          '888',
          '999',
        ];
        break;
      case 'D':
        nums = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        nums.sort((a, b) => int.parse(a).compareTo(int.parse(b)));
        break;
      default:
        nums = [];
    }

    setState(() {
      _numbers = nums;
      _isLoading = false;
    });
  }

  Color _getClassColor() {
    return Utils.getColorByClass(widget.gameClass);
  }

  void _showBetDialog(String number) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final gameProvider = Provider.of<GameProvider>(
      context,
      listen: false,
    );
    final user = authProvider.currentUser;

    if (user == null) return;

    // Debug: Print current balance
    debugPrint('Current wallet balance before betting: ${user.walletBalance}');

    // Calculate time slot for current time
    final now = DateTime.now();
    final hour = now.hour;
    final slotHour = hour < 11 ? 11 : (hour > 23 ? 23 : hour);
    final timeSlotStr =
        '${slotHour > 12 ? slotHour - 12 : slotHour}:00 ${slotHour >= 12 ? 'PM' : 'AM'}';

    showDialog(
      context: context,
      builder: (context) => BetDialog(
        selectedNumber: number,
        gameClass: widget.gameClass,
        walletBalance: user.walletBalance,
        timeSlot: timeSlotStr,
        onBetPlaced: (amount, selectedTimeSlot) async {
          // Refresh balance one more time before placing bet
          await authProvider.refreshWalletBalance();
          debugPrint('Refreshed wallet balance: ${authProvider.currentUser?.walletBalance}');
          
          final success = await gameProvider.selectNumber(
            gameClass: widget.gameClass,
            number: number,
            amount: amount.toDouble(),
            authProvider: authProvider,
            timeSlot: selectedTimeSlot,
          );

          if (success && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Bet placed successfully!'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (context.mounted) {
            // Show error message
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to place bet. Please try again.'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildNumberGrid() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_numbers.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No numbers available for Class ${widget.gameClass}'),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadNumbers, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (widget.gameClass == 'A' || widget.gameClass == 'B') {
      // Group numbers by title (0-9)
      Map<String, List<String>> grouped = {};
      String? currentTitle;
      for (var num in _numbers) {
        if (num.length == 1 && int.tryParse(num) != null) {
          currentTitle = num;
          grouped.putIfAbsent(currentTitle, () => []);
        } else if (currentTitle != null) {
          grouped[currentTitle]!.add(num);
        }
      }

      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: grouped.entries.map((entry) {
            final sortedNumbers = entry.value
              ..sort((a, b) => int.parse(a).compareTo(int.parse(b)));
            final int columns = 3;
            final int total = sortedNumbers.length;
            final int rows = (total / columns).ceil();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange, width: 2),
                      ),
                      child: Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange,
                        ),
                      ),
                    ),
                  ),
                ),
                const Divider(thickness: 2, color: Colors.orange),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    for (int row = 0; row < rows; row++)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (int col = 0; col < columns; col++)
                            if (row * columns + col < total)
                              SizedBox(
                                width: 100,
                                child: Align(
                                  alignment: Alignment.center,
                                  child: _buildNumberTile(
                                    sortedNumbers[row * columns + col],
                                    row * columns + col,
                                  ),
                                ),
                              )
                            else
                              const SizedBox(width: 100),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            );
          }).toList(),
        ),
      );
    }

    // For all other classes: show numbers in a simple 3-column grid
    final sortedNumbers = _numbers.toList()
      ..sort((a, b) => int.parse(a).compareTo(int.parse(b)));
    final int columns = 3;
    final int total = sortedNumbers.length;
    final int rows = (total / columns).ceil();
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          for (int row = 0; row < rows; row++)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (int col = 0; col < columns; col++)
                  if (row * columns + col < total)
                    SizedBox(
                      width: 100,
                      child: Align(
                        alignment: Alignment.center,
                        child: _buildNumberTile(
                          sortedNumbers[row * columns + col],
                          row * columns + col,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 100),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildNumberTile(String number, int index, {bool customSize = false}) {
    return Padding(
      padding: const EdgeInsets.all(6.0),
      child: SizedBox(
        width: customSize ? 120 : 110,
        height: customSize ? 60 : 54,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.symmetric(vertical: 12),
            elevation: 3,
          ),
          onPressed: () => _showBetDialog(number),
          child: Text(
            number,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Class ${widget.gameClass} Game',
        walletBalance: user?.walletBalance,
        showWallet: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(
                    'Class ${widget.gameClass} Info',
                    style: TextStyle(color: _getClassColor()),
                  ),
                  content: Text(Utils.getClassDescription(widget.gameClass)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: _getClassColor().withValues(alpha: 0.1),
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              'Select a number to place your bet',
              style: TextStyle(fontSize: 16, color: _getClassColor()),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(child: _buildNumberGrid()),
        ],
      ),
    );
  }
}
