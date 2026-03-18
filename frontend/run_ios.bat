@echo off
call "%~dp0config_run.bat"
cd /d "%~dp0"
echo Chay Flutter iOS (simulator - can macOS)...
flutter run -d ios --dart-define=GOOGLE_SERVER_CLIENT_ID=%GOOGLE_SERVER_CLIENT_ID% --dart-define=GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% --dart-define=API_BASE_URL=%API_BASE_URL_LOCAL%
pause
