import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import '../constants/colors.dart';
import '../constants/app_constants.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _fadeInAnimation;
  bool _showLoadingIndicator = false;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _initializeSplash();
  }

  void _setupAnimations() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    _logoScaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );

    _fadeInAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.6, 1.0, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();

    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {
          _showLoadingIndicator = true;
        });
      }
    });
  }

  Future<void> _initializeSplash() async {
    try {
      // Wait for animations and minimum splash duration
      await Future.delayed(const Duration(seconds: 3));

      if (mounted) {
        // Check authentication status with error handling
        final authProvider = Provider.of<AuthProvider>(context, listen: false);

        // Wait for auth provider to initialize
        int retries = 0;
        while (!authProvider.isInitialized && retries < 10) {
          await Future.delayed(const Duration(milliseconds: 100));
          retries++;
        }

        // Navigate based on auth status
        Widget nextScreen;
        if (authProvider.isLoggedIn && authProvider.currentUser != null) {
          nextScreen = const MainScreen();
        } else {
          nextScreen = const LoginScreen();
        }

        if (mounted) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              transitionDuration: const Duration(milliseconds: 1000),
              pageBuilder: (context, animation, secondaryAnimation) =>
                  nextScreen,
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                    var curve = Curves.easeInOutCubic;
                    var curvedAnimation = CurvedAnimation(
                      parent: animation,
                      curve: curve,
                    );

                    return FadeTransition(
                      opacity: curvedAnimation,
                      child: ScaleTransition(
                        scale: Tween<double>(
                          begin: 0.9,
                          end: 1.0,
                        ).animate(curvedAnimation),
                        child: child,
                      ),
                    );
                  },
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Splash initialization error: $e');
      // Fallback to login screen on error
      if (mounted) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 800),
            pageBuilder: (context, animation, secondaryAnimation) =>
                const LoginScreen(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
                  return FadeTransition(opacity: animation, child: child);
                },
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.primary, AppColors.secondary],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated Dice Logo with Lottie
              Stack(
                alignment: Alignment.center,
                children: [
                  // Background glow effect
                  AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.5),
                              blurRadius: 30 * _logoScaleAnimation.value,
                              spreadRadius: 10 * _logoScaleAnimation.value,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  // Dice animation
                  AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _logoScaleAnimation.value,
                        child: Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(25),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black38,
                                blurRadius: 20,
                                spreadRadius: 2,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Lottie.asset(
                            'assets/animations/dice_animation.json',
                            width: 140,
                            height: 140,
                            errorBuilder: (context, error, stackTrace) {
                              // Fallback to static icon if Lottie fails
                              return ShaderMask(
                                shaderCallback: (Rect bounds) {
                                  return LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.accent,
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ).createShader(bounds);
                                },
                                child: Icon(
                                  Icons.casino,
                                  size: 90,
                                  color: Colors.white,
                                ),
                              );
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 50),
              // Animated App Name
              FadeTransition(
                opacity: _fadeInAnimation,
                child: SlideTransition(
                  position:
                      Tween<Offset>(
                        begin: const Offset(0, 0.5),
                        end: Offset.zero,
                      ).animate(
                        CurvedAnimation(
                          parent: _animationController,
                          curve: const Interval(
                            0.6,
                            1.0,
                            curve: Curves.easeOutQuad,
                          ),
                        ),
                      ),
                  child: Text(
                    AppConstants.appName,
                    style: const TextStyle(
                      fontSize: 44,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 2,
                      shadows: [
                        Shadow(
                          blurRadius: 10,
                          color: Colors.black26,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Animated Tagline
              FadeTransition(
                opacity: _fadeInAnimation,
                child: SlideTransition(
                  position:
                      Tween<Offset>(
                        begin: const Offset(0, 0.5),
                        end: Offset.zero,
                      ).animate(
                        CurvedAnimation(
                          parent: _animationController,
                          curve: const Interval(
                            0.7,
                            1.0,
                            curve: Curves.easeOutQuad,
                          ),
                        ),
                      ),
                  child: Text(
                    AppConstants.appTagline,
                    style: TextStyle(
                      fontSize: 22,
                      color: Colors.white.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 70),
              // Loading Indicator with animation
              if (_showLoadingIndicator)
                FadeTransition(
                  opacity: _fadeInAnimation,
                  child: SpinKitPulse(color: Colors.white, size: 50.0),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
