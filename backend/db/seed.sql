-- ====================================================================
-- SMART BUSINESS ASSISTANT - Données de démonstration (Seed)
-- ====================================================================
-- Compte démo : demo@smartbusiness.com / demo123
-- Les données métier de chaque utilisateur sont SCOPÉES par user_id.
-- ====================================================================

-- ===================== UTILISATEURS =====================
-- Note : le hash bcrypt correspond à "demo123" (10 rounds).
INSERT INTO users (name, email, password_hash, company, role) VALUES
('Admin Demo', 'demo@smartbusiness.com', '$2a$10$pkdmXPXhmR3uhhR4NFBF1ez1/TuWxQIo/IAdDGbN1gVkToyvJoAli', 'SmartBiz SARL', 'admin'),
('Karim Khali', 'karim@boutique.dz', '$2a$10$pkdmXPXhmR3uhhR4NFBF1ez1/TuWxQIo/IAdDGbN1gVkToyvJoAli', 'Boutique El Karama', 'user'),
('Sophie Martin', 'sophie@martinedz.com', '$2a$10$pkdmXPXhmR3uhhR4NFBF1ez1/TuWxQIo/IAdDGbN1gVkToyvJoAli', 'Martin Boutique', 'user');

-- ===================== PRODUITS — USER 1 (Admin Demo) =====================
INSERT INTO products (user_id, name, category, price, stock, sold, revenue, trend, description) VALUES
(1, 'iPhone 14 Pro', 'Électronique', 1299.00, 45, 128, 166272.00, 12.4, 'Smartphone haut de gamme Apple, écran Super Retina XDR'),
(1, 'Samsung Galaxy S23', 'Électronique', 999.00, 32, 95, 94905.00, 8.2, 'Smartphone premium Samsung avec caméra 200MP'),
(1, 'MacBook Air M2', 'Électronique', 1599.00, 8, 67, 107133.00, 22.1, 'Ordinateur portable Apple avec puce M2, 8GB RAM'),
(1, 'AirPods Pro', 'Électronique', 279.00, 120, 210, 58590.00, 5.7, 'Écouteurs sans fil avec réduction de bruit active'),
(1, 'Jean Slim Homme', 'Vêtements', 79.00, 245, 189, 14931.00, -3.2, 'Jeans slim fit confortable, plusieurs tailles'),
(1, 'Robe Été Femme', 'Vêtements', 59.00, 180, 320, 18880.00, 15.8, 'Robe légère parfaite pour l''été'),
(1, 'Sneakers Running', 'Sport', 129.00, 5, 145, 18705.00, -8.5, 'Chaussures de course avec semelle anti-dérapante'),
(1, 'Café Premium 500g', 'Alimentation', 18.00, 0, 890, 16020.00, -15.3, 'Café arabica torréfié, premium qualité'),
(1, 'Huile d''Olive Bio', 'Alimentation', 12.00, 340, 567, 6804.00, 2.1, 'Huile d''olive extra vierge issue de l''agriculture biologique'),
(1, 'Canapé Moderne', 'Maison', 899.00, 15, 28, 25172.00, 6.3, 'Canapé 3 places design scandinave, tissu gris'),
(1, 'Lampe de Bureau LED', 'Maison', 49.00, 0, 450, 22050.00, -25.0, 'Lampe LED réglable avec port USB'),
(1, 'Tapis de Yoga', 'Sport', 35.00, 210, 380, 13300.00, 18.9, 'Tapis antidérapant écologique, 6mm d''épaisseur');

-- ===================== PRODUITS — USER 2 (Karim) =====================
INSERT INTO products (user_id, name, category, price, stock, sold, revenue, trend, description) VALUES
(2, 'Chemise Coton Homme', 'Vêtements', 45.00, 120, 60, 2700.00, 4.1, 'Chemise en coton bio, coupe classique'),
(2, 'Parfum Orient 100ml', 'Maison', 250.00, 18, 42, 10500.00, 9.7, 'Parfum oriental boisé, grande tenue'),
(2, 'Sac à Main Cuir', 'Vêtements', 320.00, 6, 25, 8000.00, -2.3, 'Sac à main en cuir véritable');

