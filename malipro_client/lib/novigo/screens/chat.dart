import 'package:flutter/material.dart';

import '../data/chat_api.dart';
import '../data/env.dart';
import '../data/realtime_client.dart';
import '../ui/ui.dart';

class _Conversation {
  final String title;
  final String initials;
  final String lastMessage;
  final String time; // heure relative
  final int unread;
  final String? conversationId; // non nul => conversation live (backend)
  const _Conversation(this.title, this.initials, this.lastMessage, this.time,
      {this.unread = 0, this.conversationId});

  factory _Conversation.fromLive(ConversationDto c) => _Conversation(
        c.title,
        _initialsOf(c.title),
        c.lastMessage,
        c.time,
        unread: c.unread,
        conversationId: c.id,
      );
}

String _initialsOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return '?';
  if (parts.length == 1) {
    return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/// Liste des conversations (coursier, support, commerçant).
/// En mode live, récupère les conversations réelles du Gateway (repli mock si échec/vide).
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();

  static const List<_Conversation> _mock = [
    _Conversation('Coursier NOVIGO', 'IB', 'Je suis à 3 minutes, je vous appelle en arrivant.', '17:42',
        unread: 2),
    _Conversation('Support NOVIGO', 'SN', 'Votre remboursement a bien été traité, bonne journée !', '16:10'),
    _Conversation('Chez Fatou', 'CF', 'Votre commande est en préparation, merci de patienter.', 'Hier',
        unread: 1),
  ];
}

class _ChatScreenState extends State<ChatScreen> {
  /// Hors ligne, la liste de démonstration ; en live, ce que le serveur répond —
  /// y compris rien du tout. Auparavant, une boîte réellement vide affichait
  /// trois conversations fictives.
  late List<_Conversation> _conversations =
      NovigoEnv.live ? const [] : ChatScreen._mock;

