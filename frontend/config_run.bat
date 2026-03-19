@echo off
REM ============================================================
REM Cấu hình chạy app - SỬA CÁC GIÁ TRỊ DƯỚI ĐÂY CHO ĐÚNG
REM Sau khi sửa, chạy: run_web.bat / run_windows.bat / run_android.bat
REM ============================================================

REM Web Client ID từ Google Cloud (phải trùng với backend .env GOOGLE_WEB_CLIENT_ID)
set GOOGLE_SERVER_CLIENT_ID=371279773491-v0q45qucn22adg7j4907jdh6ig44oug4.apps.googleusercontent.com

REM Client ID cho Web/iOS (thường = GOOGLE_SERVER_CLIENT_ID)
set GOOGLE_CLIENT_ID=%GOOGLE_SERVER_CLIENT_ID%

REM Backend API - localhost khi chạy Web/Desktop trên máy
set API_BASE_URL_LOCAL=http://localhost:5000

REM Cổng cố định khi chạy Flutter Web (Chrome) - tránh cổng ngẫu nhiên. Thêm http://localhost:%WEB_PORT% vào Authorized JavaScript origins (Google OAuth) nếu dùng Google Sign-In web.
set WEB_PORT=7357

REM Backend API - dùng cho Android Emulator (10.0.2.2 = localhost của máy host)
set API_BASE_URL_ANDROID_EMU=http://10.0.2.2:5000

REM Backend API - dùng khi test app trên thiết bị thật (thay bằng IP máy tính, ví dụ 192.168.1.100)
set API_BASE_URL_DEVICE=http://192.168.1.100:5000
