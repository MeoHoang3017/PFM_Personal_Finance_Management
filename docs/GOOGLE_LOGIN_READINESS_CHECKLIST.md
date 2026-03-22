# Kiểm tra sẵn sàng Login Google trên mọi thiết bị

Báo cáo kiểm tra **backend** và **frontend** cho đăng nhập Google trên **Android, iOS, Web, Desktop (Windows/macOS/Linux)**.

---

## 1. Backend

| Hạng mục | Trạng thái | Chi tiết |
|----------|------------|----------|
| **Route** | ✅ Sẵn sàng | `POST /api/auth/google` (auth.route.ts), không yêu cầu JWT |
| **Controller** | ✅ Sẵn sàng | auth.controller.ts: nhận `idToken`, gọi loginWithGoogleService, set cookie, trả TokenResponse |
| **Service** | ✅ Sẵn sàng | auth.service.ts: verify idToken (googleLogin), tạo/cập nhật user, tạo ví mặc định, trả JWT |
| **Verify token** | ✅ Sẵn sàng | googleLogin.ts: nhiều Client ID (GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID) |
| **User model** | ✅ Sẵn sàng | user.model.ts: có trường googleId |
| **API client** | ✅ Đúng | Interceptor không gửi refresh khi path = `/auth/google` (api_client.dart) |

**Cần cấu hình:** Trong `backend/.env` phải có ít nhất một trong các biến:

- `GOOGLE_WEB_CLIENT_ID` (bắt buộc, trùng với frontend Web Client ID)
- Tùy chọn: `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` nếu dùng 3 credential riêng

---

## 2. Frontend – Auth flow

| Hạng mục | Trạng thái | Chi tiết |
|----------|------------|----------|
| **Package** | ✅ Sẵn sàng | google_sign_in_all_platforms: ^2.0.2 (Android, iOS, Web, Desktop) |
| **AuthService** | ✅ Sẵn sàng | Một GoogleSignIn (clientId, clientSecret, scopes, redirectPort), loginWithGoogle() / loginWithGoogleWithCredentials() |
| **Gửi idToken** | ✅ Sẵn sàng | POST /auth/google với body { idToken } |
| **Lưu token** | ✅ Sẵn sàng | _persistAuthResponse lưu accessToken, refreshToken, user vào secure storage |
| **Logout** | ✅ Sẵn sàng | Gọi googleSignInAllPlatforms.signOut() + clearTokensOnly + POST /auth/logout |

---

## 3. Frontend – Từng nền tảng

### Android

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|--------|
| **Luồng đăng nhập** | ✅ | loginWithGoogle() → signIn() / signInOnline() → gửi idToken |
| **Client ID** | ✅ | Dùng chung googleServerClientId (app_constants) |
| **build.gradle** | ⚪ Tùy chọn | Có thể thêm `resValue "string", "default_web_client_id", "<Web Client ID>"` nếu cần (xem docs/GOOGLE_OAUTH_3_CREDENTIALS_SETUP.md) |
| **Backend verify** | ✅ | Cần GOOGLE_WEB_CLIENT_ID hoặc GOOGLE_ANDROID_CLIENT_ID trong .env |

### iOS

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|--------|
| **Luồng đăng nhập** | ✅ | Cùng flow Android (signIn / signInOnline) |
| **Client ID** | ✅ | Dùng chung googleServerClientId |
| **Info.plist** | ✅ | CFBundleURLSchemes = reversed Web Client ID (com.googleusercontent.apps.371279773491-v0q45qucn22adg7j4907jdh6ig44oug4) |
| **Đồng bộ** | ⚠️ Cần kiểm tra | Nếu đổi GOOGLE_SERVER_CLIENT_ID thì phải sửa lại CFBundleURLSchemes trong Info.plist cho khớp (reversed Client ID) |
| **Backend verify** | ✅ | GOOGLE_WEB_CLIENT_ID hoặc GOOGLE_IOS_CLIENT_ID trong .env |

