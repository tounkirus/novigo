import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme.dart';
import '../../auth/application/auth_controller.dart';
import '../../artisan/application/artisan_providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  Future<void> _editProfile(
      BuildContext context, WidgetRef ref, Map<String, dynamic> a) async {
    final profession =
        TextEditingController(text: a['profession']?.toString() ?? '');
    final bio = TextEditingController(text: a['bio']?.toString() ?? '');
    final area =
        TextEditingController(text: a['serviceArea']?.toString() ?? '');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Modifier le profil'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: profession,
                  decoration: const InputDecoration(labelText: 'Métier')),
              const SizedBox(height: 10),
              TextField(
                  controller: bio,
                  decoration: const InputDecoration(labelText: 'Bio')),
              const SizedBox(height: 10),
              TextField(
                  controller: area,
                  decoration:
                      const InputDecoration(labelText: 'Zone d\'intervention')),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Enregistrer')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(artisanRepositoryProvider).updateProfile(
            profession: profession.text.trim(),
            bio: bio.text.trim(),
            serviceArea: area.text.trim(),
          );
      bumpRefresh(ref);
      if (context.mounted) showInfo(context, 'Profil mis à jour');
    } on ApiException catch (e) {
      if (context.mounted) showError(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final profile = ref.watch(artisanProfileProvider);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Compte',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SectionCard(
          child: Row(
            children: [
              _Avatar(photoUrl: user?['photoUrl']?.toString()),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user == null
                          ? 'Artisan'
                          : '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'
                              .trim(),
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
        profile.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SectionCard(
            child: Text('Profil artisan indisponible : $e',
                style: const TextStyle(color: AppColors.muted)),
          ),
          data: (a) => SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _row('Métier', a['profession']?.toString() ?? '—'),
                const Divider(height: 18),
                _row('Zone', a['serviceArea']?.toString() ?? '—'),
                const Divider(height: 18),
                _row('Bio', a['bio']?.toString() ?? '—'),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Modifier le profil'),
                  onPressed: () => _editProfile(context, ref, a),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.line)),
          child: ListTile(
            leading: const Icon(Icons.campaign_outlined, color: AppColors.brand),
            title: const Text('Annonces vocales'),
            subtitle: const Text('Être prévenu à la voix d’une nouvelle demande',
                style: TextStyle(fontSize: 11, color: AppColors.muted)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/voix'),
          ),
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

  Widget _row(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
            width: 80,
            child: Text(label,
                style: const TextStyle(color: AppColors.muted))),
        Expanded(child: Text(value)),
      ],
    );
  }
}

/// Avatar artisan : photo réseau si disponible, sinon icône métier.
class _Avatar extends StatelessWidget {
  const _Avatar({required this.photoUrl});
  final String? photoUrl;

  @override
  Widget build(BuildContext context) {
    final has = photoUrl != null && photoUrl!.trim().isNotEmpty;
    return CircleAvatar(
      radius: 26,
      backgroundColor: AppColors.brand,
      foregroundImage: has ? NetworkImage(photoUrl!) : null,
      child: has ? null : const Icon(Icons.handyman, color: Colors.white),
    );
  }
}
