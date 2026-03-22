# Hướng dẫn chi tiết: Cấu hình Google Sign-In với 3 OAuth Credentials (Web, Android, iOS)

Tài liệu này mô tả **từng bước** cách lấy dữ liệu từ Google Cloud Console khi bạn đã tạo sẵn **3 OAuth 2.0 Client ID**: Web application, Android, iOS — và **điền vào đúng file** (backend / frontend), **biến nào**, **dữ liệu lấy từ đâu**.

---

## Phần 1: Lấy dữ liệu từ Google Cloud Console

### Bước 1.1: Vào trang Credentials

1. Mở trình duyệt, truy cập: **https://console.cloud.google.com/apis/credentials**
2. Chọn **đúng project** (góc trên bên trái).
3. Trên trang **Credentials** bạn sẽ thấy danh sách OAuth 2.0 Client IDs (nếu đã tạo).

### Bước 1.2: Xác định 3 credential đã tạo

Bạn cần **3 dòng** tương ứng **3 loại**:

| Loại trong Console     | Application type khi tạo | Dữ liệu cần lấy |
|------------------------|---------------------------|------------------|
| **Web application**    | Web application           | **Client ID** + **Client secret** |
| **Android**            | Android                   | **Client ID** (và package name / SHA-1 nếu cần) |
| **iOS**                | iOS                       | **Client ID** (và Bundle ID nếu cần) |

### Bước 1.3: Lấy từng giá trị

#### A) Web application credential

1. Trong danh sách Credentials, click vào tên credential loại **Web client** (hoặc Web application).
2. Trong trang chi tiết:
   - **Client ID**: dạng `xxxxx-yyyy.apps.googleusercontent.com` → copy nguyên chuỗi.
   - **Client secret**: click **Show** hoặc icon copy → copy chuỗi (dùng cho **desktop** Flutter, không gửi lên backend).
3. Nếu dùng đăng nhập Google trên **desktop** (Windows/Linux/macOS):
   - Trong cùng credential Web, mục **Authorized redirect URIs** → thêm: `http://localhost:8000` (cổng mặc định của app desktop).
   - Lưu (Save).

**Tóm tắt lấy được:**
- `WEB_CLIENT_ID` = Client ID (ví dụ: `371279773491-xxx.apps.googleusercontent.com`)
- `WEB_CLIENT_SECRET` = Client secret (chỉ dùng ở frontend cho desktop)

#### B) Android credential

1. Click vào credential loại **Android**.
2. Copy **Client ID** (dạng `xxxxx-yyyy.apps.googleusercontent.com`).
3. Ghi nhớ **Package name** và **SHA-1** (đã khai báo khi tạo) — dùng để Google chấp nhận token từ app Android.

**Tóm tắt lấy được:**
- `ANDROID_CLIENT_ID` = Client ID của Android OAuth client

#### C) iOS credential

1. Click vào credential loại **iOS**.
2. Copy **Client ID** (dạng `xxxxx-yyyy.apps.googleusercontent.com`).
3. Ghi nhớ **Bundle ID** (đã khai báo khi tạo).

**Tóm tắt lấy được:**
- `IOS_CLIENT_ID` = Client ID của iOS OAuth client

---

## Phần 2: File cần tạo/sửa và biến từng nơi

### Sơ đồ nhanh

```
Google Cloud Console
├── Web application    → Client ID + Client secret
│   ├── Backend:  .env  (GOOGLE_WEB_CLIENT_ID, không cần secret)
│   └── Frontend: app_constants.dart / dart-define (GOOGLE_SERVER_CLIENT_ID, GOOGLE_CLIENT_SECRET cho desktop)
├── Android            → Client ID
│   ├── Backend:  .env  (GOOGLE_ANDROID_CLIENT_ID)
│   └── Frontend: (thường dùng chung Web Client ID trong code; backend verify bằng ANDROID_CLIENT_ID)
└── iOS                → Client ID
    ├── Backend:  .env  (GOOGLE_IOS_CLIENT_ID)
    └── Frontend: ios/Runner/Info.plist (CFBundleURLSchemes = reversed Client ID)
```

---

## Backend

### File 1: `backend/.env` (tạo từ `.env.example`)

**Cách tạo:** Copy file `backend/.env.example` thành `backend/.env` (nếu chưa có), rồi mở `.env` và điền giá trị.

**Vị trí thư mục:**  
`PFM_Personal_Finance_Management/backend/.env`

**Dữ liệu lấy từ đâu → biến:**

