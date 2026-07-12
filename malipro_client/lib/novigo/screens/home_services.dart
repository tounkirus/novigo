import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets.dart';

// ============================================================================
// SERVICES À DOMICILE — parcours natif complet (hub → métier → prestataire →
// fiche → réservation → interventions). Données MOCK réalistes Bamako, FCFA.
// Autonome : n'importe que material + theme + widgets. Aucune API, aucun package.
// ============================================================================

// ----------------------------------------------------------------------------
// MODÈLE
// ----------------------------------------------------------------------------

/// Un service précis proposé par un prestataire, avec son prix « dès ».
class HsService {
  final String name;
  final int price; // FCFA
  const HsService(this.name, this.price);
}

/// Un métier (catégorie) : plombier, électricien, coiffeur…
class HsCategory {
  final String id;
  final String label;
  final IconData icon;
  final Color accent;
  final int count; // nombre de prestataires disponibles
  const HsCategory(this.id, this.label, this.icon, this.accent, this.count);
}

/// Un prestataire (artisan / pro à domicile).
class HsProvider {
  final String id;
  final String name;
  final String trade; // métier lisible
  final IconData icon;
  final Color accent;
  final double rating;
  final int reviews;
  final int jobs;
  final int priceFrom; // FCFA, dès
  final String district; // quartier
  final double distanceKm;
  final bool verified; // KYC
  final int years;
  final String bio;
  final List<HsService> services;
  final List<String> photos; // portfolio (assets)
  const HsProvider({
    required this.id,
    required this.name,
    required this.trade,
    required this.icon,
    required this.accent,
    required this.rating,
    required this.reviews,
    required this.jobs,
    required this.priceFrom,
    required this.district,
    required this.distanceKm,
    required this.verified,
    required this.years,
    required this.bio,
    required this.services,
    required this.photos,
  });
}

// ----------------------------------------------------------------------------
// DONNÉES MOCK
// ----------------------------------------------------------------------------

const _brown = Color(0xFF8D6E63);
const _pink = Color(0xFFEC407A);
const _teal = Color(0xFF26A69A);
const _sky = Color(0xFF29B6F6);
const _blue = Color(0xFF42A5F5);

class _Trade {
  final String id, label;
  final IconData icon;
  final Color accent;
  final List<HsService> services;
  final bool female;
  final bool doctor;
  final int count;
  const _Trade(this.id, this.label, this.icon, this.accent, this.services,
      {this.female = false, this.doctor = false, this.count = 3});
}

