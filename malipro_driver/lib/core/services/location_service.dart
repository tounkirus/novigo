import 'package:geolocator/geolocator.dart';

/// Position GPS du livreur. Renvoie une position par défaut (Bamako) si la
/// permission est refusée ou la localisation indisponible, pour ne jamais
/// bloquer le flux de démonstration.
class LatLng {
  final double lat;
  final double lng;
  const LatLng(this.lat, this.lng);
}

class LocationService {
  static const _bamako = LatLng(12.6392, -8.0029);

  Future<LatLng> current() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return _bamako;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return _bamako;
      }
      final p = await Geolocator.getCurrentPosition();
      return LatLng(p.latitude, p.longitude);
    } catch (_) {
      return _bamako;
    }
  }
}
