import 'package:get_it/get_it.dart';

import '../api/api_client.dart';
import '../preferences/app_preferences.dart';
import '../../data/services/api_health_service.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/budget_service.dart';
import '../../data/services/category_service.dart';
import '../../data/services/goal_service.dart';
import '../../data/services/transaction_service.dart';
import '../../data/services/user_service.dart';
import '../../data/services/wallet_service.dart';

final getIt = GetIt.instance;

Future<void> setupInjection({String? apiBaseUrl}) async {
  getIt.registerLazySingleton<ApiClient>(() => ApiClient(baseUrl: apiBaseUrl));
  getIt.registerLazySingleton<ApiHealthService>(() => ApiHealthService(getIt<ApiClient>()));
  getIt.registerLazySingleton<AuthService>(() => AuthService(getIt<ApiClient>()));
  getIt.registerLazySingleton<UserService>(() => UserService(getIt<ApiClient>()));
  getIt.registerLazySingleton<WalletService>(() => WalletService(getIt<ApiClient>()));
  getIt.registerLazySingleton<TransactionService>(() => TransactionService(getIt<ApiClient>()));
  getIt.registerLazySingleton<CategoryService>(() => CategoryService(getIt<ApiClient>()));
  getIt.registerLazySingleton<BudgetService>(() => BudgetService(getIt<ApiClient>()));
  getIt.registerLazySingleton<GoalService>(() => GoalService(getIt<ApiClient>()));
  getIt.registerLazySingleton<AppPreferences>(() => AppPreferences(getIt<AuthService>()));
}
