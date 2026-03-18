# Hướng Dẫn Tổng Quan Dự Án PFM

## 1. Giới thiệu

`PFM_Personal_Finance_Management` là hệ thống quản lý tài chính cá nhân gồm:

- `frontend`: ứng dụng Flutter cho người dùng cuối
- `backend`: API Node.js + Express + TypeScript
- `MongoDB`: lưu trữ dữ liệu người dùng, ví, giao dịch, ngân sách, mục tiêu

Mục tiêu của dự án là giúp người dùng:

- đăng ký, đăng nhập và quản lý tài khoản
- quản lý ví tiền
- ghi nhận thu chi
- quản lý danh mục giao dịch
- đặt ngân sách
- đặt mục tiêu tiết kiệm
- xem dashboard và báo cáo tài chính
- cập nhật hồ sơ và cài đặt tài khoản

## 2. Kiến trúc tổng thể

### Frontend

Frontend được viết bằng Flutter, tổ chức theo các lớp chính:

- `lib/core`: hạ tầng chung như router, DI, theme, constants, API client
- `lib/data`: model và service gọi API
- `lib/presentation`: màn hình và widget giao diện

Luồng gọi dữ liệu chính:

`Screen` -> `Service` -> `Dio ApiClient` -> `Backend API`

Các thành phần kỹ thuật đáng chú ý:

- `GetIt` để quản lý dependency injection
- `GoRouter` để điều hướng và chặn route theo trạng thái đăng nhập
- `Dio` để gọi API
- `FlutterSecureStorage` để lưu `access_token`, `refresh_token`, thông tin user

### Backend

Backend được viết bằng Node.js + Express + TypeScript, tổ chức theo kiểu:

`routes` -> `controllers` -> `services` -> `models`

Các thành phần kỹ thuật chính:

- `Express` để xây dựng REST API
- `Mongoose` để làm việc với MongoDB
- `JWT` cho xác thực
- `Swagger` cho tài liệu API
- `express-rate-limit`, `helmet`, `cors` cho bảo mật cơ bản
- scheduler để cập nhật tỷ giá tự động

## 3. Cấu trúc thư mục chính

```text
PFM_Personal_Finance_Management/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- utils/
|   |-- .env.example
|   |-- package.json
|   |-- server.ts
|
|-- frontend/
|   |-- lib/
|   |   |-- core/
|   |   |-- data/
|   |   |-- presentation/
|   |-- pubspec.yaml
|   |-- README.md
|
|-- BACKEND_FRONTEND_CONNECTION.md
|-- HUONG_DAN_TONG_QUAN_DU_AN.md
```

## 4. Các chức năng chính

### 4.1 Xác thực và tài khoản

Hệ thống hiện có các chức năng:

- đăng nhập bằng email và mật khẩu
- đăng nhập bằng Google
- đăng xuất
- refresh access token khi token hết hạn
- quên mật khẩu qua OTP email
- đặt lại mật khẩu
- cập nhật hồ sơ cá nhân
- đổi mật khẩu
- xóa tài khoản

Ghi chú:

- backend đã hỗ trợ login Google
- frontend đã được nối flow đăng nhập Google
- đăng ký hiện có ràng buộc OTP ở backend, nhưng frontend chưa hoàn thiện toàn bộ luồng OTP cho đăng ký

### 4.2 Dashboard

Dashboard là màn hình tổng quan tài chính, phục vụ:

- hiển thị tổng số dư
- hiển thị danh sách ví
- thống kê giao dịch gần đây
- tổng hợp chi tiêu
- hỗ trợ điều hướng nhanh sang thêm giao dịch, ví, ngân sách, mục tiêu

### 4.3 Quản lý ví

Người dùng có thể:

- tạo ví
- sửa ví
- xóa ví
- xem số dư từng ví

Luật nghiệp vụ đáng chú ý:

- khi tạo tài khoản mới, hệ thống tự tạo một ví mặc định
- backend giới hạn tối đa `10` ví cho mỗi người dùng

### 4.4 Quản lý giao dịch

Người dùng có thể:

- tạo giao dịch thu
- tạo giao dịch chi
- cập nhật giao dịch
- xóa giao dịch
- nhân bản giao dịch
- lọc và xem danh sách giao dịch

Thông tin giao dịch thường gồm:

- loại giao dịch
- số tiền
- ví
- danh mục
- ngày giao dịch
- ghi chú

Luật nghiệp vụ quan trọng:

- khi tạo, sửa, xóa giao dịch thì backend cập nhật lại số dư ví
- hệ thống đang xử lý tốt cho `income` và `expense`
- kiểu `transfer` đã xuất hiện trong model/UI nhưng chưa hoàn thiện logic chuyển tiền giữa hai ví

