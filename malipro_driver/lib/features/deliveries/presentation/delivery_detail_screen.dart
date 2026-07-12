import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../chat/application/chat_providers.dart';
import '../application/deliveries_providers.dart';
import '../data/deliveries_repository.dart';

class DeliveryDetailScreen extends ConsumerStatefulWidget {
  const DeliveryDetailScreen({super.key, required this.deliveryId});
  final String deliveryId;
  @override
  ConsumerState<DeliveryDetailScreen> createState() =>
      _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends ConsumerState<DeliveryDetailScreen> {
  bool _busy = false;

  DeliveriesRepository get _repo => ref.read(deliveriesRepositoryProvider);

  Future<void> _run(Future<void> Function() action, String okMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      bumpRefresh(ref);
      if (mounted) showInfo(context, okMsg);
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendLocation() async {
    final pos = await ref.read(locationServiceProvider).current();
    await _run(
      () => _repo.updateLocation(widget.deliveryId, pos.lat, pos.lng),
      'Position envoyée (${pos.lat.toStringAsFixed(4)}, ${pos.lng.toStringAsFixed(4)})',
    );
  }

  /// Ouvre (ou crée) une conversation avec le client de la commande liée.
  Future<void> _contactCustomer(String orderId) async {
    setState(() => _busy = true);
    try {
      final chat = ref.read(chatRepositoryProvider);
      final customerId = await chat.orderCustomerId(orderId);
      if (customerId == null) {
        if (mounted) showError(context, 'Client introuvable pour cette commande.');
        return;
      }
      final conv = await chat.createConversation(customerId, orderId: orderId);
      if (mounted) context.push('/chat/${conv['id']}');
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(deliveryDetailProvider(widget.deliveryId));
    return Scaffold(
      appBar: AppBar(title: const Text('Détail de la course')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (d) {
          final status = (d['status'] as String?) ?? '—';
          final pickup = d['pickupLocation'] as Map<String, dynamic>?;
          final dropoff = d['dropoffLocation'] as Map<String, dynamic>?;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text('Course ${(d['id'] as String).substring(0, 8)}',
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                        StatusChip(status, color: statusColor(status)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Commande : ${d['orderId'] ?? '—'}',
                        style: const TextStyle(color: AppColors.muted)),
                    if (d['etaMinutes'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text('ETA estimé : ${d['etaMinutes']} min',
                            style: const TextStyle(color: AppColors.muted)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _point(Icons.store_mall_directory_outlined, 'Retrait',
                        pickup),
                    const Divider(height: 20),
                    _point(Icons.flag_outlined, 'Livraison', dropoff),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Contacter le client'),
                onPressed: (_busy || d['orderId'] == null)
                    ? null
                    : () => _contactCustomer(d['orderId'] as String),
              ),
              const SizedBox(height: 16),
              ..._actions(status),
            ],
          );
        },
      ),
    );
  }

  Widget _point(IconData icon, String label, Map<String, dynamic>? loc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.brand),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(
                loc == null
                    ? 'Position non communiquée'
                    : '${(loc['lat'] as num).toStringAsFixed(4)}, ${(loc['lng'] as num).toStringAsFixed(4)}',
                style: const TextStyle(color: AppColors.muted, fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _actions(String status) {
    if (_busy) {
      return [
        const Center(child: Padding(
          padding: EdgeInsets.all(16),
          child: CircularProgressIndicator(),
        )),
      ];
    }
    switch (status) {
      case 'UNASSIGNED':
        return [
          FilledButton.icon(
            icon: const Icon(Icons.check),
            label: const Text('Accepter la course'),
            onPressed: () => _run(
              () async {
                await _repo.accept(widget.deliveryId);
              },
              'Course acceptée',
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => _run(
              () => _repo.reject(widget.deliveryId),
              'Course passée',
            ),
            child: const Text('Passer'),
          ),
        ];
      case 'ACCEPTED':
        return [
          FilledButton.icon(
            icon: const Icon(Icons.play_arrow),
            label: const Text('Démarrer la course'),
            onPressed: () => _run(
              () async {
                await _repo.start(widget.deliveryId);
              },
              'Course démarrée',
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.my_location),
            label: const Text('Envoyer ma position'),
            onPressed: _sendLocation,
          ),
        ];
      case 'EN_ROUTE_DROPOFF':
        return [
          OutlinedButton.icon(
            icon: const Icon(Icons.my_location),
            label: const Text('Envoyer ma position'),
            onPressed: _sendLocation,
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            icon: const Icon(Icons.done_all),
            label: const Text('Marquer comme livrée'),
            onPressed: () => _run(
              () async {
                await _repo.complete(widget.deliveryId);
              },
              'Course terminée',
            ),
          ),
        ];
      default:
        return [
          Center(
            child: Text('Course $status',
                style: const TextStyle(color: AppColors.muted)),
          ),
        ];
    }
  }
}
