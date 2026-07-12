import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../common/ui.dart';
import '../../../core/theme.dart';
import '../../auth/application/auth_controller.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final roles = (user?['roles'] as List?)?.join(', ') ?? '';
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Compte',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SectionCard(
          child: Row(
            children: [
              const CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.brand,
                child: Icon(Icons.storefront, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user == null
                          ? 'Marchand'
                          : '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(user?['phone']?.toString() ?? '',
                        style: const TextStyle(color: AppColors.muted)),
                    if (roles.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(roles,
                            style: const TextStyle(
                                color: AppColors.muted, fontSize: 12)),
                      ),
                  ],
                ),
              ),
            ],
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
}