-- ===================== PRODUITS — USER 3 (Sophie) =====================
INSERT INTO products (user_id, name, category, price, stock, sold, revenue, trend, description) VALUES
(3, 'Thé Vert Bio 250g', 'Alimentation', 15.00, 90, 210, 3150.00, 11.2, 'Thé vert premium en vrac'),
(3, 'Bougie Lavande', 'Maison', 22.00, 55, 130, 2860.00, 6.5, 'Bougie artisanale parfum lavande'),
(3, 'Carnet Cuir A5', 'Autre', 35.00, 200, 95, 3325.00, 3.0, 'Carnet de notes relié cuir');

-- ===================== OBJECTIFS MENSUELS 2024 — USER 1 =====================
INSERT INTO monthly_targets (user_id, month, target, actual, year, month_num) VALUES
(1, '2024-01', 45000, 42000, 2024, 1),
(1, '2024-02', 45000, 38500, 2024, 2),
(1, '2024-03', 48000, 51200, 2024, 3),
(1, '2024-04', 48000, 47800, 2024, 4),
(1, '2024-05', 50000, 55300, 2024, 5),
(1, '2024-06', 55000, 62100, 2024, 6),
(1, '2024-07', 55000, 58900, 2024, 7),
(1, '2024-08', 52000, 49700, 2024, 8),
(1, '2024-09', 58000, 63400, 2024, 9),
(1, '2024-10', 65000, 71200, 2024, 10),
(1, '2024-11', 75000, 84500, 2024, 11),
(1, '2024-12', 85000, 92300, 2024, 12);

-- ===================== OBJECTIFS MENSUELS 2024 — USER 2 =====================
INSERT INTO monthly_targets (user_id, month, target, actual, year, month_num) VALUES
(2, '2024-01', 20000, 18000, 2024, 1),
(2, '2024-02', 22000, 21000, 2024, 2),
(2, '2024-03', 24000, 26800, 2024, 3),
(2, '2024-04', 24000, 23300, 2024, 4),
(2, '2024-05', 25000, 29700, 2024, 5),
(2, '2024-06', 26000, 24500, 2024, 6);

-- ===================== OBJECTIFS MENSUELS 2024 — USER 3 =====================
INSERT INTO monthly_targets (user_id, month, target, actual, year, month_num) VALUES
(3, '2024-01', 8000, 7500, 2024, 1),
(3, '2024-02', 9000, 8600, 2024, 2),
(3, '2024-03', 10000, 12400, 2024, 3),
(3, '2024-04', 10000, 9800, 2024, 4),
(3, '2024-05', 11000, 13600, 2024, 5),
(3, '2024-06', 12000, 11800, 2024, 6);

