import 'api_client.dart';

/// Couche « annonces vocales » de l'application livreur.
///
/// Le serveur compose la phrase et la pousse ; l'application ne fait que la
/// prononcer et accuser réception. Elle n'invente aucun texte (même principe
/// que pour les décisions du Brain : le backend décide, l'app exécute).

/// Réglages vocaux du prestataire (GET/PUT /voice-dispatch/settings).
class VoiceSettings {
  final bool enabled;

  /// « fr » ou « bm » (bambara).
  final String language;

  /// « FEMALE » ou « MALE ».
  final String voice;
  final double speed;
  final double volume;
  final int repeatCount;

  const VoiceSettings({
    this.enabled = true,
    this.language = 'fr',
    this.voice = 'FEMALE',
    this.speed = 1,
    this.volume = 1,
    this.repeatCount = 1,
  });

  VoiceSettings copyWith({
    bool? enabled,
    String? language,
    String? voice,
    double? speed,
    double? volume,
    int? repeatCount,
  }) =>
      VoiceSettings(
        enabled: enabled ?? this.enabled,
        language: language ?? this.language,
        voice: voice ?? this.voice,
        speed: speed ?? this.speed,
        volume: volume ?? this.volume,
        repeatCount: repeatCount ?? this.repeatCount,
      );

  factory VoiceSettings.fromJson(Map j) => VoiceSettings(
        enabled: j['enabled'] != false,
        language: (j['language'] ?? 'fr').toString(),
        voice: (j['voice'] ?? 'FEMALE').toString(),
        speed: (j['speed'] as num?)?.toDouble() ?? 1,
        volume: (j['volume'] as num?)?.toDouble() ?? 1,
        repeatCount: (j['repeatCount'] as num?)?.toInt() ?? 1,
      );

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'language': language,
        'voice': voice,
        'speed': speed,
        'volume': volume,
        'repeatCount': repeatCount,
      };

  String get languageLabel => language == 'bm' ? 'Bambara' : 'Français';
  String get voiceLabel => voice == 'MALE' ? 'Masculine' : 'Féminine';
}

/// Annonce reçue du serveur : le texte est déjà prêt à être prononcé.
class VoiceAnnouncement {
  final String? id;
  final String text;
  final String language;
  final String voice;
  final double speed;
  final double volume;
  final int repeatCount;
  final String kind;
  final String? missionId;
  final int responseSeconds;
  final bool retry;

  const VoiceAnnouncement({
    required this.text,
    this.id,
    this.language = 'fr',
    this.voice = 'FEMALE',
    this.speed = 1,
    this.volume = 1,
    this.repeatCount = 1,
    this.kind = 'MISSION_ASSIGNED',
    this.missionId,
    this.responseSeconds = 20,
    this.retry = false,
  });

  factory VoiceAnnouncement.fromJson(Map j) => VoiceAnnouncement(
        id: j['id']?.toString() ?? j['announcementId']?.toString(),
        text: (j['text'] ?? '').toString(),
        language: (j['language'] ?? 'fr').toString(),
        voice: (j['voice'] ?? 'FEMALE').toString(),
        speed: (j['speed'] as num?)?.toDouble() ?? 1,
        volume: (j['volume'] as num?)?.toDouble() ?? 1,
        repeatCount: (j['repeatCount'] as num?)?.toInt() ?? 1,
        kind: (j['kind'] ?? 'MISSION_ASSIGNED').toString(),
        missionId: j['missionId']?.toString(),
        responseSeconds: (j['responseSeconds'] as num?)?.toInt() ?? 20,
        retry: j['retry'] == true,
      );
}

/// Ligne du journal des annonces (GET /voice-dispatch/history).
class VoiceLogEntry {
  final String id;
  final String text;
  final String status;
  final String channel;
  final String kind;
  final DateTime? createdAt;
  const VoiceLogEntry({
    required this.id,
    required this.text,
    required this.status,
    required this.channel,
    required this.kind,
    this.createdAt,
  });

  factory VoiceLogEntry.fromJson(Map j) => VoiceLogEntry(
        id: (j['id'] ?? '').toString(),
        text: (j['text'] ?? '').toString(),
        status: (j['status'] ?? '').toString(),
        channel: (j['channel'] ?? '').toString(),
        kind: (j['kind'] ?? '').toString(),
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString())?.toLocal(),
      );

  String get statusLabel {
    switch (status) {
      case 'PLAYED':
        return 'Lue';
      case 'FAILED':
        return 'Échec';
      case 'SKIPPED':
        return 'Désactivée';
      default:
        return 'Envoyée';
    }
  }
}

class VoiceApi {
  /// GET /voice-dispatch/settings
  Future<VoiceSettings?> fetchSettings() async {
    final data = await api.get('/voice-dispatch/settings');
    return data is Map ? VoiceSettings.fromJson(data) : null;
  }

  /// PUT /voice-dispatch/settings
  Future<VoiceSettings?> updateSettings(VoiceSettings s) async {
    final data = await api.put('/voice-dispatch/settings', body: s.toJson());
    return data is Map ? VoiceSettings.fromJson(data) : null;
  }

  /// POST /voice-dispatch/test — le serveur renvoie l'annonce et la pousse aussi
  /// en temps réel ; on lit celle du retour pour un test immédiat.
  Future<VoiceAnnouncement?> test() async {
    final data = await api.post('/voice-dispatch/test');
    return data is Map ? VoiceAnnouncement.fromJson(data) : null;
  }

  /// POST /voice-dispatch/announcements/:id/ack — lue, ou échouée avec son motif.
  Future<void> ack(String id, {required bool played, String? error}) async {
    await api.post('/voice-dispatch/announcements/$id/ack',
        body: {'status': played ? 'PLAYED' : 'FAILED', if (error != null) 'error': error});
  }

  /// GET /voice-dispatch/history
  Future<List<VoiceLogEntry>> history({int limit = 20}) async {
    final data = await api.get('/voice-dispatch/history', query: {'limit': limit});
    final rows = (data as List?)?.whereType<Map>() ?? const <Map>[];
    return rows.map(VoiceLogEntry.fromJson).toList();
  }
}

final voiceApi = VoiceApi();
