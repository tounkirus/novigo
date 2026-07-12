import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../../auth/application/auth_controller.dart';

/// Fonctions listées : celles marquées "à compléter" attendent leur backend (P1/P6).
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final items = <(IconData, String, String)>[
      (Icons.star_border, 'Fidélité', 'GET /customers/me/loyalty'),
      (Icons.favorite_border, 'Favoris', 'à compléter (P1)'),
      (Icons.local_offer_outlined, 'Coupons', 'à compléter (P6)'),
      (Icons.card_giftcard, 'Parrainage', 'à compléter (P6)'),
      (Icons.chat_bubble_outline, 'Chat', 'messagerie temps réel'),
      (Icons.notifications_none, 'Notifications', 'à compléter (P6)'),
      (Icons.translate, 'Langue', 'FR / EN (i18n scaffoldé)'),
      (Icons.help_outline, "Centre d'aide", 'à compléter'),
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          child: Row(
            children: [
              const CircleAvatar(backgroundColor: AppColors.brand, child: Icon(Icons.person, color: Colors.white)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${user?['firstName'] ?? 'Client'} ${user?['lastName'] ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(user?['phone']?.toString() ?? '', style: const TextStyle(color: AppColors.muted)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...items.map((it) => Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.line)),
              child: ListTile(
                leading: Icon(it.$1, color: AppColors.brand),
                title: Text(it.$2),
                subtitle: Text(it.$3, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  if (it.$2 == 'Chat') context.push('/chat');
                },
              ),
            )),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
          icon: const Icon(Icons.logout),
          label: const Text('Déconnexion'),
        ),
      ],
    );
  }
}
