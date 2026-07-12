import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api/api_client.dart';
import 'storage/token_storage.dart';
import 'services/biometric_service.dart';
import 'services/location_service.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());
final apiClientProvider =
    Provider<ApiClient>((ref) => ApiClient(ref.read(tokenStorageProvider)));
final biometricServiceProvider = Provider<BiometricService>((ref) => BiometricService());
final locationServiceProvider = Provider<LocationService>((ref) => LocationService());