const _trades = <_Trade>[
  _Trade('plombier', 'Plombier', Icons.plumbing, NC.info, [
    HsService('Réparation de fuite', 8000),
    HsService('Débouchage canalisation', 12000),
    HsService('Installation robinet / WC', 15000),
    HsService('Pose chauffe-eau', 25000),
  ], count: 4),
  _Trade('electricien', 'Électricien', Icons.electrical_services, NC.gold, [
    HsService('Dépannage panne', 10000),
    HsService('Installation prise / interrupteur', 6000),
    HsService('Tableau électrique', 35000),
    HsService('Éclairage LED', 12000),
  ], count: 4),
  _Trade('macon', 'Maçon', Icons.foundation, NC.warning, [
    HsService('Réparation fissure', 15000),
    HsService('Crépissage de mur', 40000),
    HsService('Coulage dalle béton', 60000),
  ]),
  _Trade('menuisier', 'Menuisier', Icons.carpenter, _brown, [
    HsService('Réparation fenêtre / porte', 12000),
    HsService('Pose de porte', 30000),
    HsService('Meuble sur mesure', 80000),
  ]),
  _Trade('peintre', 'Peintre', Icons.format_paint, NC.violet, [
    HsService('Peinture chambre', 35000),
    HsService('Enduit décoratif', 45000),
    HsService('Peinture appartement', 150000),
  ]),
  _Trade('clim', 'Climatisation', Icons.ac_unit, _sky, [
    HsService('Entretien complet', 15000),
    HsService('Recharge de gaz', 20000),
    HsService('Installation split', 40000),
  ]),
  _Trade('nettoyage', 'Nettoyage', Icons.cleaning_services, NC.success, [
    HsService('Nettoyage vitres', 10000),
    HsService('Ménage complet', 15000),
    HsService('Nettoyage bureaux', 25000),
    HsService('Grand nettoyage', 30000),
  ], count: 4),
  _Trade('mecano', 'Mécanicien', Icons.car_repair, _teal, [
    HsService('Diagnostic', 5000),
    HsService('Vidange', 15000),
    HsService('Dépannage à domicile', 20000),
    HsService('Plaquettes de frein', 25000),
  ]),
  _Trade('info', 'Informaticien', Icons.desktop_windows, NC.info, [
    HsService('Dépannage PC', 10000),
    HsService('Installation Windows', 15000),
    HsService('Configuration Wifi / réseau', 20000),
    HsService('Récupération de données', 30000),
  ]),
  _Trade('coiffeur', 'Coiffeur', Icons.content_cut, NC.brandLight, [
    HsService('Coupe homme', 3000),
    HsService('Coupe + barbe', 5000),
    HsService('Coloration', 15000),
    HsService('Coiffure mariage', 40000),
  ]),
  _Trade('barbier', 'Barbier', Icons.cut, NC.gold, [
    HsService('Coupe classique', 2500),
    HsService('Dégradé', 4000),
    HsService('Rasage traditionnel', 3000),
    HsService('Barbe soignée', 2500),
  ]),
  _Trade('esthe', 'Esthéticienne', Icons.spa, _pink, [
    HsService('Manucure', 8000),
    HsService('Pédicure', 10000),
    HsService('Soin du visage', 15000),
    HsService('Maquillage', 20000),
  ], female: true),
  _Trade('medecin', 'Médecin', Icons.medical_services, _blue, [
    HsService('Consultation à domicile', 20000),
    HsService('Certificat médical', 10000),
    HsService('Suivi tension', 15000),
  ], doctor: true, count: 2),
  _Trade('infirmier', 'Infirmier', Icons.vaccines, NC.success, [
    HsService('Injection', 5000),
    HsService('Pansement', 6000),
    HsService('Prise de sang', 8000),
    HsService('Perfusion', 15000),
  ]),
];

const _male = [
  'Amadou', 'Moussa', 'Ibrahim', 'Oumar', 'Boubacar', 'Sékou', 'Modibo', 'Adama',
  'Bakary', 'Fousseyni', 'Drissa', 'Mahamadou', 'Aliou', 'Cheick', 'Yaya',
  'Souleymane', 'Mamadou', 'Karim', 'Seydou', 'Abdoulaye',
];
const _fem = [
  'Aminata', 'Fatoumata', 'Kadiatou', 'Mariam', 'Awa', 'Rokia', 'Djénéba',
  'Hawa', 'Assitan', 'Oumou', 'Salimata', 'Nana',
];
const _sur = [
  'Traoré', 'Keïta', 'Diarra', 'Coulibaly', 'Diallo', 'Cissé', 'Konaté', 'Touré',
  'Sidibé', 'Maïga', 'Doumbia', 'Sangaré', 'Camara', 'Dembélé', 'Fofana', 'Kanté',
];
const _districts = [
  'Hamdallaye ACI', 'Badalabougou', 'Faladié', 'Kalaban Coura', 'Magnambougou',
  'Djélibougou', 'Sébénikoro', 'Sotuba', 'Niamakoro', 'Lafiabougou', 'Missira',
  'Quinzambougou', 'Banankabougou', 'Yirimadio',
];

int _minPrice(List<HsService> s) {
  var m = s.first.price;
  for (final e in s) {
    if (e.price < m) m = e.price;
  }
  return m;
}