| Biến trong `.env`           | Lấy từ đâu                          | Ví dụ (thay bằng giá trị thật) |
|-----------------------------|-------------------------------------|----------------------------------|
| `GOOGLE_WEB_CLIENT_ID`      | Web application → Client ID         | `371279773491-xxx.apps.googleusercontent.com` |
| `GOOGLE_IOS_CLIENT_ID`      | iOS credential → Client ID          | `371279773491-yyy.apps.googleusercontent.com` |
| `GOOGLE_ANDROID_CLIENT_ID`  | Android credential → Client ID     | `371279773491-zzz.apps.googleusercontent.com` |

**Đoạn cần có trong `backend/.env`:**

```env
# Google Login – Backend chỉ cần Client ID để verify id_token (không cần Client secret)
GOOGLE_WEB_CLIENT_ID=371279773491-xxx.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=371279773491-yyy.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=371279773491-zzz.apps.googleusercontent.com
```

**Ghi chú:** Backend đọc các biến này trong `backend/src/config/googleLogin.ts` (hàm `getGoogleClientIds()`). Backend **không** dùng Client secret; secret chỉ dùng ở frontend cho desktop.

**Nếu chỉ có 1 credential (Web):** Chỉ cần `GOOGLE_WEB_CLIENT_ID`. Có thể bỏ qua `GOOGLE_IOS_CLIENT_ID` và `GOOGLE_ANDROID_CLIENT_ID` nếu bạn dùng chung Web Client ID cho cả iOS/Android.

---

## Frontend

### File 2: `frontend/lib/core/constants/app_constants.dart`

**Vị trí:**  
`PFM_Personal_Finance_Management/frontend/lib/core/constants/app_constants.dart`

**Biến và nguồn dữ liệu:**

| Hằng trong code                 | Nguồn dữ liệu                    | Ghi chú |
|---------------------------------|-----------------------------------|--------|
| `googleServerClientId` (default hoặc dart-define `GOOGLE_SERVER_CLIENT_ID`) | **Web application → Client ID** | Phải **trùng** với `GOOGLE_WEB_CLIENT_ID` ở backend. App Flutter dùng làm “server/client” ID khi gọi Google Sign-In. |
| `googleClientId` (dart-define `GOOGLE_CLIENT_ID`) | **iOS credential → Client ID** (nếu app iOS dùng client riêng) | Tùy chọn; thường để trống và dùng chung Web. |
| `googleClientSecret` (dart-define `GOOGLE_CLIENT_SECRET`) | **Web application → Client secret** | Chỉ cần cho **desktop** (Windows/Linux/macOS). Mobile/Web không bắt buộc. |

**Cách điền:**

- **Cách 1 – Sửa default trong code (đơn giản, kém bảo mật hơn):**  
  Trong `app_constants.dart`, sửa `defaultValue` của `googleServerClientId` thành Web Client ID của bạn. Nếu dùng desktop, thêm `defaultValue` cho `googleClientSecret` (Client secret của Web).

- **Cách 2 – Dùng dart-define (khuyến nghị):**  
  Không cần sửa default; truyền lúc chạy/build:

```bash
# Ví dụ chạy Windows với Web Client ID + Client secret (desktop)
flutter run -d windows --dart-define=GOOGLE_SERVER_CLIENT_ID=371279773491-xxx.apps.googleusercontent.com --dart-define=GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# Ví dụ build Android (chỉ cần Web Client ID nếu dùng chung)
flutter build apk --dart-define=GOOGLE_SERVER_CLIENT_ID=371279773491-xxx.apps.googleusercontent.com
```

**Tóm tắt:**  
- **Web Client ID** → dùng cho `GOOGLE_SERVER_CLIENT_ID` (frontend) và `GOOGLE_WEB_CLIENT_ID` (backend).  
- **Web Client secret** → chỉ frontend, biến `GOOGLE_CLIENT_SECRET`, dùng khi chạy desktop.  
- **Android / iOS Client ID** → backend dùng để verify id_token do từng nền tảng gửi lên; frontend có thể vẫn dùng Web Client ID trong code (tùy cấu hình Google).

---

### File 3: `frontend/ios/Runner/Info.plist` (chỉ iOS)

**Vị trí:**  
`PFM_Personal_Finance_Management/frontend/ios/Runner/Info.plist`

**Dữ liệu lấy từ đâu:**  
**iOS OAuth Client ID** (hoặc Web Client ID nếu iOS dùng chung Web client).

**Cách điền:**  
URL scheme cho Google Sign-In = **reversed Client ID** (bỏ đuôi `.apps.googleusercontent.com`, thay bằng `com.googleusercontent.apps.` + phần còn lại).

- Client ID: `371279773491-yyy.apps.googleusercontent.com`  
- Reversed: `com.googleusercontent.apps.371279773491-yyy`

**Đoạn XML cần có (đã có sẵn, chỉ sửa chuỗi trong `<string>`):**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.371279773491-yyy</string>
    </array>
  </dict>
