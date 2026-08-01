import '../models.dart';
import 'api_client.dart';

/// Couche live du marchand : appels REST vers le Gateway + mapping des DTO
/// backend vers le modèle UI `MOrder` (les écrans restent inchangés).

int _amount(dynamic money) {
  if (money is Map) return ((money['amount'] as num?) ?? 0).round();
  if (money is num) return money.round();
  return 0;
}

/// Statut backend → statut UI marchand.
/// Cycle backend : PENDING → CONFIRMED → PREPARING → READY → ASSIGNED →
/// PICKED_UP → IN_TRANSIT → DELIVERED (ou CANCELLED). Le marchand collapse
/// « acceptée/en cuisine » (CONFIRMED+PREPARING) en une seule étape
/// « En préparation », et considère la commande terminée dès qu'un livreur la
/// prend en charge (ASSIGNED+).
String statusFromBackend(String? s) {
  switch ((s ?? '').toUpperCase()) {
    case 'PENDING':
      return MStatus.nouvelle;
    case 'CONFIRMED': // ← accept backend = CONFIRMED (et non ACCEPTED) : sans ce cas
    case 'ACCEPTED':  //   la commande acceptée retombait dans « Nouvelles ».
    case 'PREPARING':
      return MStatus.preparation;
    case 'READY':
      return MStatus.prete;
    case 'ASSIGNED':
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'DELIVERED':
    case 'COMPLETED':
    case 'CANCELLED':
      return MStatus.terminee;
    default:
      return MStatus.nouvelle;
  }
}

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return 'CL';
  if (parts.length == 1) {
    final p = parts.first;
    return (p.length >= 2 ? p.substring(0, 2) : p).toUpperCase();
  }
  return (parts.first[0] + parts.last[0]).toUpperCase();
}

/// Libellé relatif « il y a X » depuis un timestamp ISO.
String _whenLabel(dynamic createdAt) {
  final raw = createdAt?.toString();
  if (raw == null || raw.isEmpty) return "à l'instant";
  final ts = DateTime.tryParse(raw);
  if (ts == null) return "à l'instant";
  final d = DateTime.now().difference(ts);
  if (d.inMinutes < 1) return "à l'instant";
  if (d.inMinutes < 60) return 'il y a ${d.inMinutes} min';
  if (d.inHours < 24) return 'il y a ${d.inHours} h';
  return 'il y a ${d.inDays} j';
}

/// Construit un `MOrder` depuis une commande backend (endpoint /merchants/me/orders)
/// OU depuis l'événement temps réel `order.new` (charge utile partielle tolérée).
MOrder merchantOrderFromJson(Map j) {
  final itemsRaw = (j['items'] as List?) ?? const [];
  final lines = <String>[];
  final labelParts = <String>[];
  int counted = 0;
  for (final it in itemsRaw) {
    if (it is! Map) continue;
    final name = (it['name'] ?? 'Article').toString();
    final qty = (it['quantity'] as num?)?.toInt() ?? 1;
    final unit = _amount(it['unitPrice']);
    counted += qty;
    labelParts.add('$qty× $name');
    lines.add('$qty× $name — ${fcfa(unit * qty)}');
  }

  final backendId = (j['id'] ?? '').toString();
  final reference = (j['reference'] ?? backendId).toString();
  final customer = (j['customerName'] ?? 'Client NOVIGO').toString();
  final total = _amount(j['total']);
  // 0 = décompte inconnu (charge utile partielle) : la carte masque la ligne
  // plutôt que d'annoncer « 1 article » sur une commande qui en contient plusieurs.
  final itemsCount = (j['itemsCount'] as num?)?.toInt() ?? counted;

  return MOrder(
    id: reference.isNotEmpty ? reference : backendId,
    backendId: backendId.isNotEmpty ? backendId : null,
    customerName: customer,
    customerInitials: _initials(customer),
    itemsLabel: labelParts.isNotEmpty ? labelParts.join(', ') : 'Commande $reference',
    itemCount: itemsCount,
    total: total,
    whenLabel: _whenLabel(j['createdAt']),
    status: statusFromBackend(j['status']?.toString()),
    items: lines.isNotEmpty ? lines : ['Commande $reference'],
  );
}

/// GET /merchants/me/orders — commandes du marchand connecté.
Future<List<MOrder>> fetchOrders() async {
  final data = await api.get('/merchants/me/orders', query: {'limit': 50});
  final list = (data is List)
      ? data
      : (data is Map ? (data['items'] as List? ?? const []) : const []);
  return list.whereType<Map>().map(merchantOrderFromJson).toList();
}

/// GET /merchants/me — profil boutique (businessName, category).
Future<Map?> fetchProfile() async {
  final data = await api.get('/merchants/me');
  return data is Map ? data : null;
}

// ---- Transitions de statut ----

Future<void> acceptOrder(String id) async => await api.post('/merchants/orders/$id/accept');
Future<void> refuseOrder(String id) async => await api.post('/merchants/orders/$id/refuse');
Future<void> setPreparing(String id) async => await api.post('/merchants/orders/$id/preparing');
Future<void> setReady(String id) async => await api.post('/merchants/orders/$id/ready');