### Web

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|--------|
| **Luồng đăng nhập** | ✅ | signInButton() + StreamBuilder(authenticationState) → loginWithGoogleWithCredentials(credentials) |
| **LoginScreen** | ✅ | kIsWeb → _buildWebGoogleSignIn (StreamBuilder + signInButton), không gọi signIn() trực tiếp |
| **Client ID/Secret** | ✅ | Dùng googleServerClientId; Client secret không bắt buộc cho web |
| **Backend verify** | ✅ | GOOGLE_WEB_CLIENT_ID trong .env |

### Desktop (Windows / macOS / Linux)

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|--------|
| **Luồng đăng nhập** | ✅ | signIn() / signInOnline() qua trình duyệt mặc định |
| **Client Secret** | ✅ Bắt buộc | GOOGLE_CLIENT_SECRET trong app_constants hoặc dart-define (lấy từ Web application credential) |
| **Redirect URI** | ✅ | redirectPort 8000 → trong Google Console thêm http://localhost:8000 |
| **Backend verify** | ✅ | Cùng Web Client ID (id_token từ OAuth flow Web client) |

---

## 4. Cấu hình cần có

### Backend (`backend/.env`)

```env
# Bắt buộc (ít nhất một)
GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com

# Tùy chọn nếu dùng 3 credential
# GOOGLE_IOS_CLIENT_ID=yyy.apps.googleusercontent.com
# GOOGLE_ANDROID_CLIENT_ID=zzz.apps.googleusercontent.com
```

### Frontend (`app_constants.dart` hoặc dart-define)

- **GOOGLE_SERVER_CLIENT_ID** = Web Client ID (trùng với backend GOOGLE_WEB_CLIENT_ID).
- **GOOGLE_CLIENT_SECRET** = Web Client secret (bắt buộc cho desktop; có thể để rỗng cho mobile/web).

### iOS

- **Info.plist** → `CFBundleURLSchemes` = `com.googleusercontent.apps.<phần-trước-.apps.googleusercontent.com>` (reversed Client ID đang dùng cho sign-in, thường là Web Client ID).

---

## 5. Rủi ro / Lưu ý

1. **Client secret trong code:** `app_constants.dart` đang có defaultValue cho `googleClientSecret`. Production nên dùng `--dart-define=GOOGLE_CLIENT_SECRET=...` hoặc env, không commit secret vào repo.
2. **Hai Client ID trong app_constants:** `googleClientId` (default khác) và `googleServerClientId` — hiện chỉ `googleServerClientId` được dùng trong AuthService. Nếu chỉ dùng một Web client cho tất cả nền tảng thì giữ như vậy; nếu sau này tách iOS/Android client thì cần dùng thêm `googleClientId` và cập nhật backend tương ứng.
3. **iOS URL scheme:** Mỗi lần đổi Web Client ID (googleServerClientId) cần sửa lại `CFBundleURLSchemes` trong `ios/Runner/Info.plist` cho khớp reversed Client ID.

---

## 6. Kết luận

| Nền tảng | Sẵn sàng | Điều kiện |
|----------|----------|-----------|
| **Backend** | ✅ | Có ít nhất GOOGLE_WEB_CLIENT_ID trong .env |
| **Android** | ✅ | Cùng Client ID với backend |
| **iOS** | ✅ | Info.plist đúng reversed Client ID; backend có client ID tương ứng |
| **Web** | ✅ | Dùng signInButton + stream; backend có GOOGLE_WEB_CLIENT_ID |
| **Desktop** | ✅ | Có GOOGLE_CLIENT_SECRET và redirect URI http://localhost:8000 trong Console |

**Tổng thể:** Backend và frontend **đã sẵn sàng** cho login Google trên tất cả thiết bị (Android, iOS, Web, Desktop). Chỉ cần cấu hình đúng `.env` (backend), Client ID/Secret (frontend), và iOS `Info.plist` / redirect URI (desktop) theo hướng dẫn trong `docs/GOOGLE_OAUTH_3_CREDENTIALS_SETUP.md`.
