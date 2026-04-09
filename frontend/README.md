# PFM Frontend (Flutter)

This folder contains the **Flutter** frontend for **PFM – Personal Finance Management**.

## Prerequisites

- **Flutter SDK**: compatible with `pubspec.yaml` (Dart SDK `>= 3.10.4`)
- **Git**
- **Android (optional)**: Android Studio + an emulator or a physical device
- **Web (optional)**: Google Chrome
- **Windows desktop (optional)**: Visual Studio 2019/2022 (or Build Tools) with:
  - **Desktop development with C++**
  - **C++ ATL/MFC** (needed by `flutter_secure_storage` on Windows)

After installing Flutter, verify your environment:

```powershell
flutter doctor
```

## Install dependencies

From the repo root:

```powershell
cd .\PFM_Personal_Finance_Management\frontend
flutter pub get
```

## Configure backend URL

By default, API requests target:

- **Base URL**: `http://localhost:3000`
- **API prefix**: `/api`

So the app calls `http://localhost:3000/api/...` (see `lib/core/constants/app_constants.dart`).

If your backend runs elsewhere, update `AppConstants.defaultApiBaseUrl` in:

- `lib/core/constants/app_constants.dart`

Then restart the app.

## Run the app

First, list available devices:

```powershell
flutter devices
```

### Run on Web (Chrome)

```powershell
flutter run -d chrome
```

### Run on Android

1) Start an Android emulator (Android Studio Device Manager) or connect a phone with USB debugging enabled.  
2) Run:

```powershell
flutter run
```

### Run on Windows desktop

```powershell
flutter run -d windows
```

## Build (optional)

```powershell
flutter build web
flutter build apk
flutter build windows
```

## Troubleshooting

- **Fix Android licenses**:

```powershell
flutter doctor --android-licenses
```

- **Reset dependencies/build outputs**:

```powershell
flutter clean
flutter pub get
```

- **Windows build errors**: install Visual Studio 2022 → **Desktop development with C++** (and rerun `flutter doctor`).
- **`fatal error C1083: Cannot open include file: 'atlstr.h'`**: in Visual Studio Installer → Modify → **Individual components**:
  - install **C++ ATL** (and/or **C++ MFC**) for your MSVC toolset (v142 for VS2019, v143 for VS2022)
  - then run `flutter clean` → `flutter pub get` → `flutter run -d windows`
