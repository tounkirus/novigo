import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../common/ui.dart';
import '../../../core/api/api_client.dart';
import '../../../core/services/realtime_service.dart';
import '../../../core/theme.dart';
import '../../auth/application/auth_controller.dart';
import '../application/chat_providers.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.conversationId});
  final String conversationId;
  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  final Set<String> _ids = {};
  StreamSubscription? _msgSub;
  StreamSubscription? _typingSub;
  RealtimeService? _rt;
  bool _loading = true;
  bool _sending = false;
  bool _peerTyping = false;
  Timer? _typingReset;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      final history = await ref
          .read(chatRepositoryProvider)
          .messages(widget.conversationId);
      _addAll(history);
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    }
    final rt = await ref.read(realtimeConnectionProvider.future);
    _rt = rt;
    rt.joinConversation(widget.conversationId);
    _msgSub = rt.messages.listen((m) {
      if (m['conversationId'] == widget.conversationId) {
        setState(() => _addOne(m));
        _scrollToEnd();
      }
    });
    _typingSub = rt.typing.listen((t) {
      if (t['conversationId'] == widget.conversationId &&
          t['userId'] != _myId) {
        setState(() => _peerTyping = t['isTyping'] == true);
        _typingReset?.cancel();
        if (_peerTyping) {
          _typingReset = Timer(const Duration(seconds: 3),
              () => mounted ? setState(() => _peerTyping = false) : null);
        }
      }
    });
    if (mounted) {
      setState(() => _loading = false);
      _scrollToEnd();
    }
  }

  String? get _myId => ref.read(authControllerProvider).user?['id'] as String?;

  void _addAll(List<Map<String, dynamic>> list) {
    for (final m in list) {
      _addOne(m);
    }
  }

  void _addOne(Map<String, dynamic> m) {
    final id = m['id'] as String?;
    if (id == null || _ids.contains(id)) return;
    _ids.add(id);
    _messages.add(m);
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _rt?.sendTyping(widget.conversationId, false);
    try {
      final msg = await ref
          .read(chatRepositoryProvider)
          .send(widget.conversationId, text);
      _input.clear();
      setState(() => _addOne(msg));
      _scrollToEnd();
    } on ApiException catch (e) {
      if (mounted) showError(context, e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _msgSub?.cancel();
    _typingSub?.cancel();
    _typingReset?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Conversation ${widget.conversationId.substring(0, 8)}'),
        bottom: _peerTyping
            ? const PreferredSize(
                preferredSize: Size.fromHeight(20),
                child: Padding(
                  padding: EdgeInsets.only(bottom: 4),
                  child: Text('en train d\'écrire…',
                      style: TextStyle(
                          color: AppColors.muted,
                          fontSize: 12,
                          fontStyle: FontStyle.italic)),
                ),
              )
            : null,
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(
                        child: Text('Démarrez la conversation',
                            style: TextStyle(color: AppColors.muted)))
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.all(12),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) => _bubble(_messages[i]),
                      ),
          ),
          _composer(),
        ],
      ),
    );
  }

  Widget _bubble(Map<String, dynamic> m) {
    final mine = m['senderId'] == _myId;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: mine ? AppColors.brand : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.line),
        ),
        child: Text(
          m['body']?.toString() ?? '',
          style: TextStyle(color: mine ? Colors.white : AppColors.ink),
        ),
      ),
    );
  }

  Widget _composer() {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _input,
                minLines: 1,
                maxLines: 4,
                onChanged: (v) =>
                    _rt?.sendTyping(widget.conversationId, v.isNotEmpty),
                decoration: const InputDecoration(
                  hintText: 'Votre message…',
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: _sending ? null : _send,
              style: FilledButton.styleFrom(
                  shape: const CircleBorder(),
                  minimumSize: const Size(48, 48)),
              child: const Icon(Icons.send, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
