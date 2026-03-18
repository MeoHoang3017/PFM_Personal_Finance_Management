# Chạy app Flutter — lệnh ngắn

Chỉ cần **sửa một lần** trong `config_run.bat`, sau đó double-click hoặc gõ lệnh tương ứng.

---

## Bước 1: Cấu hình (một lần)

Mở file **`config_run.bat`** trong thư mục `frontend`, sửa:

- **GOOGLE_SERVER_CLIENT_ID** = Web Client ID từ Google Cloud (trùng với backend `.env`).
- **API_BASE_URL_DEVICE** = IP máy tính (vd `192.168.1.100`) khi chạy app trên điện thoại thật cùng WiFi.

Các biến khác (localhost, 10.0.2.2) thường giữ nguyên.

---

## Bước 2: Chạy từng nền tảng

Trong thư mục **`frontend`**, chạy **một** trong các lệnh sau (hoặc double-click file `.bat` tương ứng):

| Lệnh | File | Mô tả |
|------|------|--------|
| **run_web.bat** | `run_web.bat` | Chạy trên **Chrome** (Web) |
| **run_windows.bat** | `run_windows.bat` | Chạy app **Windows** (desktop) |
| **run_android.bat** | `run_android.bat` | Chạy trên **Android Emulator** |
| **run_android_device.bat** | `run_android_device.bat` | Chạy trên **điện thoại Android thật** (cùng WiFi) |
| **run_ios.bat** | `run_ios.bat` | Chạy **iOS** (cần macOS + Xcode) |

### Cách chạy

**Cách 1 — Double-click:** Vào thư mục `frontend` → double-click file `.bat` cần dùng (vd `run_web.bat`).

**Cách 2 — Từ terminal (CMD/PowerShell):**
```cmd
cd frontend
run_web.bat
```
hoặc
```cmd
cd frontend
run_windows.bat
```
hoặc
```cmd
run_android.bat
```
(tương tự cho các file khác).

---

## Client ID theo nền tảng (Google Sign-In)

| Nền tảng | Cần set thêm? | Đặt ở đâu |
|----------|----------------|-----------|
| **Android** | Chỉ cần **Web Client ID** | Đã đủ trong `config_run.bat` → `GOOGLE_SERVER_CLIENT_ID`. Các file `run_android*.bat` truyền vào app qua `--dart-define`. Trên Google Cloud Console cần tạo thêm OAuth client loại **Android** (package name + SHA-1), không cần ghi client ID vào file native. |
| **Windows** | Chỉ cần **Web Client ID** | Đã đủ trong `config_run.bat`. `run_windows.bat` truyền `GOOGLE_SERVER_CLIENT_ID` và `GOOGLE_CLIENT_ID` qua `--dart-define`. Không cần file cấu hình native. |
| **iOS** | Cần **Web Client ID** + **URL scheme** | **Dart:** `GOOGLE_SERVER_CLIENT_ID` và `GOOGLE_CLIENT_ID` trong `config_run.bat` → `run_ios.bat` truyền vào app. **Native:** Trong `ios/Runner/Info.plist` đã thêm `CFBundleURLTypes` với **reversed client ID** (dạng `com.googleusercontent.apps.XXX`). Nếu bạn đổi Web Client ID trong `config_run.bat`, nhớ sửa luôn URL scheme trong `Info.plist` cho khớp. |
| **Web** | Chỉ cần **Web Client ID** | Đủ trong `config_run.bat`; `run_web.bat` truyền cả hai biến. Không cần file native. |

Tóm lại: chỉ cần sửa **một chỗ** là `config_run.bat` (hai dòng `GOOGLE_SERVER_CLIENT_ID` và `GOOGLE_CLIENT_ID`). Chỉ khi đổi client ID và chạy iOS thì cần sửa thêm `ios/Runner/Info.plist` (đoạn `CFBundleURLSchemes`).

---

## Lưu ý

- **Backend** phải đang chạy (vd `cd backend` → `npm run dev`) trước khi test đăng nhập.
- **Android Emulator:** dùng `run_android.bat` (đã set sẵn `10.0.2.2:5000`).
- **Điện thoại thật:** sửa `API_BASE_URL_DEVICE` trong `config_run.bat` thành IP máy tính rồi chạy `run_android_device.bat`.
