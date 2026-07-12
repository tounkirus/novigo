import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../application/chat_providers.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(conversationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () =>
                  ref.read(chatRefreshTickProvider.notifier).state++),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.read(chatRefreshTickProvider.notifier).state++,
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            Center(child: Text('Erreur : $e')),
          ]),
          data: (list) {
            if (list.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 100),
                Icon(Icons.forum_outlined, size: 48, color: AppColors.muted),
                SizedBox(height: 12),
                Center(
                    child: Text('Aucune conversation',
                        style: TextStyle(color: AppColors.muted))),
                SizedBox(height: 6),
                Center(
                    child: Text('Contactez un client depuis une course',
                        style: TextStyle(color: AppColors.muted, fontSize: 12))),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final c = list[i];
                final preview = c['lastMessagePreview']?.toString() ??
                    'Nouvelle conversation';
                return Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.line)),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: AppColors.brand,
                      child: Icon(Icons.chat_bubble, color: Colors.white),
                    ),
                    title: Text(
                        'Conversation ${(c['id'] as String).substring(0, 8)}'),
                    subtitle: Text(preview,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/chat/${c['id']}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
