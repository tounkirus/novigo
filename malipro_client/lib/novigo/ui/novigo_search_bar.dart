import 'package:flutter/material.dart';

import '../motion.dart';
import 'tokens.dart';

/// Barre de recherche NOVIGO.
///
/// Deux usages, un seul composant :
///  • `NovigoSearchBar` (par défaut) = pastille inerte posée sur l'accueil ou en
///    tête d'une catégorie, qui ouvre l'écran de recherche ;
///  • `NovigoSearchBar.field` = champ réellement saisissable.
///
/// La séparation évite le piège classique du champ actif sur une page qui
/// défile : le clavier s'ouvre au moindre effleurement pendant le scroll.
class NovigoSearchBar extends StatelessWidget {
  final String hint;
  final VoidCallback? onTap;
  final VoidCallback? onVoice;

  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final bool editable;
  final Widget? leading;

  const NovigoSearchBar({
    super.key,
    this.hint = 'Que recherchez-vous aujourd\'hui ?',
    this.onTap,
    this.onVoice,
    this.leading,
  })  : controller = null,
        onChanged = null,
        onSubmitted = null,
        autofocus = false,
        editable = false;

  const NovigoSearchBar.field({
    super.key,
    this.hint = 'Que recherchez-vous aujourd\'hui ?',
    required this.controller,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = true,
    this.onVoice,
    this.leading,
  })  : onTap = null,
        editable = true;

  @override
  Widget build(BuildContext context) {
    final body = Container(
      height: 54,
      padding: const EdgeInsets.symmetric(horizontal: Sp.md),
      decoration: BoxDecoration(
        color: NC.surface,
        borderRadius: BorderRadius.circular(R.md),
        border: Border.all(color: NC.hairline),
        boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 14, offset: Offset(0, 6))],
      ),
      child: Row(children: [
        leading ??
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(color: NC.brandSoft, borderRadius: BorderRadius.circular(9)),
              child: const Icon(Icons.search_rounded, color: NC.brand, size: 19),
            ),
        const SizedBox(width: Sp.md - 1),
        Expanded(child: editable ? _field() : _hint()),
        if (onVoice != null) ...[
          const SizedBox(width: Sp.sm),
          Semantics(
            button: true,
            label: 'Recherche vocale',
            child: InkResponse(
              onTap: onVoice,
              radius: 24,
              child: const Padding(
                padding: EdgeInsets.all(Sp.sm),
                child: Icon(Icons.mic_none_rounded, color: NC.muted, size: 21),
              ),
            ),
          ),
        ],
      ]),
    );

    if (editable) return body;
    return Semantics(
      button: true,
      label: hint,
      child: PressableScale(onTap: onTap, scale: 0.985, child: body),
    );
  }

  Widget _hint() => Text(
        hint,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: NC.faint, fontSize: 15, fontWeight: FontWeight.w500),
      );

  Widget _field() => TextField(
        controller: controller,
        autofocus: autofocus,
        textInputAction: TextInputAction.search,
        style: const TextStyle(color: NC.ink, fontSize: 15, fontWeight: FontWeight.w500),
        cursorColor: NC.brand,
        decoration: InputDecoration(
          isCollapsed: true,
          border: InputBorder.none,
          hintText: hint,
          hintStyle: const TextStyle(color: NC.faint, fontSize: 15, fontWeight: FontWeight.w500),
        ),
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      );
}

/// Pastille de filtre / suggestion.
class NovigoChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final VoidCallback? onTap;
  final Color? tone;

  const NovigoChip({
    super.key,
    required this.label,
    this.icon,
    this.selected = false,
    this.onTap,
    this.tone,
  });

  @override
  Widget build(BuildContext context) {
    final accent = tone ?? NC.brand;
    return Semantics(
      button: onTap != null,
      selected: selected,
      label: label,
      child: PressableScale(
        onTap: onTap,
        child: AnimatedContainer(
          duration: M.fast,
          curve: M.ease,
          // 40 pt de haut : au-dessus du minimum tactile confortable.
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: Sp.lg),
          decoration: BoxDecoration(
            color: selected ? accent : NC.surface,
            borderRadius: BorderRadius.circular(R.pill),
            border: Border.all(color: selected ? accent : NC.hairline),
          ),
          alignment: Alignment.center,
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: selected ? Colors.white : accent),
              const SizedBox(width: Sp.xs + 2),
            ],
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : NC.ink,
                fontWeight: FontWeight.w700,
                fontSize: 13.5,
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Rail horizontal de pastilles de filtre, avec gouttière cohérente.
class NovigoChipRail extends StatelessWidget {
  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final EdgeInsetsGeometry padding;

  const NovigoChipRail({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onSelected,
    this.padding = const EdgeInsets.symmetric(horizontal: Sp.gutter),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding,
        itemCount: labels.length,
        separatorBuilder: (_, __) => const SizedBox(width: Sp.sm),
        itemBuilder: (_, i) => Center(
          child: NovigoChip(
            label: labels[i],
            selected: i == selectedIndex,
            onTap: () => onSelected(i),
          ),
        ),
      ),
    );
  }
}
