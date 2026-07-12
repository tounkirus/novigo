-- NOVIGO — SP10 : jeu de catalogue de démonstration (Postgres).
-- Le profil demo (H2) est peuplé par DemoSeeder ; les profils dev/preprod/prod
-- utilisent Postgres où DemoSeeder ne s'exécute pas. Cette migration rend le
-- catalogue immédiatement exploitable (mode FE "live") avec des données réalistes
-- de Bamako. Idempotente (ON CONFLICT) ; retirable pour un vrai environnement.

-- ---------- Géographie ----------
insert into countries (code, name, dial_code, currency) values
    ('ML', 'Mali', '+223', 'XOF')
on conflict (code) do nothing;

insert into cities (name, country_id, lat, lng)
select 'Bamako', c.id, 12.6392, -8.0029
from countries c
where c.code = 'ML'
  and not exists (select 1 from cities where name = 'Bamako');

-- ---------- Catégories (codes alignés sur l'enum StoreCategory du front) ----------
insert into categories (code, label, icon, vertical) values
    ('RESTAURANT', 'Restaurants',   'UtensilsCrossed', 'FOOD'),
    ('SUPERMARKET','Supermarchés',  'ShoppingCart',    'GROCERY'),
    ('PHARMACY',   'Pharmacies',    'Cross',           'PHARMACY'),
    ('BAKERY',     'Boulangeries',  'Croissant',       'FOOD'),
    ('BUTCHER',    'Boucheries',    'Beef',            'MARKET'),
    ('MARKET',     'Marchés',       'Store',           'MARKET'),
    ('SHOP',       'Boutiques',     'ShoppingBag',     'SERVICES')
on conflict (code) do nothing;

-- ---------- Boutiques ----------
-- city_id résolu via la ville Bamako ; images picsum déterministes (host autorisé côté FE).
insert into stores (slug, name, category, city_id, district, address, phone, lat, lng,
                    rating, review_count, is_open, delivery_fee, delivery_time_min,
                    cover_url, logo_url, status)
select v.slug, v.name, v.category,
       (select id from cities where name = 'Bamako'),
       v.district, v.address, v.phone, v.lat, v.lng,
       v.rating, v.review_count, v.is_open, v.delivery_fee, v.delivery_time_min,
       'https://picsum.photos/seed/' || v.slug || '/800/600',
       'https://picsum.photos/seed/' || v.slug || '-logo/200/200',
       'APPROVED'
from (values
    ('le-bafing',        'Restaurant Le Bafing',      'RESTAURANT',  'Hamdallaye ACI 2000', 'Rue 390, ACI 2000',   '+22320210001', 12.6300, -8.0100, 4.7, 214, true,   500, 30),
    ('mama-teranga',     'Mama Teranga',              'RESTAURANT',  'Badalabougou',        'Av. de l''OUA',        '+22320210002', 12.6180, -7.9880, 4.5, 176, true,     0, 25),
    ('le-djoliba',       'Le Djoliba Grill',          'RESTAURANT',  'Niarela',             'Rue 15, Niarela',      '+22320210003', 12.6450, -7.9820, 4.4, 132, true,   750, 35),
    ('super-fourmi',     'Supermarché La Fourmi',     'SUPERMARKET', 'ACI 2000',            'Bd du 22 Octobre',     '+22320210004', 12.6350, -8.0200, 4.6, 320, true,   500, 40),
    ('azar-market',      'Azar Super Market',         'SUPERMARKET', 'Hippodrome',          'Rue 224, Hippodrome',  '+22320210005', 12.6520, -7.9900, 4.3, 210, true,   600, 45),
    ('pharma-plus',      'Pharmacie Plus',            'PHARMACY',    'Quinzambougou',       'Route de Sotuba',      '+22320210006', 12.6480, -7.9700, 4.8, 98,  true,     0, 20),
    ('pharma-koulouba',  'Pharmacie de Koulouba',     'PHARMACY',    'Koulouba',            'Colline du Pouvoir',   '+22320210007', 12.6250, -8.0050, 4.7, 76,  true,   400, 22),
    ('boulangerie-bko',  'Boulangerie du Fleuve',     'BAKERY',      'Missira',             'Rue 100, Missira',     '+22320210008', 12.6400, -7.9750, 4.5, 143, true,   300, 18),
    ('la-parisienne',    'La Parisienne',             'BAKERY',      'Bamako Coura',        'Av. Modibo Keita',     '+22320210009', 12.6480, -8.0000, 4.6, 187, true,     0, 20),
    ('boucherie-tounkara','Boucherie Tounkara',       'BUTCHER',     'Djélibougou',         'Rue 261, Djélibougou', '+22320210010', 12.6600, -7.9950, 4.4, 64,  true,   500, 30),
    ('marche-medine',    'Marché de Médine',          'MARKET',      'Médine',              'Grand Marché',         '+22320210011', 12.6520, -8.0020, 4.2, 240, true,   800, 50),
    ('boutique-faso',    'Boutique Faso Style',       'SHOP',        'ACI 2000',            'Bd du 22 Octobre',     '+22320210012', 12.6340, -8.0180, 4.5, 121, true,   700, 40)
) as v(slug, name, category, district, address, phone, lat, lng, rating, review_count, is_open, delivery_fee, delivery_time_min)
on conflict (slug) do nothing;

-- ---------- Produits ----------
-- Chaque produit référence sa boutique par slug ; catégorie liée par code.
insert into products (store_id, category_id, name, description, price, old_price, image_url,
                      available, is_best_seller, is_new, stock, menu_section)
select (select id from stores where slug = p.slug),
       (select id from categories where code = p.cat_code),
       p.name, p.description, p.price, p.old_price,
       'https://picsum.photos/seed/' || p.slug || '-' || p.pkey || '/500/500',
       true, p.best_seller, p.is_new, p.stock, p.menu_section
from (values
    -- Le Bafing (restaurant)
    ('le-bafing','bafing-tiep',   'RESTAURANT','Tiep bou dien',        'Riz au poisson à la malienne', 2500, null,  true, false, 60, 'Plats'),
    ('le-bafing','bafing-yassa',  'RESTAURANT','Poulet Yassa',         'Poulet mariné oignon citron',  3000, 3500,  true, false, 45, 'Plats'),
    ('le-bafing','bafing-jus',    'RESTAURANT','Jus de bissap',        'Boisson hibiscus maison',       500, null,  false, true, 100,'Boissons'),
    ('le-bafing','bafing-cap',    'RESTAURANT','Capitaine braisé',     'Poisson capitaine grillé',     4500, null,  true, false, 30, 'Plats'),
    -- Mama Teranga
    ('mama-teranga','mt-mafe',    'RESTAURANT','Mafé bœuf',            'Sauce arachide et bœuf',       2800, null,  true, false, 50, 'Plats'),
    ('mama-teranga','mt-atieke',  'RESTAURANT','Attiéké poisson',      'Semoule de manioc, poisson',   2200, null,  false,true, 40, 'Plats'),
    ('mama-teranga','mt-degue',   'RESTAURANT','Dèguè',                'Dessert mil et lait caillé',    800, null,  false,false,60, 'Desserts'),
    -- Le Djoliba Grill
    ('le-djoliba','dj-brochette', 'RESTAURANT','Brochettes de bœuf',   'Brochettes grillées x5',       2000, null,  true, false, 70, 'Grillades'),
    ('le-djoliba','dj-poulet',    'RESTAURANT','Demi-poulet braisé',   'Poulet braisé alloco',         3500, null,  true, false, 35, 'Grillades'),
    -- Supermarché La Fourmi
    ('super-fourmi','sf-riz',     'SUPERMARKET','Riz parfumé 5kg',     'Sac de riz importé',           6500, 7000,  true, true,  200,'Épicerie'),
    ('super-fourmi','sf-huile',   'SUPERMARKET','Huile végétale 5L',   'Bidon huile de cuisine',       6000, null,  true, false, 150,'Épicerie'),
    ('super-fourmi','sf-lait',    'SUPERMARKET','Lait en poudre 900g',  'Boîte lait entier',           4500, null,  true, false, 120,'Crèmerie'),
    -- Azar Super Market
    ('azar-market','az-eau',      'SUPERMARKET','Pack eau minérale',   'Pack de 6 bouteilles 1,5L',    1500, null,  true, false, 300,'Boissons'),
    ('azar-market','az-cafe',     'SUPERMARKET','Café soluble 200g',   'Bocal café instantané',        3200, null,  true, false, 80, 'Épicerie'),
    -- Pharmacie Plus
    ('pharma-plus','pp-para',     'PHARMACY','Paracétamol 500mg',      'Boîte de 20 comprimés',         800, null,  true, false, 500,'Médicaments'),
    ('pharma-plus','pp-vitc',     'PHARMACY','Vitamine C 1000',        'Tube 20 comprimés effervescents',1200,null, true, true,  400,'Compléments'),
    -- Pharmacie de Koulouba
    ('pharma-koulouba','pk-alco', 'PHARMACY','Gel hydroalcoolique',    'Flacon 500ml',                 2500, null,  true, false, 200,'Hygiène'),
    -- Boulangerie du Fleuve
    ('boulangerie-bko','bb-baguette','BAKERY','Baguette tradition',    'Pain frais du jour',            250, null,  true, true,  400,'Pains'),
    ('boulangerie-bko','bb-croiss','BAKERY','Croissant au beurre',     'Viennoiserie pur beurre',       400, null,  true, false, 200,'Viennoiseries'),
    -- La Parisienne
    ('la-parisienne','lp-gateau', 'BAKERY','Gâteau au chocolat',       'Part de gâteau maison',         1500, null,  true, false, 60, 'Pâtisseries'),
    -- Boucherie Tounkara
    ('boucherie-tounkara','bt-boeuf','BUTCHER','Viande de bœuf 1kg',   'Bœuf local découpé',           3500, null,  true, false, 100,'Boucherie'),
    ('boucherie-tounkara','bt-mouton','BUTCHER','Gigot de mouton',     'Mouton frais au kilo',         4500, null,  true, true,  50, 'Boucherie'),
    -- Marché de Médine
    ('marche-medine','mm-mangue', 'MARKET','Mangues Kent (kg)',        'Mangues mûres du pays',         600, null,  true, false, 300,'Fruits'),
    ('marche-medine','mm-tomate', 'MARKET','Tomates fraîches (kg)',    'Tomates du maraîcher',          500, null,  true, false, 250,'Légumes'),
    -- Boutique Faso Style
    ('boutique-faso','bf-bogolan','SHOP','Tissu Bogolan',              'Étoffe traditionnelle malienne',8000, null, true, true,  40, 'Textile'),
    ('boutique-faso','bf-sac',    'SHOP','Sac artisanal cuir',          'Sac fait main en cuir',       12000,15000, true, false, 25, 'Accessoires')
) as p(slug, pkey, cat_code, name, description, price, old_price, best_seller, is_new, stock, menu_section)
where exists (select 1 from stores where slug = p.slug)
on conflict do nothing;
