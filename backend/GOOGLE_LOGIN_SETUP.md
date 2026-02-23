# Google Login Setup Guide

## Tổng quan
Hệ thống hỗ trợ đăng nhập với Google sử dụng `google-auth-library` để verify ID token từ Flutter app (hỗ trợ 4 platforms: iOS, Android, Web, Desktop).

## Cài đặt Dependencies

Package `googleapis` đã được cài đặt (bao gồm `google-auth-library`). Nếu chưa có:

```bash
npm install googleapis
```

## Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# Google OAuth Configuration
# Web Client ID (required)
GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# iOS Client ID (optional - nếu khác với web)
GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com

# Android Client ID (optional - nếu khác với web)
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

## Setup Google OAuth Credentials

### 1. Tạo OAuth 2.0 Client IDs trong Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn hoặc tạo project mới
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn application type:
   - **Web application** - cho Web Client ID
   - **iOS** - cho iOS Client ID
   - **Android** - cho Android Client ID

### 2. Cấu hình cho Flutter

#### Web Platform
- Sử dụng **Web Client ID** từ Google Cloud Console
- Set trong Flutter: `GOOGLE_WEB_CLIENT_ID`

#### iOS Platform
- Sử dụng **iOS Client ID** từ Google Cloud Console
- Hoặc dùng chung **Web Client ID** nếu không tạo riêng
- Set trong Flutter: `GOOGLE_IOS_CLIENT_ID` (hoặc dùng web client ID)

#### Android Platform
- Sử dụng **Android Client ID** từ Google Cloud Console
- Hoặc dùng chung **Web Client ID** nếu không tạo riêng
- Set trong Flutter: `GOOGLE_ANDROID_CLIENT_ID` (hoặc dùng web client ID)

#### Desktop Platform
- Thường dùng chung **Web Client ID**

## API Endpoint

### Login with Google
```
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_from_flutter"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Login successful",
  "result": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "user_id",
      "username": "generated_username",
      "email": "user@example.com",
      "theme": "light",
      "language": "en",
      "currency": "USD",
      "avatarUrl": "https://..."
    }
  }
}
```

**Cookies:**
- `accessToken` - Set as httpOnly cookie (24 hours)
- `refreshToken` - Set as httpOnly cookie (7 days)

## Flutter Integration

### 1. Cài đặt package
```yaml
dependencies:
  google_sign_in: ^6.1.5
```

### 2. Example code
```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // Sign in with Google
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      
      if (account == null) {
        return null; // User cancelled
      }

      // Get authentication details
      final GoogleSignInAuthentication auth = await account.authentication;
      
      if (auth.idToken == null) {
        throw Exception('Failed to get ID token');
      }

      // Send ID token to backend
      final response = await http.post(
        Uri.parse('https://your-api.com/api/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': auth.idToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['result'];
      } else {
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      print('Google Sign In Error: $e');
      return null;
    }
  }
}
```

### 3. Platform-specific configuration

#### iOS (`ios/Runner/Info.plist`)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### Android (`android/app/build.gradle`)
```gradle
android {
    defaultConfig {
        // Add your Google Client ID
        resValue "string", "default_web_client_id", "YOUR_WEB_CLIENT_ID"
    }
}
```

## Cách hoạt động

1. **Flutter app** gọi Google Sign-In và nhận được `idToken`
2. **Flutter app** gửi `idToken` đến backend endpoint `/api/auth/google`
3. **Backend** verify `idToken` với Google sử dụng `google-auth-library`
   - Hỗ trợ multiple client IDs (web, iOS, Android)
   - Tự động thử từng client ID cho đến khi verify thành công
4. **Backend** kiểm tra user trong database:
   - Nếu user đã tồn tại (theo email hoặc googleId): update thông tin nếu cần
   - Nếu user chưa tồn tại: tạo user mới với thông tin từ Google
5. **Backend** tạo JWT tokens (accessToken, refreshToken) và trả về cho Flutter
6. **Flutter** lưu tokens và sử dụng cho các API calls tiếp theo

## Tính năng

- ✅ Hỗ trợ multiple platforms (iOS, Android, Web, Desktop)
- ✅ Auto-create user nếu chưa tồn tại
- ✅ Auto-update thông tin user (avatar, username) nếu thiếu
- ✅ Generate unique username tự động
- ✅ Database transaction để đảm bảo data consistency
- ✅ Set cookies cho tokens (httpOnly, secure)
- ✅ Error handling đầy đủ

## Lưu ý

1. **Username generation**: 
   - Tự động generate từ Google name hoặc email
   - Đảm bảo unique trong database
   - Format: `firstname_lastname` hoặc `email_prefix`

2. **Password**: 
   - User đăng nhập bằng Google không có password
   - Không thể reset password cho Google users
   - Không thể login bằng email/password nếu đã có googleId

3. **Avatar**: 
   - Tự động lấy từ Google profile picture
   - Chỉ update nếu user chưa có avatar

4. **Security**:
   - ID token được verify với Google trước khi tạo/login user
   - Tokens được set với httpOnly và secure flags
   - Hỗ trợ multiple client IDs để tăng tính linh hoạt

## Troubleshooting

### Error: "Invalid Google Token"
- Kiểm tra client ID có đúng không
- Kiểm tra ID token có hợp lệ không
- Kiểm tra token chưa hết hạn

### Error: "No Google Client IDs configured"
- Đảm bảo đã set `GOOGLE_WEB_CLIENT_ID` trong `.env`
- Restart server sau khi thay đổi env variables

### Error: "Email not found in Google account"
- User phải cấp quyền email khi đăng nhập
- Kiểm tra scopes trong Flutter: `['email', 'profile']`

### User không được tạo
- Kiểm tra database connection
- Kiểm tra logs để xem có error gì không
- Kiểm tra transaction có commit thành công không