</array>
```

Thay `371279773491-yyy` bằng **phần trước** `.apps.googleusercontent.com` của **iOS Client ID** (hoặc Web Client ID nếu iOS dùng Web client).

---

### File 4: Android (tuỳ chọn) – `frontend/android/app/build.gradle`

**Vị trí:**  
`PFM_Personal_Finance_Management/frontend/android/app/build.gradle`

**Khi nào cần:**  
Khi bạn muốn Android dùng đúng **Web Client ID** (để id_token có audience là Web client; backend verify bằng `GOOGLE_WEB_CLIENT_ID`). Nhiều project Flutter dùng chung Web Client ID cho Android.

**Dữ liệu:**  
**Web application → Client ID**.

**Cách thêm (trong `android { defaultConfig { ... } }`):**

```gradle
defaultConfig {
    // ... existing config ...
    resValue "string", "default_web_client_id", "371279773491-xxx.apps.googleusercontent.com"
}
```

Thay `371279773491-xxx.apps.googleusercontent.com` bằng **Web Client ID** của bạn.

**Lưu ý:** Nếu bạn dùng **Android OAuth client riêng**, thường cấu hình trong `google-services.json` hoặc tài liệu Google Sign-In cho Android; backend khi đó cần `GOOGLE_ANDROID_CLIENT_ID` để verify token từ Android.

---

## Phần 3: Bảng tổng hợp – File và biến

| Nơi đặt                 | File (đường dẫn)                          | Biến / Key                         | Dữ liệu lấy từ credential |
|-------------------------|--------------------------------------------|------------------------------------|----------------------------|
| **Backend**             | `backend/.env`                             | `GOOGLE_WEB_CLIENT_ID`             | Web → Client ID            |
| **Backend**             | `backend/.env`                             | `GOOGLE_IOS_CLIENT_ID`             | iOS → Client ID            |
| **Backend**             | `backend/.env`                             | `GOOGLE_ANDROID_CLIENT_ID`         | Android → Client ID        |
| **Frontend**            | `frontend/lib/core/constants/app_constants.dart` (hoặc dart-define) | `GOOGLE_SERVER_CLIENT_ID`          | Web → Client ID            |
| **Frontend**            | `frontend/lib/core/constants/app_constants.dart` (hoặc dart-define) | `GOOGLE_CLIENT_SECRET`             | Web → Client secret (chỉ desktop) |
| **Frontend**            | `frontend/ios/Runner/Info.plist`           | `CFBundleURLSchemes` → `<string>`  | Reversed iOS/Web Client ID |
| **Frontend** (tuỳ chọn) | `frontend/android/app/build.gradle`        | `default_web_client_id`           | Web → Client ID            |

---

## Phần 4: Checklist từng bước

1. **Google Cloud Console**
   - [ ] Vào **APIs & Services → Credentials**.
   - [ ] Có 3 OAuth 2.0 Client ID: Web, Android, iOS.
   - [ ] Web: copy **Client ID** + **Client secret**; thêm redirect URI `http://localhost:8000` nếu dùng desktop.
   - [ ] Android: copy **Client ID**.
   - [ ] iOS: copy **Client ID**.

2. **Backend**
   - [ ] Có file `backend/.env` (copy từ `.env.example` nếu chưa có).
   - [ ] Điền `GOOGLE_WEB_CLIENT_ID` = Web Client ID.
   - [ ] (Tuỳ chọn) Điền `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` nếu dùng client riêng từng nền.
   - [ ] Restart backend sau khi sửa `.env`.

3. **Frontend**
   - [ ] `GOOGLE_SERVER_CLIENT_ID` = Web Client ID (trong `app_constants.dart` hoặc `--dart-define=GOOGLE_SERVER_CLIENT_ID=...`).
   - [ ] Desktop: `GOOGLE_CLIENT_SECRET` = Web Client secret (dart-define hoặc default trong `app_constants.dart`).
   - [ ] iOS: sửa `ios/Runner/Info.plist` → `CFBundleURLSchemes` = reversed Client ID (iOS hoặc Web).
   - [ ] Android (nếu cần): `android/app/build.gradle` → `default_web_client_id` = Web Client ID.

4. **Kiểm tra**
   - [ ] Backend: log không báo "No Google Client IDs configured".
   - [ ] Đăng nhập Google trên từng nền (Web, Android, iOS, Desktop) và kiểm tra không lỗi "Invalid Google Token".

---

## Phần 5: Cách reversed Client ID (iOS)

Công thức:  
`com.googleusercontent.apps.` + **phần trước** `.apps.googleusercontent.com` của Client ID.

Ví dụ:
- Client ID: `123456789-abcdefg.apps.googleusercontent.com`
- Reversed: `com.googleusercontent.apps.123456789-abcdefg`

Chuỗi này đi vào `Info.plist` trong `<key>CFBundleURLSchemes</key>` → `<array>` → `<string>...</string>`.