Map<String, List<HsProvider>> _buildProviders() {
  final map = <String, List<HsProvider>>{};
  for (var ti = 0; ti < _trades.length; ti++) {
    final t = _trades[ti];
    final list = <HsProvider>[];
    for (var i = 0; i < t.count; i++) {
      final pool = t.female ? _fem : _male;
      final first = pool[(ti * 3 + i * 5) % pool.length];
      final sur = _sur[(ti * 5 + i * 2) % _sur.length];
      var name = '$first $sur';
      if (t.doctor) name = 'Dr $name';
      final rating = double.parse((4.5 + ((ti * 2 + i) % 5) * 0.1).toStringAsFixed(1));
      final reviews = 28 + ((ti * 13 + i * 37) % 240);
      final jobs = 45 + ((ti * 23 + i * 51) % 380);
      final years = 2 + ((ti + i * 2) % 13);
      final dist = 1.0 + ((ti + i * 3) % 9) + [0.2, 0.5, 0.8, 0.4][i % 4];
      final verified = (ti + i) % 4 != 0;
      list.add(HsProvider(
        id: '${t.id}_$i',
        name: name,
        trade: t.label,
        icon: t.icon,
        accent: t.accent,
        rating: rating,
        reviews: reviews,
        jobs: jobs,
        priceFrom: _minPrice(t.services),
        district: _districts[(ti * 2 + i * 4) % _districts.length],
        distanceKm: double.parse(dist.toStringAsFixed(1)),
        verified: verified,
        years: years,
        bio: '${t.label} indépendant à Bamako. $years ans d\'expérience, '
            'intervention rapide 7j/7, devis gratuit et travail garanti.',
        services: t.services,
        photos: [
          'assets/img/store_${(ti + i) % 6 + 1}.jpg',
          'assets/img/store_${(ti + i * 2 + 2) % 6 + 1}.jpg',
          'assets/img/store_${(ti + i * 3 + 4) % 6 + 1}.jpg',
        ],
      ));
    }
    map[t.id] = list;
  }
  return map;
}

final Map<String, List<HsProvider>> _providersByCat = _buildProviders();

/// Liste des prestataires d'un métier donné.
List<HsProvider> hsProvidersFor(String id) => _providersByCat[id] ?? const [];

/// Les 14 métiers, avec compte réel de prestataires.
final List<HsCategory> hsCategories = [
  for (final t in _trades)
    HsCategory(t.id, t.label, t.icon, t.accent, hsProvidersFor(t.id).length),
];

/// Sélection « populaires » pour le hub.
final List<HsProvider> _hsPopular = [
  for (final id in ['electricien', 'nettoyage', 'clim', 'plombier'])
    if (hsProvidersFor(id).isNotEmpty) hsProvidersFor(id).first,
];

// Avis clients réutilisés (mock).
const _mockReviews = <List<Object>>[
  ['Aminata K.', 5.0, 'Très professionnel, ponctuel et travail impeccable. Je recommande vivement !'],
  ['Boubacar D.', 5.0, 'Rapide et efficace. Le prix annoncé a été respecté, aucune surprise.'],
  ['Mariam T.', 4.0, 'Bon travail dans l\'ensemble, un léger retard mais résultat au top.'],
];

// ----------------------------------------------------------------------------
// HELPERS UI
// ----------------------------------------------------------------------------

String _fcfa(int n) {
  final s = n.toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
    b.write(s[i]);
  }
  return '${b.toString()} FCFA';
}

String _initials(String name) {
  final parts = name.replaceAll('Dr ', '').trim().split(' ');
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
}

Widget _avatar(String name, {double size = 52}) => Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(_initials(name),
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: size * 0.34)),
    );

// ----------------------------------------------------------------------------
// 2. HUB — HomeServicesScreen
// ----------------------------------------------------------------------------

class HomeServicesScreen extends StatelessWidget {
  const HomeServicesScreen({super.key});

  void _push(BuildContext c, Widget s) =>
      Navigator.of(c).push(MaterialPageRoute(builder: (_) => s));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Services à domicile', style: T.title),
        leading: const BackButton(color: NC.ink),
        actions: [
          IconButton(
            tooltip: 'Mes interventions',
            icon: const Icon(Icons.event_note_rounded, color: NC.ink),
            onPressed: () => _push(context, const HsInterventionsScreen()),
          ),
        ],
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 6, 16, 28), children: [
        // Hero
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                  Text('Un pro à domicile,\nen un clic',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, height: 1.15)),
                  SizedBox(height: 8),
                  Text('Plombier, électricien, coiffeur, médecin… vérifiés et notés.',
                      style: TextStyle(color: Colors.white70, fontSize: 13.5, height: 1.3)),
                ]),
              ),
              const Icon(Icons.handyman_rounded, color: Colors.white, size: 48),
            ]),
            const SizedBox(height: 16),
            // Barre de recherche (mock)
            GestureDetector(
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Recherche — bientôt disponible'), duration: Duration(seconds: 1)),
              ),
              child: Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                child: Row(children: const [
                  Icon(Icons.search_rounded, color: NC.faint, size: 22),
                  SizedBox(width: 10),
                  Text('Rechercher un service, un pro…', style: TextStyle(color: NC.faint, fontSize: 14.5)),
                ]),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 22),
        const Text('Tous les métiers', style: T.h2),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.55,
          children: [
            for (final c in hsCategories)
              GestureDetector(
                onTap: () => _push(context, HsCategoryScreen(category: c)),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: cardDeco(radius: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                            color: c.accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
                        child: Icon(c.icon, color: c.accent, size: 24),
                      ),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c.label,
                            style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 15),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text('${c.count} pros', style: const TextStyle(color: NC.faint, fontSize: 12.5)),
                      ]),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 22),
        Row(children: const [
          Text('Prestataires populaires', style: T.h2),
          SizedBox(width: 8),
          Icon(Icons.local_fire_department_rounded, color: NC.brand, size: 20),
        ]),
        const SizedBox(height: 12),
        for (final p in _hsPopular) ...[
          _ProviderCard(p: p, onTap: () => _push(context, HsProviderScreen(provider: p))),
          const SizedBox(height: 12),
        ],
      ]),
    );
  }
}