-- ===================== VENTES — USER 1 (2024) =====================
INSERT INTO sales (user_id, product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(1, 1, '2024-01-05', 2, 1299.00, 'Karim Khali', 'carte'),
(1, 4, '2024-01-08', 5, 279.00, 'Sophie Martin', 'espèces'),
(1, 5, '2024-01-12', 8, 79.00, 'Pierre Moreau', 'carte'),
(1, 8, '2024-01-15', 30, 18.00, 'Jean Lefebvre', 'virement'),
(1, 2, '2024-01-20', 3, 999.00, 'Marie Lambert', 'carte'),
(1, 12, '2024-01-25', 12, 35.00, 'Léa Rousseau', 'carte'),
(1, 9, '2024-01-28', 50, 12.00, 'Nathalie Bernard', 'virement'),
(1, 3, '2024-02-03', 2, 1599.00, 'Fatima Alaoui', 'carte'),
(1, 6, '2024-02-07', 15, 59.00, 'Thomas Petit', 'espèces'),
(1, 7, '2024-02-12', 7, 129.00, 'Ahmed Benali', 'carte'),
(1, 8, '2024-02-15', 25, 18.00, 'Karim Khali', 'carte'),
(1, 4, '2024-02-20', 8, 279.00, 'Pierre Moreau', 'carte'),
(1, 1, '2024-02-28', 4, 1299.00, 'Sophie Martin', 'carte'),
(1, 1, '2024-03-05', 8, 1299.00, 'Jean-Paul Lebrun', 'carte'),
(1, 3, '2024-03-10', 5, 1599.00, 'Nathalie Bernard', 'carte'),
(1, 6, '2024-03-15', 20, 59.00, 'Fatima Alaoui', 'espèces'),
(1, 10, '2024-03-18', 3, 899.00, 'Karim Khali', 'virement'),
(1, 11, '2024-03-22', 25, 49.00, 'Léa Rousseau', 'carte'),
(1, 2, '2024-03-28', 6, 999.00, 'Marie Lambert', 'carte'),
(1, 12, '2024-03-30', 22, 35.00, 'Thomas Petit', 'carte'),
(1, 4, '2024-04-05', 12, 279.00, 'Ahmed Benali', 'carte'),
(1, 8, '2024-04-10', 40, 18.00, 'Jean Lefebvre', 'espèces'),
(1, 5, '2024-04-15', 10, 79.00, 'Pierre Moreau', 'carte'),
(1, 7, '2024-04-22', 8, 129.00, 'Sophie Martin', 'carte'),
(1, 9, '2024-04-28', 60, 12.00, 'Karim Khali', 'virement'),
(1, 1, '2024-12-05', 15, 1299.00, 'Marie Lambert', 'carte'),
(1, 3, '2024-12-08', 10, 1599.00, 'Fatima Alaoui', 'carte'),
(1, 6, '2024-12-12', 50, 59.00, 'Pierre Moreau', 'espèces'),
(1, 4, '2024-12-15', 30, 279.00, 'Jean-Paul Lebrun', 'carte'),
(1, 2, '2024-12-20', 12, 999.00, 'Nathalie Bernard', 'carte'),
(1, 12, '2024-12-24', 40, 35.00, 'Léa Rousseau', 'carte'),
(1, 10, '2024-12-28', 5, 899.00, 'Karim Khali', 'virement'),
(1, 5, '2024-12-30', 20, 79.00, 'Thomas Petit', 'carte');

-- ===================== VENTES — USER 2 (2024) =====================
INSERT INTO sales (user_id, product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(2, 13, '2024-01-10', 5, 45.00, 'Omar Hadj', 'carte'),
(2, 14, '2024-01-15', 2, 250.00, 'Yasmine B.', 'espèces'),
(2, 15, '2024-02-05', 1, 320.00, 'Rachid K.', 'virement'),
(2, 13, '2024-02-12', 8, 45.00, 'Amine S.', 'carte'),
(2, 14, '2024-03-03', 3, 250.00, 'Lina T.', 'carte'),
(2, 15, '2024-03-20', 2, 320.00, 'Omar Hadj', 'carte');

-- ===================== VENTES — USER 3 (2024) =====================
INSERT INTO sales (user_id, product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(3, 16, '2024-01-08', 10, 15.00, 'Claire D.', 'carte'),
(3, 17, '2024-01-20', 6, 22.00, 'Marc F.', 'espèces'),
(3, 18, '2024-02-14', 4, 35.00, 'Julie P.', 'carte'),
(3, 16, '2024-02-25', 15, 15.00, 'Anna R.', 'carte'),
(3, 17, '2024-03-10', 8, 22.00, 'Claire D.', 'virement'),
(3, 18, '2024-03-28', 6, 35.00, 'Marc F.', 'carte');

-- ===================== AVIS CLIENTS — USER 1 =====================
INSERT INTO reviews (user_id, product_id, customer_name, rating, comment, sentiment, score, date) VALUES
(1, 1, 'Sophie Martin', 5, 'Excellent produit, livraison rapide et emballage parfait. Je recommande vivement !', 'positif', 0.95, '2024-03-15'),
(1, 5, 'Ahmed Benali', 2, 'Très déçu de la qualité, la couture s''est défaite après seulement 2 semaines d''utilisation.', 'négatif', 0.12, '2024-03-14'),
(1, 3, 'Marie Dupont', 5, 'Performance incroyable, batterie longue durée. Le meilleur ordinateur que j''aie jamais eu !', 'positif', 0.97, '2024-03-13'),
(1, 8, 'Jean-Paul Lebrun', 3, 'Café correct mais pas exceptionnel pour le prix. La livraison était dans les temps.', 'neutre', 0.52, '2024-03-12'),
(1, 6, 'Fatima Alaoui', 5, 'Magnifique robe, très belle coupe et tissu de qualité. J''en suis très satisfaite !', 'positif', 0.93, '2024-03-11'),
(1, 7, 'Pierre Moreau', 1, 'Totalement insatisfait. Produit non conforme à la description, taille incorrecte et service client inexistant.', 'négatif', 0.03, '2024-03-10'),
(1, 4, 'Léa Rousseau', 4, 'Très bon son et réduction de bruit efficace. Légers et confortables pour une utilisation prolongée.', 'positif', 0.82, '2024-03-09'),
(1, 12, 'Karim Khali', 5, 'Parfait pour mes séances de yoga quotidiennes, antidérapant et facile à nettoyer.', 'positif', 0.91, '2024-03-08'),
(1, 10, 'Nathalie Bernard', 3, 'Design sympa mais montage difficile. Instructions peu claires. Résultat final acceptable.', 'neutre', 0.48, '2024-03-07'),
(1, 2, 'Thomas Petit', 4, 'Très bon smartphone, caméra excellente. Juste un peu cher mais qualité au rendez-vous.', 'positif', 0.78, '2024-03-06');

-- ===================== AVIS CLIENTS — USER 2 =====================
INSERT INTO reviews (user_id, product_id, customer_name, rating, comment, sentiment, score, date) VALUES
(2, 14, 'Yasmine B.', 5, 'Parfum magnifique, tenue longue durée. Je recommande !', 'positif', 0.9, '2024-03-15'),
(2, 15, 'Rachid K.', 3, 'Bon cuir mais finition moyenne. Rapport qualité-prix correct.', 'neutre', 0.5, '2024-03-18'),
(2, 13, 'Amine S.', 4, 'Très bonne chemise, confortable et belle coupe.', 'positif', 0.75, '2024-03-20');

-- ===================== AVIS CLIENTS — USER 3 =====================
INSERT INTO reviews (user_id, product_id, customer_name, rating, comment, sentiment, score, date) VALUES
(3, 16, 'Anna R.', 5, 'Thé délicieux, arôme subtil. Emballage soigné.', 'positif', 0.88, '2024-03-14'),
(3, 17, 'Marc F.', 4, 'Bonne bougie, odeur agréable mais tenue moyenne.', 'positif', 0.72, '2024-03-16');

-- ===================== ANOMALIES — USER 1 =====================
INSERT INTO anomalies (user_id, type, severity, product_name, description, status, detected_at) VALUES
(1, 'baisse_ventes', 'haute', 'Café Premium 500g', 'Baisse de 15.3% des ventes sur 30 jours', 'non_résolu', '2024-03-15'),
(1, 'rupture_stock', 'critique', 'Café Premium 500g', 'Rupture de stock complète (0 unités)', 'non_résolu', '2024-03-14'),
(1, 'rupture_stock', 'critique', 'Lampe de Bureau LED', 'Rupture de stock (0 unités), baisse de 25% des ventes', 'non_résolu', '2024-03-13'),
(1, 'stock_faible', 'moyenne', 'MacBook Air M2', 'Stock critique : 8 unités restantes', 'en_cours', '2024-03-12'),
(1, 'stock_faible', 'moyenne', 'Sneakers Running', 'Stock faible : 5 unités restantes, forte demande', 'non_résolu', '2024-03-11'),
(1, 'avis_négatifs', 'haute', 'Sneakers Running', 'Augmentation des avis négatifs (25% de 1-2 étoiles)', 'en_cours', '2024-03-10');

-- ===================== ANOMALIES — USER 2 =====================
INSERT INTO anomalies (user_id, type, severity, product_name, description, status, detected_at) VALUES
(2, 'stock_faible', 'moyenne', 'Sac à Main Cuir', 'Stock faible : 6 unités restantes', 'non_résolu', '2024-03-12');

-- ===================== ANOMALIES — USER 3 =====================
INSERT INTO anomalies (user_id, type, severity, product_name, description, status, detected_at) VALUES
(3, 'baisse_ventes', 'basse', 'Carnet Cuir A5', 'Légère baisse des ventes mensuelles', 'non_résolu', '2024-03-14');

-- ===================== RECOMMANDATIONS — USER 1 =====================
INSERT INTO recommendations (user_id, priority, category, title, description, action, impact, icon) VALUES
(1, 'critique', 'stock', 'Réapprovisionner immédiatement le Café Premium 500g',
    'Rupture de stock détectée. Ce produit génère en moyenne 16 020 DA/mois. Chaque jour sans stock = perte estimée à 534 DA.',
    'Commander au moins 200 unités', '+16 000 DA/mois estimé', '📦'),
(1, 'critique', 'stock', 'Réapprovisionner la Lampe de Bureau LED',
    'Stock épuisé avec une tendance négative de -25%. Risque de perte de clientèle permanente.',
    'Commander 300 unités + analyser la qualité produit', '+22 050 DA/mois potentiel', '💡'),
(1, 'haute', 'promotion', 'Lancer une promotion sur les Sneakers Running',
    'Baisse de 8.5% des ventes + avis négatifs. Une promotion de 20% pourrait relancer les ventes et améliorer la perception.',
    'Promotion -20% + améliorer description produit', '+45% ventes estimé', '🏷️'),
(1, 'haute', 'service_client', 'Améliorer le service après-vente Sneakers Running',
    '25% d''avis négatifs liés à la taille et la conformité produit. Action urgente recommandée.',
    'Revoir guide des tailles + politique de retour', 'Satisfaction client +30%', '⭐'),
(1, 'moyenne', 'stock', 'Anticiper le réapprovisionnement MacBook Air M2',
    'Stock à 8 unités, tendance haussière de +22.1%. Risque de rupture dans 2-3 semaines.',
    'Commander 25 unités supplémentaires', 'Éviter une perte de 107 000 DA', '💻'),
(1, 'moyenne', 'promotion', 'Capitaliser sur le succès de la Robe Été Femme',
    'Croissance de +15.8%, forte satisfaction client (5/5). Opportunité d''augmenter la visibilité.',
    'Mettre en avant produit + upsell collection', '+25% revenus catégorie vêtements', '👗'),
(1, 'basse', 'analyse', 'Analyser la saisonnalité du Jean Slim Homme',
    'Légère baisse de -3.2% à analyser. Possible effet saisonnier à confirmer avec données historiques.',
    'Étudier tendances sur 12 mois + adapter stocks', 'Optimisation stocks estimée', '📊');

-- ===================== RECOMMANDATIONS — USER 2 =====================
INSERT INTO recommendations (user_id, priority, category, title, description, action, impact, icon) VALUES
(2, 'haute', 'stock', 'Réapprovisionner le Sac à Main Cuir',
    'Stock faible avec forte demande. Réapprovisionner rapidement pour éviter la rupture.',
    'Commander 15 unités', '+8 000 DA/mois potentiel', '👜'),
(2, 'moyenne', 'promotion', 'Promouvoir le Parfum Orient',
    'Bonne croissance des ventes, à mettre en avant en vitrine.',
    'Mise en avant produit', '+15% ventes estimé', '🌹');

-- ===================== RECOMMANDATIONS — USER 3 =====================
INSERT INTO recommendations (user_id, priority, category, title, description, action, impact, icon) VALUES
(3, 'basse', 'analyse', 'Analyser la saisonnalité du Thé Vert',
    'Croissance régulière. Étudier les pics saisonniers pour optimiser les achats.',
    'Étudier tendances 12 mois', 'Optimisation stocks', '🍵');

-- ===================== CACHE PRÉDICTIONS — USER 1 =====================
INSERT INTO predictions_cache (user_id, horizon_months, period, predicted_value, confidence, model_name) VALUES
(1, 6, '2025-01', 78500, 0.85, 'LinearRegression'),
(1, 6, '2025-02', 82000, 0.83, 'LinearRegression'),
(1, 6, '2025-03', 94500, 0.81, 'LinearRegression'),
(1, 6, '2025-04', 88200, 0.79, 'LinearRegression'),
(1, 6, '2025-05', 97800, 0.77, 'LinearRegression'),
(1, 6, '2025-06', 105400, 0.74, 'LinearRegression');

-- ====================================================================
-- FIN DU SEED
-- ====================================================================
