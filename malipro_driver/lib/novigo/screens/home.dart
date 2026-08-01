import 'package:flutter/material.dart';
import '../theme.dart';
import '../models.dart';
import '../state.dart';
import '../brain_widgets.dart';
import '../data/brain_api.dart' show BrainMission;
import 'active_delivery.dart';

/// Tri/filtre appliqué à la file des courses. Le classement par défaut reste
/// celui du NOVIGO Brain : les autres modes ne sont qu'un confort de lecture,
/// jamais une contre-décision (principes n°1 et n°2).
enum _Tri { brain, recommandees, gain, proches }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  _Tri _tri = _Tri.brain;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  /// Comparaison insensible à la casse ET aux accents (« Hamdallaye » = « hamdallaye »).
  static String _norm(String v) => v
      .toLowerCase()
      .replaceAll(RegExp('[àâä]'), 'a')
      .replaceAll(RegExp('[éèêë]'), 'e')
      .replaceAll(RegExp('[îï]'), 'i')
      .replaceAll(RegExp('[ôö]'), 'o')
      .replaceAll(RegExp('[ûüù]'), 'u')
      .replaceAll('ç', 'c');

  /// Une course correspond si la recherche apparaît dans sa référence, son
  /// commerce, son client ou l'une de ses adresses.
  bool _matchCourse(DeliveryRequest r, String q) {
    if (q.isEmpty) return true;
    final champs = [r.reference ?? '', r.storeName, r.customerName, r.dropAddress, r.storeAddress];
    return champs.any((c) => _norm(c).contains(q));
  }

  bool _matchMission(BrainMission m, String q) {
    if (q.isEmpty) return true;
    return [m.reference, m.serviceLabel, m.zone].any((c) => _norm(c).contains(q));
  }

  /// Courses affichées : filtrées par la recherche, puis ordonnées selon le tri.
  /// `brain` = ordre renvoyé par le backend (score de compatibilité décroissant).
  List<DeliveryRequest> get _courses {
    final q = _norm(_query.trim());
    final out = driver.available.where((r) => _matchCourse(r, q)).toList();
    switch (_tri) {
      case _Tri.recommandees:
        return out.where((r) => r.recommended).toList();
      case _Tri.gain:
        out.sort((a, b) => b.payout.compareTo(a.payout));
        return out;
      case _Tri.proches:
        // Distance inconnue (0) reléguée en fin de liste plutôt qu'en tête.
        out.sort((a, b) {
          final da = a.distanceKm > 0 ? a.distanceKm : double.infinity;
          final db = b.distanceKm > 0 ? b.distanceKm : double.infinity;
          return da.compareTo(db);
        });
        return out;
      case _Tri.brain:
        return out;
    }
  }

  List<BrainMission> get _missions {
    final q = _norm(_query.trim());
    final out = driver.brainMissions.where((m) => _matchMission(m, q)).toList();
    if (_tri == _Tri.recommandees) return out.where((m) => m.recommended).toList();
    if (_tri == _Tri.gain) out.sort((a, b) => b.payout.compareTo(a.payout));
    return out;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: driver,
        builder: (context, _) => RefreshIndicator(
          onRefresh: driver.refreshAvailable,
          color: NC.brand,
          backgroundColor: NC.surface,
          child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _header(),
            const SizedBox(height: 16),
            _onlineCard(),
            const SizedBox(height: 16),
            _statsRow(),
            const SizedBox(height: 22),
            if (driver.online) ...[
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Demandes à proximité', style: T.h2),
                Text(
                  // Nombre affiché / total, dès qu'un filtre réduit la liste.
                  _courses.length == driver.available.length
                      ? '${driver.available.length}'
                      : '${_courses.length}/${driver.available.length}',
                  style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ]),
              const SizedBox(height: 12),
              _searchField(),
              const SizedBox(height: 10),
              _filterChips(),
              const SizedBox(height: 14),
              if (driver.available.isEmpty)
                _empty(Icons.hourglass_empty_rounded, 'Aucune demande pour le moment',
                    'De nouvelles courses arrivent bientôt. Restez en ligne.')
              else if (_courses.isEmpty)
                _empty(
                    _tri == _Tri.recommandees ? Icons.auto_awesome : Icons.search_off_rounded,
                    _tri == _Tri.recommandees
                        ? 'Aucune course recommandée'
                        : 'Aucune course ne correspond',
                    _tri == _Tri.recommandees
                        ? 'Le Brain n’a rien de fortement compatible pour vous en ce moment.'
                        : 'Essayez une autre référence, un commerce ou un quartier.')
              else
                ..._courses.map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _RequestCard(req: r),
                    )),
              if (_missions.isNotEmpty) ...[
                const SizedBox(height: 22),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Missions NOVIGO Brain', style: T.h2),
                  Text(
                    _missions.length == driver.brainMissions.length
                        ? '${driver.brainMissions.length}'
                        : '${_missions.length}/${driver.brainMissions.length}',
                    style: const TextStyle(color: NC.brand, fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ]),
                const SizedBox(height: 6),
                const Text('Tous métiers : colis, course, dépannage, services à domicile.',
                    style: T.muted),
                const SizedBox(height: 12),
                ..._missions.map((m) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: BrainMissionCard(
                        mission: m,
                        onAccept: () => driver.acceptBrainMission(m),
                      ),
                    )),
              ],
            ] else
              _empty(Icons.wifi_off_rounded, 'Vous êtes hors ligne',
                  'Passez en ligne pour recevoir des courses à proximité.'),
          ],
          ),
        ),
      ),
    );
  }

  Widget _header() => Row(children: [
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: const Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 21)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Bonjour', style: TextStyle(color: NC.faint, fontSize: 12.5, fontWeight: FontWeight.w600)),
            // Nom du compte connecté (GET /drivers/me), pas un nom de démo.
            Text(driver.displayName,
                style: const TextStyle(color: NC.ink, fontWeight: FontWeight.w800, fontSize: 17),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(color: NC.surface, shape: BoxShape.circle),
          child: const Icon(Icons.notifications_none_rounded, color: NC.ink, size: 22),
        ),
      ]);

  Widget _onlineCard() {
    final on = driver.online;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: on
          ? BoxDecoration(gradient: NC.brandGradient, borderRadius: BorderRadius.circular(22))
          : cardDeco(radius: 22),
      child: Row(children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: on ? Colors.white.withValues(alpha: 0.18) : NC.surfaceAlt,
            shape: BoxShape.circle,
          ),
          child: Icon(on ? Icons.pedal_bike_rounded : Icons.power_settings_new_rounded,
              color: on ? Colors.white : NC.faint, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(on ? 'En ligne' : 'Hors ligne',
                style: TextStyle(
                    color: on ? Colors.white : NC.ink, fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 2),
            Text(on ? 'Prêt à livrer' : 'Vous ne recevez pas de courses',
                style: TextStyle(
                    color: on ? Colors.white70 : NC.muted, fontSize: 13, fontWeight: FontWeight.w500)),
          ]),
        ),
        Switch(
          value: on,
          onChanged: (_) => driver.toggleOnline(),
          activeThumbColor: Colors.white,
          activeTrackColor: Colors.white.withValues(alpha: 0.35),
          inactiveThumbColor: NC.faint,
          inactiveTrackColor: NC.surfaceAlt,
        ),
      ]),
    );
  }

  /// Recherche par référence, commerce, client ou quartier — la file peut
  /// compter des dizaines de courses, la retrouver à l'oeil n'était pas tenable.
  Widget _searchField() => Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: NC.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _query.isEmpty ? NC.line : NC.brand),
        ),
        child: Row(children: [
          Icon(Icons.search_rounded, size: 19, color: _query.isEmpty ? NC.faint : NC.brand),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v),
              textInputAction: TextInputAction.search,
              style: const TextStyle(color: NC.ink, fontSize: 14.5, fontWeight: FontWeight.w600),
              cursorColor: NC.brand,
              decoration: const InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: 'Référence, commerce, client, quartier…',
                hintStyle: TextStyle(color: NC.faint, fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ),
          if (_query.isNotEmpty)
            GestureDetector(
              onTap: () {
                _searchCtrl.clear();
                setState(() => _query = '');
              },
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.only(left: 6),
                child: Icon(Icons.close_rounded, size: 18, color: NC.muted),
              ),
            ),
        ]),
      );

  Widget _filterChips() => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: [
          _chip('Classement Brain', _Tri.brain, Icons.auto_awesome),
          _chip('Recommandées', _Tri.recommandees, Icons.verified_rounded),
          _chip('Mieux payées', _Tri.gain, Icons.payments_rounded),
          _chip('Plus proches', _Tri.proches, Icons.near_me_rounded),
        ]),
      );

  Widget _chip(String label, _Tri tri, IconData icon) {
    final on = _tri == tri;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _tri = tri),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: on ? NC.brand.withValues(alpha: 0.16) : NC.surfaceAlt,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: on ? NC.brand : NC.line),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 14, color: on ? NC.brand : NC.faint),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: on ? NC.brand : NC.muted, fontWeight: FontWeight.w700, fontSize: 12.5)),
          ]),
        ),
      ),
    );
  }

  Widget _statsRow() => Row(children: [
        _stat(Icons.payments_rounded, fcfa(driver.todayEarnings), 'Gains', NC.success),
        const SizedBox(width: 10),
        _stat(Icons.check_circle_rounded, '${driver.todayCount}', 'Courses', NC.brand),
        const SizedBox(width: 10),
        _stat(Icons.star_rounded, driver.rating.toStringAsFixed(1), 'Note', NC.gold),
        const SizedBox(width: 10),
        // Cumul des courses terminées (backend) : le temps passé en ligne n'est
        // pas tracé côté serveur, on n'affiche donc pas d'heures inventées.
        _stat(Icons.local_shipping_rounded, '${driver.totalDeliveries}', 'Total', NC.info),
      ]);

  Widget _stat(IconData icon, String value, String label, Color c) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: cardDeco(radius: 18),
          child: Column(children: [
            Icon(icon, color: c, size: 22),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(value,
                  maxLines: 1,
                  style: const TextStyle(
                      color: NC.ink, fontWeight: FontWeight.w900, fontSize: 14, fontFeatures: [FontFeature.tabularFigures()])),
            ),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: NC.faint, fontSize: 11, fontWeight: FontWeight.w600)),
          ]),
        ),
      );

  Widget _empty(IconData icon, String title, String sub) => Container(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
        decoration: cardDeco(radius: 20),
        child: Column(children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(color: NC.surfaceAlt, shape: BoxShape.circle),
            child: Icon(icon, color: NC.faint, size: 30),
          ),
          const SizedBox(height: 14),
          Text(title, style: T.title, textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text(sub, style: T.muted, textAlign: TextAlign.center),
        ]),
      );
}

