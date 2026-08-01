/// Services à domicile — point d'entrée.
///
/// Le parcours (hub → métier → prestataire → réservation → interventions) tenait
/// dans un seul fichier de 1 286 lignes qui mélangeait les modèles, le jeu de
/// données de démonstration, le client HTTP et cinq écrans. Il est désormais
/// éclaté dans `data/services_model.dart` et `screens/home_services/`, et ce
/// fichier ne sert plus qu'à réexporter l'ensemble : aucun import existant n'a
/// eu besoin d'être modifié ailleurs dans l'application.
library;

export '../data/services_model.dart';
export 'home_services/booking.dart' show HsBookingScreen;
export 'home_services/hub.dart' show HomeServicesScreen;
export 'home_services/interventions.dart' show HsInterventionsScreen;
export 'home_services/provider.dart' show HsProviderScreen;
export 'home_services/trade.dart' show HsCategoryScreen;
export 'home_services/widgets.dart' show HsAvatar, HsProviderCard, hsInitials;
