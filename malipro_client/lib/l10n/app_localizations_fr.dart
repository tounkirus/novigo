// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'NOVIGO';

  @override
  String get login => 'Connexion';

  @override
  String get phone => 'Téléphone';

  @override
  String get sendCode => 'Recevoir le code';

  @override
  String get otpTitle => 'Vérification';

  @override
  String get verify => 'Vérifier';

  @override
  String get catalog => 'Catalogue';

  @override
  String get cart => 'Panier';

  @override
  String get orders => 'Commandes';

  @override
  String get wallet => 'Portefeuille';

  @override
  String get account => 'Compte';

  @override
  String get checkout => 'Commander';

  @override
  String get payWithWallet => 'Payer avec le wallet';

  @override
  String get total => 'Total';

  @override
  String get emptyCart => 'Votre panier est vide';

  @override
  String get addToCart => 'Ajouter';
}