  bool _loading = false;
  bool _failed = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    if (NovigoEnv.live) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    try {
      final live = await chatApi.conversations();
      if (!mounted) return;
      setState(() {
        _conversations = live.map(_Conversation.fromLive).toList();
        _loaded = true;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final gutter = Rs.of(context).gutter;
    final firstLoad = _loading && !_loaded;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages', style: T.h2),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: Sp.lg + 2),
              child: Center(
                child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: NC.brand)),
              ),
            ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: NovigoEnv.live ? _load : () async {},
          color: NC.brand,
          backgroundColor: NC.surface,
          child: NovigoContentWidth(
            child: ListView(
              padding: EdgeInsets.fromLTRB(gutter, Sp.md, gutter, Sp.xl),
              children: [
                if (_failed) NovigoOfflineBanner(onRetry: _load),
                if (firstLoad)
                  for (var i = 0; i < 3; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    const NovigoSkeleton(height: 84, radius: R.lg),
                  ]
                else if (_conversations.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: Sp.xxl),
                    child: NovigoEmptyState.empty(
                      icon: Icons.forum_outlined,
                      title: 'Aucun message',
                      message:
                          'Vos échanges avec les coursiers, les commerces et le support arriveront ici.',
                    ),
                  )
                else
                  for (var i = 0; i < _conversations.length; i++) ...[
                    if (i > 0) const SizedBox(height: Sp.md),
                    FadeSlideIn(index: i, child: _tile(context, _conversations[i])),
                  ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, _Conversation c) => NovigoCard(
        padding: const EdgeInsets.all(Sp.md + 2),
        semanticLabel: '${c.title}, ${c.lastMessage}, ${c.time}'
            '${c.unread > 0 ? ', ${c.unread} non lus' : ''}',
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => ChatThreadScreen(title: c.title, conversationId: c.conversationId))),
        child: Row(children: [
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(c.initials,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                      child: Text(c.title,
                          style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  const SizedBox(width: 8),
                  Text(c.time,
                      style: const TextStyle(color: NC.faint, fontSize: 12, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 4),
                Row(children: [
                  Expanded(
                    child: Text(c.lastMessage,
                        style: TextStyle(
                            color: c.unread > 0 ? NC.ink : NC.muted,
                            fontSize: 13.5,
                            fontWeight: c.unread > 0 ? FontWeight.w600 : FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                  if (c.unread > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      constraints: const BoxConstraints(minWidth: 20),
                      height: 20,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(color: NC.brand, borderRadius: BorderRadius.circular(R.pill)),
                      alignment: Alignment.center,
                      child: Text('${c.unread}',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ]),
              ]),
            ),
          ]),
      );
}

class _Message {
  final String text;
  final bool mine;
  final String time;
  const _Message(this.text, this.mine, this.time);
}

/// Fil de discussion — bulles gauche/droite. En live (conversationId fourni),
/// charge l'historique, envoie via l'API et reçoit les messages en temps réel.
class ChatThreadScreen extends StatefulWidget {
  final String title;
  final String? conversationId;
  const ChatThreadScreen({super.key, required this.title, this.conversationId});

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scroll = ScrollController();
  final RealtimeClient _realtime = RealtimeClient();

  bool get _live => NovigoEnv.live && widget.conversationId != null;
  bool _sending = false;

  final List<_Message> _messages = [
    const _Message('Bonjour, je viens de récupérer votre commande.', false, '17:38'),
    const _Message('Super, merci ! Vous en avez pour combien de temps ?', true, '17:39'),
    const _Message('Environ 10 minutes, il y a un peu de circulation à Bamako.', false, '17:40'),
    const _Message('Pas de souci, je vous attends devant le portail bleu.', true, '17:41'),
    const _Message('Je suis à 3 minutes, je vous appelle en arrivant.', false, '17:42'),
  ];

  @override
  void initState() {
    super.initState();
    if (_live) _initLive();
  }

  Future<void> _initLive() async {
    try {
      final msgs = await chatApi.messages(widget.conversationId!);
      if (!mounted) return;
      setState(() {
        _messages
          ..clear()
          ..addAll(msgs.map((m) => _Message(m.text, m.mine, m.time)));
      });
      _scrollToEnd();
    } catch (_) {
      // repli : garde le fil mock
    }
    // Abonnement temps réel : les messages des autres participants arrivent en push.
    _realtime.joinConversation(widget.conversationId!, onMessage: (data) {
      if (!mounted) return;
      final m = MessageDto.fromJson(data);
      if (m.mine) return; // l'écho de nos propres envois est déjà affiché
      setState(() => _messages.add(_Message(m.text, m.mine, m.time)));
      _scrollToEnd();
    });
  }

  @override
  void dispose() {
    _realtime.dispose();
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _messages.add(_Message(text, true, 'maintenant'));
      _controller.clear();
    });
    _scrollToEnd();
    if (_live) {
      setState(() => _sending = true);
      try {
        await chatApi.send(widget.conversationId!, text);
      } catch (_) {
        // best-effort : le message reste affiché localement
      } finally {
        if (mounted) setState(() => _sending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(_initials(widget.title),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title,
                      style: T.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const Text('En ligne',
                      style: TextStyle(color: NC.success, fontSize: 12, fontWeight: FontWeight.w600)),
                ]),
          ),
        ]),
        actions: const [
          Icon(Icons.call_outlined, color: NC.ink),
          SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Column(children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              itemCount: _messages.length,
              itemBuilder: (context, i) => _bubble(_messages[i]),
            ),
          ),
          _composer(),
        ]),
      ),
    );
  }

  Widget _bubble(_Message m) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          mainAxisAlignment: m.mine ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.74),
                decoration: BoxDecoration(
                  color: m.mine ? NC.brand : NC.brandSoft,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(m.mine ? 16 : 4),
                    bottomRight: Radius.circular(m.mine ? 4 : 16),
                  ),
                ),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(m.text,
                          style: TextStyle(
                              color: m.mine ? Colors.white : NC.ink,
                              fontSize: 14.5,
                              height: 1.3,
                              fontWeight: FontWeight.w500)),
                      const SizedBox(height: 3),
                      Text(m.time,
                          style: TextStyle(
                              color: m.mine ? Colors.white70 : NC.faint,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600)),
                    ]),
              ),
            ),
          ],
        ),
      );

  Widget _composer() => Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        decoration: const BoxDecoration(
          color: NC.paper,
          border: Border(top: BorderSide(color: NC.line)),
        ),
        child: Row(children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                  color: NC.surfaceAlt, borderRadius: BorderRadius.circular(24)),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _controller,
                style: const TextStyle(color: NC.ink, fontSize: 15),
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: const InputDecoration(
                  hintText: 'Votre message…',
                  hintStyle: TextStyle(color: NC.faint),
                  border: InputBorder.none,
                  isCollapsed: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: _send,
            child: Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(gradient: NC.brandGradient, shape: BoxShape.circle),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ]),
      );

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) {
      return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
