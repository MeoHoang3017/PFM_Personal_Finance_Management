import 'package:get_it/get_it.dart';

import '../app/home_data_notifier.dart';
import '../api/api_client.dart';
import '../preferences/app_preferences.dart';
import '../../data/services/api_health_service.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/budget_service.dart';
import '../../data/services/category_service.dart';
import '../../data/services/transaction_service.dart';
import '../../data/services/user_service.dart';
import '../../data/services/wallet_service.dart';

final getIt = GetIt.instance;

void ensureHomeDataNotifierRegistered() {
  if (!getIt.isRegistered<HomeDataNotifier>()) {
    getIt.registerLazySingleton<HomeDataNotifier>(() => HomeDataNotifier());
  }
}

Future<void> setupInjection({String? apiBaseUrl}) async {
  ensureHomeDataNotifierRegistered();

  if (!getIt.isRegistered<ApiClient>()) {
    getIt.registerLazySingleton<ApiClient>(() => ApiClient(baseUrl: apiBaseUrl));
  }
  if (!getIt.isRegistered<ApiHealthService>()) {
    getIt.registerLazySingleton<ApiHealthService>(() => ApiHealthService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<AuthService>()) {
    getIt.registerLazySingleton<AuthService>(() => AuthService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<UserService>()) {
    getIt.registerLazySingleton<UserService>(() => UserService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<WalletService>()) {
    getIt.registerLazySingleton<WalletService>(() => WalletService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<TransactionService>()) {
    getIt.registerLazySingleton<TransactionService>(() => TransactionService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<CategoryService>()) {
    getIt.registerLazySingleton<CategoryService>(() => CategoryService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<BudgetService>()) {
    getIt.registerLazySingleton<BudgetService>(() => BudgetService(getIt<ApiClient>()));
  }
  if (!getIt.isRegistered<AppPreferences>()) {
    getIt.registerLazySingleton<AppPreferences>(() => AppPreferences(getIt<AuthService>()));
  }
}
