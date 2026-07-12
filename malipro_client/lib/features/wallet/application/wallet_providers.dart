import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../data/wallet_repository.dart';

final walletRepositoryProvider =
    Provider<WalletRepository>((ref) => WalletRepository(ref.read(apiClientProvider)));

final walletBalanceProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ref.read(walletRepositoryProvider).balance());

final walletTxProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) => ref.read(walletRepositoryProvider).transactions());