// ----------------------------------------------------------------------------
// Carte prestataire réutilisable
// ----------------------------------------------------------------------------

class _ProviderCard extends StatelessWidget {
  final HsProvider p;
  final VoidCallback onTap;
  const _ProviderCard({required this.p, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: cardDeco(radius: 18),
        child: Row(children: [
          _avatar(p.name, size: 56),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(child: Text(p.name, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                if (p.verified) ...[
                  const SizedBox(width: 6),
                  const Icon(Icons.verified_rounded, color: NC.success, size: 16),
                ],
              ]),
              const SizedBox(height: 3),
              Text(p.trade, style: T.muted),
              const SizedBox(height: 8),
              Row(children: [
                Stars(p.rating, reviews: p.reviews),
                const SizedBox(width: 10),
                const Icon(Icons.place_outlined, size: 14, color: NC.faint),
                const SizedBox(width: 2),
                Flexible(
                  child: Text('${p.district} · ${p.distanceKm.toStringAsFixed(1)} km',
                      style: const TextStyle(color: NC.muted, fontSize: 12.5),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ]),
            ]),
          ),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            const Text('dès', style: TextStyle(color: NC.faint, fontSize: 11)),
            Text(_fcfa(p.priceFrom).replaceAll(' FCFA', ''),
                style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15)),
            const Text('FCFA', style: TextStyle(color: NC.faint, fontSize: 11)),
          ]),
        ]),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 3. LISTE PAR MÉTIER — HsCategoryScreen
// ----------------------------------------------------------------------------

class HsCategoryScreen extends StatelessWidget {
  final HsCategory category;
  const HsCategoryScreen({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    final pros = hsProvidersFor(category.id);
    const filters = ['Mieux notés', 'Plus proches', 'Moins chers'];
    return Scaffold(
      appBar: AppBar(title: Text(category.label, style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
        Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
                color: category.accent.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
            child: Icon(category.icon, color: category.accent, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${category.label} à Bamako', style: T.h2),
              const SizedBox(height: 2),
              Text('${pros.length} prestataires disponibles', style: T.muted),
            ]),
          ),
        ]),
        const SizedBox(height: 14),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: filters.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final on = i == 0;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                    color: on ? NC.brand : NC.surface, borderRadius: BorderRadius.circular(999)),
                alignment: Alignment.center,
                child: Text(filters[i],
                    style: TextStyle(
                        color: on ? Colors.white : NC.ink, fontWeight: FontWeight.w700, fontSize: 13.5)),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        for (final p in pros) ...[
          _ProviderCard(
              p: p,
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => HsProviderScreen(provider: p)))),
          const SizedBox(height: 12),
        ],
      ]),
    );
  }
}

// ----------------------------------------------------------------------------
// 4. FICHE PRESTATAIRE — HsProviderScreen
// ----------------------------------------------------------------------------

class HsProviderScreen extends StatelessWidget {
  final HsProvider provider;
  const HsProviderScreen({super.key, required this.provider});

