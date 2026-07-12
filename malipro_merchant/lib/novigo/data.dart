import 'package:flutter/material.dart';
import 'theme.dart';
import 'models.dart';

/// Identité de la boutique marchand (démo).
class Shop {
  static const name = 'Aux Trois Fleuves';
  static const initials = 'AF';
  static const category = 'Restaurant · Café';
  static const district = 'Badalabougou';
  static const phone = '+223 76 12 34 56';
  static const rating = 4.7;
  static const reviews = 428;
}

/// Ventes de la semaine (Lun→Dim), en milliers de FCFA — pour le mini-graphe.
const List<double> weekSales = [42, 58, 51, 67, 73, 88, 61];
const List<String> weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/// Commandes mock du jour.
List<MOrder> seedOrders() => [
      MOrder(
        id: 'MP-100312',
        customerName: 'Youssouf Tounkara',
        customerInitials: 'YT',
        itemsLabel: '2× Yassa poulet, 1× Bissap',
        itemCount: 3,
        total: 5100,
        whenLabel: 'il y a 2 min',
        status: MStatus.nouvelle,
        items: ['2× Yassa poulet — 2 700 FCFA', '1× Bissap maison — 800 FCFA', 'Note : bien épicé svp'],
      ),
      MOrder(
        id: 'MP-100311',
        customerName: 'Aïcha Diallo',
        customerInitials: 'AD',
        itemsLabel: '1× Tiéboudienne, 1× Jus de gingembre',
        itemCount: 2,
        total: 4300,
        whenLabel: 'il y a 4 min',
        status: MStatus.nouvelle,
        items: ['1× Tiéboudienne — 3 500 FCFA', '1× Jus de gingembre — 800 FCFA'],
      ),
      MOrder(
        id: 'MP-100309',
        customerName: 'Fatoumata Traoré',
        customerInitials: 'FT',
        itemsLabel: '1× Mafé bœuf, 1× Alloco, 1× Sucrerie',
        itemCount: 3,
        total: 4600,
        whenLabel: 'il y a 9 min',
        status: MStatus.preparation,
        items: ['1× Mafé bœuf — 2 800 FCFA', '1× Alloco — 1 000 FCFA', '1× Sucrerie — 800 FCFA'],
      ),
      MOrder(
        id: 'MP-100307',
        customerName: 'Ibrahim Coulibaly',
        customerInitials: 'IC',
        itemsLabel: '2× Poulet braisé, 1× Frites',
        itemCount: 3,
        total: 6400,
        whenLabel: 'il y a 12 min',
        status: MStatus.preparation,
        items: ['2× Poulet braisé — 5 000 FCFA', '1× Frites maison — 1 400 FCFA'],
      ),
      MOrder(
        id: 'MP-100305',
        customerName: 'Mariam Keïta',
        customerInitials: 'MK',
        itemsLabel: '1× Capitaine braisé, 1× Bissap',
        itemCount: 2,
        total: 4300,
        whenLabel: 'il y a 18 min',
        status: MStatus.prete,
        items: ['1× Capitaine braisé — 3 500 FCFA', '1× Bissap maison — 800 FCFA'],
      ),
      MOrder(
        id: 'MP-100301',
        customerName: 'Modibo Sissoko',
        customerInitials: 'MS',
        itemsLabel: '1× Riz gras, 1× Salade, 1× Café',
        itemCount: 3,
        total: 3600,
        whenLabel: 'il y a 41 min',
        status: MStatus.terminee,
        items: ['1× Riz gras — 2 200 FCFA', '1× Salade fraîcheur — 900 FCFA', '1× Café touba — 500 FCFA'],
      ),
      MOrder(
        id: 'MP-100298',
        customerName: 'Kadiatou Cissé',
        customerInitials: 'KC',
        itemsLabel: '2× Yassa poisson, 2× Bissap',
        itemCount: 4,
        total: 7000,
        whenLabel: 'il y a 58 min',
        status: MStatus.terminee,
        items: ['2× Yassa poisson — 5 400 FCFA', '2× Bissap maison — 1 600 FCFA'],
      ),
      MOrder(
        id: 'MP-100295',
        customerName: 'Oumar Diarra',
        customerInitials: 'OD',
        itemsLabel: '1× Mafé bœuf, 1× Beignets',
        itemCount: 2,
        total: 3600,
        whenLabel: 'il y a 1 h',
        status: MStatus.terminee,
        items: ['1× Mafé bœuf — 2 800 FCFA', '1× Beignets sucrés — 800 FCFA'],
      ),
    ];

/// Menu mock (plats maliens + boissons).
List<MProduct> seedProducts() => [
      // Entrées
      MProduct(id: 'p-salade', name: 'Salade fraîcheur', section: 'Entrées', price: 900, icon: Icons.eco_rounded, tone: NC.success),
      MProduct(id: 'p-beignets', name: 'Beignets de mil', section: 'Entrées', price: 800, icon: Icons.bakery_dining_rounded, tone: NC.gold),
      MProduct(id: 'p-samsa', name: 'Samsa légumes', section: 'Entrées', price: 1200, icon: Icons.lunch_dining_rounded, tone: NC.warning),
      // Plats
      MProduct(id: 'p-tiebou', name: 'Tiéboudienne', section: 'Plats', price: 3500, icon: Icons.rice_bowl_rounded, tone: NC.brand),
      MProduct(id: 'p-yassa', name: 'Yassa poulet', section: 'Plats', price: 2700, icon: Icons.dinner_dining_rounded, tone: NC.brandLight),
      MProduct(id: 'p-mafe', name: 'Mafé bœuf', section: 'Plats', price: 2800, icon: Icons.set_meal_rounded, tone: NC.warning),
      MProduct(id: 'p-capitaine', name: 'Capitaine braisé', section: 'Plats', price: 3500, icon: Icons.set_meal_outlined, tone: NC.info),
      MProduct(id: 'p-poulet', name: 'Poulet braisé', section: 'Plats', price: 2500, icon: Icons.outdoor_grill_rounded, tone: NC.brand),
      MProduct(id: 'p-alloco', name: 'Alloco', section: 'Plats', price: 1000, icon: Icons.local_pizza_rounded, tone: NC.gold),
      MProduct(id: 'p-rizgras', name: 'Riz gras', section: 'Plats', price: 2200, icon: Icons.ramen_dining_rounded, tone: NC.violet),
      // Boissons
      MProduct(id: 'p-bissap', name: 'Bissap maison', section: 'Boissons', price: 800, icon: Icons.local_bar_rounded, tone: NC.brand),
      MProduct(id: 'p-gingembre', name: 'Jus de gingembre', section: 'Boissons', price: 800, icon: Icons.local_drink_rounded, tone: NC.gold),
      MProduct(id: 'p-cafe', name: 'Café touba', section: 'Boissons', price: 500, icon: Icons.coffee_rounded, tone: NC.warning),
      // Desserts
      MProduct(id: 'p-degue', name: 'Dèguè', section: 'Desserts', price: 1000, icon: Icons.icecream_rounded, tone: NC.violet),
      MProduct(id: 'p-thiakry', name: 'Thiakry', section: 'Desserts', price: 1200, icon: Icons.cake_rounded, tone: NC.brandLight),
    ];
