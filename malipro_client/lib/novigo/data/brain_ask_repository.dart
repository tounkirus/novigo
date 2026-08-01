import 'package:flutter/foundation.dart';

import '../services_catalog.dart';
import 'api_client.dart';
import 'catalog_model.dart';
import 'env.dart';
import 'session.dart';

/// Une piste proposée en réponse à une demande en langage naturel.
class BrainSuggestion {
  /// Libellé affiché (« Ouvrir Pharmacie », « Pharmacie du Point G »).
  final String label;

  /// Ligne d'explication — pourquoi cette piste est proposée.
  final String reason;

  /// Service NOVIGO à ouvrir, s'il y en a un.
  final String? serviceId;

  /// Commerce à ouvrir, s'il y en a un.
  final String? storeId;

  const BrainSuggestion({
    required this.label,
    required this.reason,
    this.serviceId,
    this.storeId,
  });

  factory BrainSuggestion.fromJson(Map j) => BrainSuggestion(
        label: (j['label'] ?? '').toString(),
        reason: (j['reason'] ?? '').toString(),
        serviceId: j['serviceId']?.toString(),
        storeId: j['storeId']?.toString(),
      );
}

/// Réponse complète à une demande.
class BrainAnswer {
  /// Phrase d'accroche affichée au-dessus des pistes.
  final String headline;
  final List<BrainSuggestion> suggestions;

  /// Faux quand la réponse a été composée localement (démo hors ligne) — la
  /// présentation le signale, l'application ne fait jamais passer une
  /// correspondance de mots-clés pour une décision du Brain.
  final bool live;

  const BrainAnswer({
    required this.headline,
    required this.suggestions,
    this.live = true,
  });

  bool get isEmpty => suggestions.isEmpty;
}

/// Contrat de l'assistant NOVIGO Brain côté client.
///
/// L'interface est déjà celle qu'attend le Brain réel : une demande en texte
/// libre, une réponse composée d'une accroche et de pistes actionnables. Le jour
/// où `POST /brain/ask` répond, il n'y a rien à changer dans l'écran.
abstract class BrainAskRepository {
  Future<BrainAnswer> ask(String prompt);

  /// Exemples proposés tant que l'utilisateur n'a rien écrit.
  List<String> get starters;
}

const _starters = <String>[
  'Trouve-moi un restaurant à moins de 5 000 FCFA',
  'Envoie ce colis à Hamdallaye',
  'Trouve-moi un plombier disponible aujourd\'hui',
  'Je veux des médicaments livrés ce soir',
  'Commande-moi un taxi pour l\'aéroport',
];

/// Aiguillage local par mots-clés.
///
/// Ce n'est pas une imitation du Brain : c'est un routeur d'intention, honnête
/// sur ce qu'il fait (`live: false`). Il rend l'écran réellement utilisable hors
/// ligne — la demande atterrit sur le bon service — et sert de repli quand le
/// backend ne répond pas.
class LocalBrainAskRepository implements BrainAskRepository {
  const LocalBrainAskRepository();

  @override
  List<String> get starters => _starters;