  @override
  Widget build(BuildContext context) {
    final p = provider;
    return Scaffold(
      appBar: AppBar(title: Text(p.trade, style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
        // En-tête
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 20),
          child: Column(children: [
            Row(children: [
              _avatar(p.name, size: 68),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p.name, style: T.h2, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(p.trade, style: T.muted),
                  const SizedBox(height: 8),
                  Stars(p.rating, reviews: p.reviews),
                ]),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              if (p.verified)
                const Pill('KYC vérifié', color: NC.success, bg: Color(0x1F2ECC71), icon: Icons.verified_rounded),
              if (p.verified) const SizedBox(width: 8),
              Pill('${p.district} · ${p.distanceKm.toStringAsFixed(1)} km',
                  color: NC.muted, bg: NC.surfaceAlt, icon: Icons.place_outlined),
            ]),
          ]),
        ),
        const SizedBox(height: 14),
        // Stats
        Row(children: [
          _stat(Icons.star_rounded, p.rating.toStringAsFixed(1), 'Note'),
          _stat(Icons.workspace_premium_outlined, '${p.jobs}', 'Missions'),
          _stat(Icons.badge_outlined, '${p.years} ans', 'Expérience'),
        ]),
        const SizedBox(height: 18),
        const Text('À propos', style: T.h2),
        const SizedBox(height: 8),
        Text(p.bio, style: const TextStyle(color: NC.muted, fontSize: 14.5, height: 1.4)),
        const SizedBox(height: 18),
        const Text('Services & tarifs', style: T.h2),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final s in p.services)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(color: NC.surface, borderRadius: BorderRadius.circular(12)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(s.name, style: T.chip),
                const SizedBox(width: 8),
                Text(_fcfa(s.price),
                    style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 13)),
              ]),
            ),
        ]),
        const SizedBox(height: 18),
        const Text('Réalisations', style: T.h2),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: p.photos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) =>
                Img(p.photos[i], width: 170, height: 120, radius: BorderRadius.circular(16)),
          ),
        ),
        const SizedBox(height: 18),
        const Text('Avis clients', style: T.h2),
        const SizedBox(height: 12),
        for (final r in _mockReviews) ...[
          _reviewTile(r[0] as String, r[1] as double, r[2] as String),
          const SizedBox(height: 10),
        ],
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: GestureDetector(
            onTap: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => HsBookingScreen(provider: p))),
            child: Container(
              height: 56,
              decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16), boxShadow: [
                BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8)),
              ]),
              alignment: Alignment.center,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.event_available_rounded, color: Colors.white, size: 22),
                const SizedBox(width: 10),
                Text('Réserver · dès ${_fcfa(p.priceFrom)}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _stat(IconData i, String v, String l) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: cardDeco(radius: 16),
          child: Column(children: [
            Icon(i, color: NC.brand, size: 20),
            const SizedBox(height: 6),
            Text(v, style: const TextStyle(fontWeight: FontWeight.w800, color: NC.ink, fontSize: 15)),
            Text(l, style: const TextStyle(color: NC.faint, fontSize: 12)),
          ]),
        ),
      );

  Widget _reviewTile(String author, double rating, String text) => Container(
        padding: const EdgeInsets.all(14),
        decoration: cardDeco(radius: 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: NC.surfaceAlt, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(_initials(author),
                  style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w700, fontSize: 13)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(author, style: T.title)),
            Stars(rating),
          ]),
          const SizedBox(height: 8),
          Text(text, style: const TextStyle(color: NC.muted, fontSize: 13.5, height: 1.35)),
        ]),
      );
}

// ----------------------------------------------------------------------------
// 5. RÉSERVATION — HsBookingScreen
// ----------------------------------------------------------------------------

class HsBookingScreen extends StatefulWidget {
  final HsProvider provider;
  const HsBookingScreen({super.key, required this.provider});

  @override
  State<HsBookingScreen> createState() => _HsBookingScreenState();
}

class _HsBookingScreenState extends State<HsBookingScreen> {
  int _service = 0;
  int _date = 0;
  int _slot = 1;
  final _address = TextEditingController(text: 'Rue 250, Hamdallaye ACI');
  final _note = TextEditingController();

  static const _days = ['Auj.', 'Demain', 'Ven.', 'Sam.', 'Dim.'];
  static const _slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
  static const _fee = 1000; // déplacement