### 4.5 Quản lý danh mục

Người dùng có thể:

- xem danh mục
- tạo danh mục riêng
- sửa danh mục
- xóa danh mục

Luật nghiệp vụ:

- khi backend khởi động, hệ thống seed các danh mục mặc định dùng chung

### 4.6 Quản lý ngân sách

Người dùng có thể:

- tạo ngân sách
- chỉnh sửa ngân sách
- xóa ngân sách
- theo dõi tiến độ chi tiêu theo ngân sách

Ngân sách thường gắn với:

- khoảng thời gian
- danh mục hoặc phạm vi theo dõi
- giới hạn chi tiêu

### 4.7 Quản lý mục tiêu tiết kiệm

Người dùng có thể:

- tạo mục tiêu
- cập nhật mục tiêu
- xóa mục tiêu
- theo dõi tiến độ hoàn thành

Mục tiêu thường có:

- tên mục tiêu
- số tiền mục tiêu
- thời hạn
- số tiền hiện tại hoặc tiến độ tích lũy

### 4.8 Báo cáo

Phần báo cáo hỗ trợ:

- xem tổng hợp chi tiêu
- theo dõi biến động tài chính theo thời gian
- xem top khoản chi hoặc phân bổ theo danh mục

## 5. Các module API backend

Backend hiện đang mount các nhóm route sau:

- `/api/auth`
- `/api/otp`
- `/api/users`
- `/api/wallets`
- `/api/transactions`
- `/api/categories`
- `/api/goals`
- `/api/budgets`
- `/api/currencies`
- `/api/notifications`
- `/api/tutorial`
- `/api/exchange-rates`
- `/api/health`

Lưu ý:

- không phải module backend nào cũng đã được frontend sử dụng đầy đủ
- frontend hiện tập trung nhiều nhất vào auth, user, wallet, transaction, category, budget, goal

## 6. Luồng nghiệp vụ chính

### 6.1 Luồng khởi động ứng dụng

1. App mở vào splash screen.
2. Frontend kiểm tra `access_token` trong secure storage.
3. Nếu có token, chuyển người dùng vào `/home`.
4. Nếu không có token, chuyển về `/get-started`.

### 6.2 Luồng đăng nhập email/mật khẩu

1. Người dùng nhập email và mật khẩu.
2. Frontend gọi `POST /api/auth/login`.
3. Backend kiểm tra tài khoản và trả về:
   - `accessToken`
   - `refreshToken`
   - thông tin user
4. Frontend lưu token vào secure storage.
5. Người dùng được điều hướng sang màn hình chính.

### 6.3 Luồng đăng nhập Google

1. Người dùng bấm nút đăng nhập Google trên frontend.
2. Flutter dùng `google_sign_in` để lấy `idToken`.
3. Frontend gửi `idToken` đến `POST /api/auth/google`.
4. Backend xác minh token Google.
5. Nếu user chưa tồn tại, backend tạo user mới và tạo ví mặc định.
6. Backend trả về access token, refresh token và thông tin user.
7. Frontend lưu token và điều hướng vào `/home`.

### 6.4 Luồng refresh token

1. Frontend gửi request có `Authorization: Bearer <access_token>`.
2. Nếu backend trả về `401`, frontend tự gọi `POST /api/auth/refresh-token`.
3. Nếu refresh thành công, frontend lưu access token mới và gọi lại request cũ.
4. Nếu refresh thất bại, frontend xóa token local và người dùng phải đăng nhập lại.

### 6.5 Luồng quên mật khẩu

1. Người dùng nhập email ở màn hình quên mật khẩu.
2. Frontend gọi API gửi OTP.
3. Backend gửi mã OTP qua email.
4. Người dùng nhập email, OTP, mật khẩu mới ở màn hình reset password.
5. Backend xác thực OTP và cập nhật mật khẩu mới.

### 6.6 Luồng tạo tài khoản

1. Người dùng nhập thông tin đăng ký.
2. Backend yêu cầu email đã được xác thực OTP.
3. Nếu hợp lệ, backend tạo user mới.
4. Hệ thống tự tạo ví mặc định cho user đó.

Ghi chú:

- flow đăng ký hiện cần đối chiếu kỹ giữa frontend và backend vì backend yêu cầu OTP xác thực email

### 6.7 Luồng quản lý giao dịch và số dư ví

1. Người dùng chọn ví và nhập giao dịch.
2. Backend lưu giao dịch.
3. Backend cập nhật lại số dư ví tương ứng.
4. Dashboard và báo cáo lấy dữ liệu mới để hiển thị cho người dùng.

## 7. Cách chạy dự án

## 7.1 Yêu cầu môi trường

### Backend

- Node.js
- npm
- MongoDB
- tùy chọn: Redis

