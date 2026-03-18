@echo off
call "%~dp0config_run.bat"
cd /d "%~dp0"
echo Chay Flutter Web (Chrome)...
flutter run -d chrome --dart-define=GOOGLE_SERVER_CLIENT_ID=%GOOGLE_SERVER_CLIENT_ID% --dart-define=GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% --dart-define=API_BASE_URL=%API_BASE_URL_LOCAL%
pause