  /// Mots déclencheurs par service, dans l'ordre de priorité.
  static const Map<String, List<String>> _keywords = {
    'taxi': ['taxi', 'trajet', 'voiture', 'chauffeur', 'aéroport', 'aeroport', 'déplacer', 'deplacer'],
    'moto': ['moto', 'deux-roues', 'rapide'],
    'parcel': ['colis', 'coursier', 'envoie', 'envoyer', 'paquet', 'livrer un'],
    'pharmacy': ['pharmacie', 'médicament', 'medicament', 'ordonnance', 'paracétamol', 'paracetamol'],
    'food': ['restaurant', 'repas', 'manger', 'plat', 'tiéboudienne', 'tieboudienne', 'pizza', 'burger', 'poulet', 'faim'],
    'grocery': ['courses', 'supermarché', 'supermarche', 'épicerie', 'epicerie'],
    'market': ['marché', 'marche ', 'légume', 'legume', 'fruit', 'poisson'],
    'bakery': ['boulangerie', 'pain', 'croissant', 'pâtisserie', 'patisserie'],
    'hs_all': ['plombier', 'électricien', 'electricien', 'maçon', 'macon', 'menuisier', 'peintre',
      'ménage', 'menage', 'nettoyage', 'coiffeur', 'réparer', 'reparer', 'artisan', 'dépannage', 'depannage'],
    'wallet': ['solde', 'wallet', 'portefeuille', 'payer', 'paiement', 'argent'],
    'topup': ['recharge', 'crédit', 'credit', 'forfait'],
    'bills': ['facture', 'électricité', 'electricite', 'edm', 'eau'],
    'shop': ['boutique', 'acheter', 'vêtement', 'vetement', 'téléphone', 'telephone', 'mode'],
    'hotel': ['hôtel', 'hotel', 'chambre', 'nuit', 'séjour', 'sejour'],
    'realestate': ['immobilier', 'logement', 'appartement', 'villa', 'louer', 'terrain'],
  };

  @override
  Future<BrainAnswer> ask(String prompt) async {
    final q = prompt.toLowerCase();
    final byId = {for (final s in allNovigoServices) s.id: s};

    final matched = <BrainSuggestion>[];
    for (final entry in _keywords.entries) {
      if (!entry.value.any(q.contains)) continue;
      final service = byId[entry.key];
      if (service == null) continue;
      matched.add(BrainSuggestion(
        label: service.available ? 'Ouvrir ${service.label}' : '${service.label} — bientôt',
        reason: service.subtitle ?? 'Service NOVIGO',
        serviceId: service.id,
      ));
      if (matched.length >= 3) break;
    }

    // Le catalogue peut aussi répondre directement : si un commerce porte les
    // mots de la demande, c'est la piste la plus courte.
    try {
      final stores = await catalog.search(prompt);
      for (final s in stores.take(3)) {
        matched.add(BrainSuggestion(
          label: s.name,
          reason: '${s.cuisine} · ${s.etaMin} min · ${s.district}',
          storeId: s.id,
        ));
      }
    } catch (e) {
      debugPrint('[BrainAsk] recherche catalogue: $e');
    }

    return BrainAnswer(
      headline: matched.isEmpty
          ? 'Je n\'ai pas encore compris cette demande.'
          : 'Voici ce que je peux faire pour vous :',
      suggestions: matched,
      live: false,
    );
  }
}

/// Assistant servi par le backend (`POST /brain/ask`).
///
/// Le point d'entrée n'est pas encore ouvert côté serveur : l'appel est écrit,
/// et tout échec retombe sur l'aiguillage local.
class ApiBrainAskRepository implements BrainAskRepository {
  final BrainAskRepository fallback;
  const ApiBrainAskRepository({this.fallback = const LocalBrainAskRepository()});

  @override
  List<String> get starters => fallback.starters;

  @override
  Future<BrainAnswer> ask(String prompt) async {
    try {
      await session.ensureAuth();
      final data = await api.post('/brain/ask', body: {'prompt': prompt});
      if (data is Map) {
        final list = (data['suggestions'] as List?) ?? const [];
        final suggestions = list.whereType<Map>().map(BrainSuggestion.fromJson).toList();
        if (suggestions.isNotEmpty) {
          return BrainAnswer(
            headline: (data['headline'] ?? 'Voici ce que j\'ai trouvé :').toString(),
            suggestions: suggestions,
          );
        }
      }
    } catch (e) {
      debugPrint('[BrainAsk] live indisponible: $e');
    }
    return fallback.ask(prompt);
  }
}

/// Dépôt actif selon l'environnement.
BrainAskRepository get brainAsk =>
    NovigoEnv.live ? const ApiBrainAskRepository() : const LocalBrainAskRepository();