  @override
  void dispose() {
    _address.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.provider;
    final svc = p.services[_service];
    final total = svc.price + _fee;
    return Scaffold(
      appBar: AppBar(title: const Text('Réservation', style: T.title), leading: const BackButton(color: NC.ink)),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 24), children: [
        // Résumé pro
        Container(
          padding: const EdgeInsets.all(14),
          decoration: cardDeco(radius: 18),
          child: Row(children: [
            _avatar(p.name, size: 48),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, style: T.title),
                const SizedBox(height: 2),
                Text(p.trade, style: T.muted),
              ]),
            ),
            Stars(p.rating),
          ]),
        ),
        const SizedBox(height: 20),
        const Text('Quelle prestation ?', style: T.h2),
        const SizedBox(height: 10),
        for (var i = 0; i < p.services.length; i++)
          GestureDetector(
            onTap: () => setState(() => _service = i),
            behavior: HitTestBehavior.opaque,
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: cardDeco(
                radius: 14,
                border: Border.all(color: i == _service ? NC.brand : Colors.transparent, width: 1.5),
              ),
              child: Row(children: [
                Icon(i == _service ? Icons.radio_button_checked : Icons.radio_button_off,
                    color: i == _service ? NC.brand : NC.faint, size: 22),
                const SizedBox(width: 12),
                Expanded(child: Text(p.services[i].name, style: T.body)),
                Text(_fcfa(p.services[i].price),
                    style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14)),
              ]),
            ),
          ),
        const SizedBox(height: 12),
        const Text('Quel jour ?', style: T.h2),
        const SizedBox(height: 10),
        _chipRow(_days, _date, (i) => setState(() => _date = i)),
        const SizedBox(height: 20),
        const Text('À quelle heure ?', style: T.h2),
        const SizedBox(height: 10),
        _chipRow(_slots, _slot, (i) => setState(() => _slot = i)),
        const SizedBox(height: 20),
        const Text('Adresse d\'intervention', style: T.h2),
        const SizedBox(height: 10),
        _field(_address, Icons.place_outlined, 'Votre adresse'),
        const SizedBox(height: 16),
        const Text('Note pour le prestataire (optionnel)', style: T.h2),
        const SizedBox(height: 10),
        _field(_note, Icons.chat_bubble_outline_rounded, 'Précisez votre besoin…', lines: 3),
        const SizedBox(height: 22),
        // Récap prix
        Container(
          padding: const EdgeInsets.all(16),
          decoration: cardDeco(radius: 18),
          child: Column(children: [
            _recap('Prestation', _fcfa(svc.price)),
            const SizedBox(height: 8),
            _recap('Déplacement', _fcfa(_fee)),
            const Divider(color: NC.line, height: 24),
            _recap('Total estimé', _fcfa(total), strong: true),
          ]),
        ),
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: GestureDetector(
            onTap: () => Navigator.of(context).pushReplacement(MaterialPageRoute(
              builder: (_) => _BookingConfirmedScreen(
                provider: p,
                service: svc,
                day: _days[_date],
                slot: _slots[_slot],
                total: total,
              ),
            )),
            child: Container(
              height: 56,
              decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16), boxShadow: [
                BoxShadow(color: NC.brand.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8)),
              ]),
              alignment: Alignment.center,
              child: Text('Confirmer la réservation · ${_fcfa(total)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15.5)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _chipRow(List<String> items, int selected, ValueChanged<int> onTap) => SizedBox(
        height: 42,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) {
            final on = i == selected;
            return GestureDetector(
              onTap: () => onTap(i),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                    color: on ? NC.brand : NC.surface, borderRadius: BorderRadius.circular(999)),
                alignment: Alignment.center,
                child: Text(items[i],
                    style: TextStyle(
                        color: on ? Colors.white : NC.ink, fontWeight: FontWeight.w700, fontSize: 14)),
              ),
            );
          },
        ),
      );

  Widget _field(TextEditingController c, IconData icon, String hint, {int lines = 1}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(color: NC.surfaceAlt, borderRadius: BorderRadius.circular(14)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.only(top: 14), child: Icon(icon, color: NC.faint, size: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: c,
              maxLines: lines,
              style: const TextStyle(color: NC.ink, fontSize: 14.5),
              cursorColor: NC.brand,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: NC.faint, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                isDense: true,
              ),
            ),
          ),
        ]),
      );

  Widget _recap(String l, String v, {bool strong = false}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(l,
              style: TextStyle(
                  color: strong ? NC.ink : NC.muted,
                  fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
                  fontSize: strong ? 16 : 14)),
          Text(v,
              style: TextStyle(
                  color: strong ? NC.brand : NC.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: strong ? 17 : 14)),
        ],
      );
}

