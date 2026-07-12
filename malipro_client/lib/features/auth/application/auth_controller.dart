import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';

/// Écoutable par GoRouter (redirection).
class AuthStatus extends ChangeNotifier {
  bool ready = false;
  bool loggedIn = false;
  void set({required bool ready, required bool loggedIn}) {
    this.ready = ready;
    this.loggedIn = loggedIn;
    notifyListeners();
  }
}

final authStatusProvider = Provider<AuthStatus>((ref) => AuthStatus());
final authRepositoryProvider =
    Provider<AuthRepository>((ref) => AuthRepository(ref.read(apiClientProvider)));

class AuthState {
  final bool loading;
  final Map<String, dynamic>? user;
  const AuthState({this.loading = false, this.user});
  AuthState copyWith({bool? loading, Map<String, dynamic>? user}) =>
      AuthState(loading: loading ?? this.loading, user: user ?? this.user);
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _bootstrap();
  }
  final Ref _ref;

  AuthRepository get _repo => _ref.read(authRepositoryProvider);
  TokenStorage get _tokens => _ref.read(tokenStorageProvider);
  AuthStatus get _status => _ref.read(authStatusProvider);

  Future<void> _bootstrap() async {
    final t = await _tokens.read();
    if (t == null) {
      _status.set(ready: true, loggedIn: false);
      return;
    }
    try {
      final user = await _repo.me();
      state = state.copyWith(user: user);
      _status.set(ready: true, loggedIn: true);
    } catch (_) {
      await _tokens.clear();
      _status.set(ready: true, loggedIn: false);
    }
  }

  Future<void> requestOtp(String phone) => _repo.requestOtp(phone);

  Future<void> verifyOtp(String phone, String code) async {
    state = state.copyWith(loading: true);
    try {
      final res = AuthResult.from(await _repo.verifyOtp(phone, code));
      await _persist(res);
    } finally {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> loginWithPassword(String phone, String password) async {
    state = state.copyWith(loading: true);
    try {
      final res = AuthResult.from(await _repo.loginWithPassword(phone, password));
      await _persist(res);
    } finally {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> _persist(AuthResult res) async {
    await _tokens.write(Tokens(res.accessToken, res.refreshToken));
    final user = res.user ?? await _repo.me();
    state = state.copyWith(user: user);
    _status.set(ready: true, loggedIn: true);
  }

  Future<void> signOut() async {
    await _tokens.clear();
    state = const AuthState();
    _status.set(ready: true, loggedIn: false);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) => AuthController(ref));
