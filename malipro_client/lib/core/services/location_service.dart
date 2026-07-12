import 'package:geolocator/geolocator.dart';

/// Géolocalisation pour l'adresse de livraison et le suivi.
class LocationService {
  Future<Position?> current() async {
    if (!await Geolocator.isLocationServiceEnabled()) return null;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
      return null;
    }
    return Geolocator.getCurrentPosition();
  }
}