### Frontend

- Flutter SDK
- Dart SDK theo `pubspec.yaml`
- Android Studio hoặc thiết bị Android
- Google Chrome nếu chạy web
- Visual Studio C++ toolchain nếu chạy Windows desktop

## 7.2 Chạy backend

Mở terminal tại:

```powershell
cd c:\Users\ADMIN\Documents\GitHub\PFM_Personal_Finance_Management\backend
```

Cài thư viện:

```powershell
npm install
```

Tạo file `.env` từ `.env.example`, sau đó cấu hình tối thiểu:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET_KEY=your_access_secret
REFRESH_TOKEN_SECRET_KEY=your_refresh_secret
```

Nếu dùng OTP email, cấu hình thêm:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
```

Nếu dùng Google login, cấu hình thêm:

```env
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
# GOOGLE_IOS_CLIENT_ID=your_ios_client_id
# GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

Chạy backend ở chế độ development:

```powershell
npm run dev
```

Các script hữu ích:

```powershell
npm run seed
npm run seed:sample
npm run build
npm run start
```

Sau khi chạy thành công:

- backend mặc định chạy tại `http://localhost:5000`
- health check: `http://localhost:5000/api/health`
- swagger docs: `http://localhost:5000/api-docs`

## 7.3 Chạy frontend

Mở terminal tại:

```powershell
cd c:\Users\ADMIN\Documents\GitHub\PFM_Personal_Finance_Management\frontend
```

Cài thư viện:

```powershell
flutter pub get
```

Kiểm tra môi trường:

```powershell
flutter doctor
flutter devices
```

### Chạy với backend local

App hiện dùng backend mặc định là `http://localhost:5000`.

Chạy app:

```powershell
flutter run
```

### Chạy Android emulator

Nếu chạy Android emulator, nên override API base URL:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

### Chạy web

```powershell
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:5000
```

### Chạy Windows

```powershell
flutter run -d windows --dart-define=API_BASE_URL=http://localhost:5000
```

## 7.4 Cấu hình Google Login cho frontend

Frontend đã được nối flow Google Sign-In, nhưng cần cấu hình đúng client ID:

```powershell
flutter run `
  --dart-define=API_BASE_URL=http://10.0.2.2:5000 `
  --dart-define=GOOGLE_SERVER_CLIENT_ID=your_google_web_client_id `
  --dart-define=GOOGLE_CLIENT_ID=your_ios_client_id
```

Ghi chú:

- `GOOGLE_SERVER_CLIENT_ID` dùng để backend xác minh token
- `GOOGLE_CLIENT_ID` đặc biệt quan trọng với iOS
- iOS còn cần cấu hình callback scheme trong `ios/Runner/Info.plist`

## 8. Lưu ý quan trọng

### 8.1 Port backend

Một số tài liệu cũ trong repo có thể còn ghi `localhost:3000`, nhưng mã nguồn hiện tại đang dùng `5000` là chính.

### 8.2 OTP đăng ký

Backend đang yêu cầu OTP/email verification cho đăng ký, nên nếu frontend đăng ký gặp lỗi thì cần kiểm tra lại flow OTP đăng ký.

### 8.3 Google Sign-In

Google login đã được nối ở frontend, nhưng muốn chạy thật cần:

- cấu hình Google OAuth client IDs đúng
- cấu hình backend `.env`
- cấu hình native iOS nếu chạy trên iPhone/iPad

### 8.4 Windows desktop

Do sử dụng `flutter_secure_storage`, nếu chạy trên Windows cần Visual Studio với C++ workload phù hợp.

### 8.5 MongoDB transaction mode

Repo có hỗ trợ chế độ transaction cho MongoDB, nhưng chỉ nên bật khi MongoDB chạy replica set. Nếu không, nên giữ tắt theo hướng dẫn trong `.env.example`.

## 9. Tóm tắt nhanh cho người mới

Nếu muốn chạy nhanh dự án local:

1. Chạy MongoDB.
2. Vào `backend`, tạo `.env`, rồi chạy `npm install` và `npm run dev`.
3. Vào `frontend`, chạy `flutter pub get`.
4. Chạy app bằng `flutter run` hoặc `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000` nếu dùng Android emulator.
5. Nếu muốn dùng Google login, cấu hình thêm Google client IDs cho cả backend và frontend.

## 10. File nên đọc thêm

- `backend/.env.example`
- `backend/package.json`
- `backend/server.ts`
- `backend/src/routes/index.ts`
- `frontend/lib/core/constants/app_constants.dart`
- `frontend/lib/core/api/api_client.dart`
- `frontend/lib/data/services/auth_service.dart`
- `BACKEND_FRONTEND_CONNECTION.md`
