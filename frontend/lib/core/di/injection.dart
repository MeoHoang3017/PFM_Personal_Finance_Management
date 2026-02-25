import 'package:get_it/get_it.dart';

import '../api/api_client.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/category_service.dart';
import '../../data/services/transaction_service.dart';
import '../../data/services/user_service.dart';
import '../../data/services/wallet_service.dart';

final getIt = GetIt.instance;

Future<void> setupInjection({String? apiBaseUrl}) async {
  getIt.registerLazySingleton<ApiClient>(() => ApiClient(baseUrl: apiBaseUrl));
  getIt.registerLazySingleton<AuthService>(() => AuthService(getIt<ApiClient>()));
  getIt.registerLazySingleton<UserService>(() => UserService(getIt<ApiClient>()));
  getIt.registerLazySingleton<WalletService>(() => WalletService(getIt<ApiClient>()));
  getIt.registerLazySingleton<TransactionService>(() => TransactionService(getIt<ApiClient>()));
  getIt.registerLazySingleton<CategoryService>(() => CategoryService(getIt<ApiClient>()));
}