class _RequestCard extends StatelessWidget {
  final DeliveryRequest req;
  const _RequestCard({required this.req});

  /// Sous-titre composé des seuls éléments réellement connus (articles, ETA,
  /// référence) : rien n'est affiché plutôt qu'une valeur inventée.
  static String? _subtitle(DeliveryRequest r) {
    final parts = <String>[
      if (r.itemsCount > 0) '${r.itemsCount} article${r.itemsCount > 1 ? 's' : ''}',
      if (r.etaMin > 0) '${r.etaMin} min',
      if (r.reference != null) r.reference!,
    ];
    return parts.isEmpty ? null : parts.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: cardDeco(radius: 20),
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(req.storeInitials,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(req.storeName, style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              if (_subtitle(req) != null) ...[
                const SizedBox(height: 2),
                Text(_subtitle(req)!, style: T.muted, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
              // Décision du Brain : pourquoi cette course m'est proposée.
              if (req.brainScore > 0) ...[
                const SizedBox(height: 6),
                BrainScoreBadge(
                  score: req.brainScore,
                  recommended: req.recommended,
                  reasons: req.brainReasons,
                  title: 'Pourquoi cette course ?',
                ),
              ],
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            if (req.payout > 0)
              Text(fcfa(req.payout),
                  style: const TextStyle(
                      color: NC.success,
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      fontFeatures: [FontFeature.tabularFigures()])),
            // Distance affichée seulement si le backend la connaît (géoloc P4).
            if (req.distanceKm > 0)
              Text('${req.distanceKm} km', style: const TextStyle(color: NC.faint, fontSize: 12)),
          ]),
        ]),
        const SizedBox(height: 14),
        _leg(Icons.storefront_rounded, NC.gold, 'Retrait', req.storeAddress),
        Padding(
          padding: const EdgeInsets.only(left: 13, top: 2, bottom: 2),
          child: Container(width: 2, height: 14, color: NC.line),
        ),
        _leg(Icons.location_on_rounded, NC.brand, 'Client · ${req.customerName}', req.dropAddress),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: NC.brand,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () {
              driver.accept(req);
              Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ActiveDeliveryScreen()));
            },
            child: const Text('Accepter la course',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          ),
        ),
      ]),
    );
  }

  Widget _leg(IconData icon, Color c, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: c.withValues(alpha: 0.16), shape: BoxShape.circle),
            child: Icon(icon, color: c, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: const TextStyle(color: NC.faint, fontSize: 11.5, fontWeight: FontWeight.w600)),
              Text(value, style: T.body, maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
        ],
      );
}