/// Confirmation simple après réservation.
class _BookingConfirmedScreen extends StatelessWidget {
  final HsProvider provider;
  final HsService service;
  final String day, slot;
  final int total;
  const _BookingConfirmedScreen({
    required this.provider,
    required this.service,
    required this.day,
    required this.slot,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: const CloseButton(color: NC.ink)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          const Spacer(),
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(color: NC.successSoft, shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, color: NC.success, size: 54),
          ),
          const SizedBox(height: 24),
          const Text('Réservation confirmée', style: T.h1, textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text(
            '${provider.name} interviendra $day à $slot pour « ${service.name} ».',
            style: const TextStyle(color: NC.muted, fontSize: 15, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: cardDeco(radius: 18),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total estimé', style: T.body),
              Text(_fcfa(total),
                  style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 18)),
            ]),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const HsInterventionsScreen())),
            child: Container(
              height: 56,
              width: double.infinity,
              decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
              alignment: Alignment.center,
              child: const Text('Voir mes interventions',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
            child: const Text('Retour à l\'accueil', style: TextStyle(color: NC.muted, fontWeight: FontWeight.w600)),
          ),
        ]),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 6. MES INTERVENTIONS — HsInterventionsScreen
// ----------------------------------------------------------------------------

class _Intervention {
  final String provider, trade, service, date, status;
  final int amount;
  final Color tone;
  final IconData icon;
  const _Intervention(this.provider, this.trade, this.service, this.date, this.status,
      this.amount, this.tone, this.icon);
}

const _mockInterventions = <_Intervention>[
  _Intervention('Moussa Coulibaly', 'Climatisation', 'Recharge de gaz', 'Aujourd\'hui · 14:00',
      'En cours', 20000, NC.warning, Icons.ac_unit),
  _Intervention('Amadou Traoré', 'Plombier', 'Réparation de fuite', 'Demain · 10:00',
      'À venir', 8000, NC.info, Icons.plumbing),
  _Intervention('Fatoumata Diarra', 'Esthéticienne', 'Soin du visage', 'Lun. dernier · 16:00',
      'Terminée', 15000, NC.success, Icons.spa),
  _Intervention('Ibrahim Keïta', 'Électricien', 'Dépannage panne', 'Il y a 3 jours · 09:00',
      'Terminée', 10000, NC.success, Icons.electrical_services),
];

class HsInterventionsScreen extends StatelessWidget {
  const HsInterventionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const items = _mockInterventions;
    return Scaffold(
      appBar: AppBar(title: const Text('Mes interventions', style: T.title), leading: const BackButton(color: NC.ink)),
      body: items.isEmpty
          ? _empty(context)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _tile(items[i]),
            ),
    );
  }

  Widget _tile(_Intervention it) => Container(
        padding: const EdgeInsets.all(14),
        decoration: cardDeco(radius: 18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: it.tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(12)),
              child: Icon(it.icon, color: it.tone, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(it.service, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${it.provider} · ${it.trade}', style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              ]),
            ),
            _statusPill(it.status, it.tone),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.schedule_rounded, size: 15, color: NC.faint),
            const SizedBox(width: 5),
            Text(it.date, style: const TextStyle(color: NC.muted, fontSize: 13)),
            const Spacer(),
            Text(_fcfa(it.amount), style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 14.5)),
          ]),
        ]),
      );

  Widget _statusPill(String s, Color tone) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: tone.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(999)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 7, height: 7, decoration: BoxDecoration(color: tone, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(s, style: TextStyle(color: tone, fontWeight: FontWeight.w700, fontSize: 12.5)),
        ]),
      );

  Widget _empty(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(color: NC.surface, shape: BoxShape.circle),
              child: const Icon(Icons.event_busy_rounded, color: NC.faint, size: 40),
            ),
            const SizedBox(height: 20),
            const Text('Aucune intervention', style: T.h2, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text('Réservez un pro à domicile, vos interventions apparaîtront ici.',
                style: TextStyle(color: NC.muted, fontSize: 14.5, height: 1.4), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const HomeServicesScreen())),
              child: Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 28),
                decoration: BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(16)),
                alignment: Alignment.center,
                child: const Text('Trouver un pro',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15.5)),
              ),
            ),
          ]),
        ),
      );
}
