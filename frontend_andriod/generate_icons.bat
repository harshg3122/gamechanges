@echo off
echo ========================================
echo  FLUTTER LAUNCHER ICONS GENERATOR
echo ========================================
echo.
echo 1. Make sure you have saved your game logo as:
echo    assets/icons/game_logo.png
echo.
echo 2. The image should be at least 512x512 pixels
echo.
echo 3. Press any key to generate icons...
pause > nul
echo.
echo Generating app icons...
dart run flutter_launcher_icons
echo.
echo Done! Your app now has the new logo.
pause
