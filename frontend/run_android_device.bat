@echo off
call "%~dp0config_run.bat"
cd /d "%~dp0"
echo Chay Flutter Android (thiet bi that - cung WiFi)...
flutter run -d android --dart-define=GOOGLE_SERVER_CLIENT_ID=%GOOGLE_SERVER_CLIENT_ID% --dart-define=API_BASE_URL=%API_BASE_URL_DEVICE%
pause
