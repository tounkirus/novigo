import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../auth/application/auth_controller.dart';
import '../../deliveries/application/deliveries_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _busy = false;

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    try {
      final pos = await ref.read(locationServiceProvider).current();
      await ref
          .read(deliveriesRepositoryProvider)
          .setAvailability(value, lat: pos.lat, lng: pos.lng);
      bumpRefresh(ref);
      if (mounted) {
        showInfo(context, value ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
      }
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(driverProfileProvider);
    final user = ref.watch(authControllerProvider).user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            const Text('Profil',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const Spacer(),
            IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => bumpRefresh(ref)),
          ],
        ),
        const SizedBox(height: 8),
        SectionCard(
          child: Row(
            children: [
              const CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.brand,
                child: Icon(Icons.person, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user == null
                          ? 'Livreur'
                          : '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(user?['phone']?.toString() ?? '',
                        style: const TextStyle(color: AppColors.muted)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SectionCard(
            child: Text('Profil livreur indisponible : $e',
                style: const TextStyle(color: AppColors.muted)),
          ),
          data: (d) {
            final available = d['isAvailable'] == true;
            return Column(
              children: [
                SectionCard(
                  child: Column(
                    children: [
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Disponible pour les courses'),
                        subtitle: Text(available ? 'En ligne' : 'Hors ligne',
                            style: TextStyle(color: statusColor(
                                available ? 'COMPLETED' : 'CANCELLED'))),
                        value: available,
                        onChanged: _busy ? null : _toggle,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SectionCard(
                  child: Column(
                    children: [
                      _stat('Note', (d['rating'] ?? 0).toString(), Icons.star),
                      const Divider(height: 20),
                      _stat('Livraisons effectuées',
                          (d['totalDeliveries'] ?? 0).toString(),
                          Icons.local_shipping),
                      const Divider(height: 20),
                      _stat('Statut KYC', (d['kycStatus'] ?? '—').toString(),
                          Icons.verified_user),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.line)),
          child: ListTile(
            leading: const Icon(Icons.chat_bubble_outline, color: AppColors.brand),
            title: const Text('Messages'),
            subtitle: const Text('Conversations avec les clients',
                style: TextStyle(fontSize: 11, color: AppColors.muted)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/chat'),
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          icon: const Icon(Icons.logout),
          label: const Text('Se déconnecter'),
          onPressed: () =>
              ref.read(authControllerProvider.notifier).signOut(),
        ),
      ],
    );
  }

  Widget _stat(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.gold),
        const SizedBox(width: 10),
        Expanded(child: Text(label)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }
}
