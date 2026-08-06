-- ====================================================================
-- SMART BUSINESS ASSISTANT - Données de démonstration (Seed)
-- ====================================================================
-- Compte démo : demo@smartbusiness.com / demo123
-- ====================================================================

-- ===================== UTILISATEUR DÉMO =====================
-- Note : Le mot de passe "demo123" hashé avec bcrypt (10 rounds)
INSERT INTO users (name, email, password_hash, company, role) VALUES
('Admin Demo', 'demo@smartbusiness.com', '$2a$10$rGYHRm3wmukx8nCQ.CR0Ne1qZRRTJH/cEqAW0LcI3KFLWS9YKLkku', 'SmartBiz SARL', 'admin'),
('Karim Khali', 'karim@boutique.dz', '$2a$10$rGYHRm3wmukx8nCQ.CR0Ne1qZRRTJH/cEqAW0LcI3KFLWS9YKLkku', 'Boutique El Karama', 'user'),
('Sophie Martin', 'sophie@martinedz.com', '$2a$10$rGYHRm3wmukx8nCQ.CR0Ne1qZRRTJH/cEqAW0LcI3KFLWS9YKLkku', 'Martin Boutique', 'user');

-- ===================== PRODUITS =====================
INSERT INTO products (name, category, price, stock, sold, revenue, trend, description) VALUES
('iPhone 14 Pro', 'Électronique', 1299.00, 45, 128, 166272.00, 12.4, 'Smartphone haut de gamme Apple, écran Super Retina XDR'),
('Samsung Galaxy S23', 'Électronique', 999.00, 32, 95, 94905.00, 8.2, 'Smartphone premium Samsung avec caméra 200MP'),
('MacBook Air M2', 'Électronique', 1599.00, 8, 67, 107133.00, 22.1, 'Ordinateur portable Apple avec puce M2, 8GB RAM'),
('AirPods Pro', 'Électronique', 279.00, 120, 210, 58590.00, 5.7, 'Écouteurs sans fil avec réduction de bruit active'),
('Jean Slim Homme', 'Vêtements', 79.00, 245, 189, 14931.00, -3.2, 'Jeans slim fit confortable, plusieurs tailles'),
('Robe Été Femme', 'Vêtements', 59.00, 180, 320, 18880.00, 15.8, 'Robe légère parfaite pour l''été'),
('Sneakers Running', 'Sport', 129.00, 5, 145, 18705.00, -8.5, 'Chaussures de course avec semelle anti-dérapante'),
('Café Premium 500g', 'Alimentation', 18.00, 0, 890, 16020.00, -15.3, 'Café arabica torréfié, premium qualité'),
('Huile d''Olive Bio', 'Alimentation', 12.00, 340, 567, 6804.00, 2.1, 'Huile d''olive extra vierge issue de l''agriculture biologique'),
('Canapé Moderne', 'Maison', 899.00, 15, 28, 25172.00, 6.3, 'Canapé 3 places design scandinave, tissu gris'),
('Lampe de Bureau LED', 'Maison', 49.00, 0, 450, 22050.00, -25.0, 'Lampe LED réglable avec port USB'),
('Tapis de Yoga', 'Sport', 35.00, 210, 380, 13300.00, 18.9, 'Tapis antidérapant écologique, 6mm d''épaisseur');

-- ===================== OBJECTIFS MENSUELS 2024 =====================
INSERT INTO monthly_targets (month, target, actual, year, month_num) VALUES
('2024-01', 45000, 42000, 2024, 1),
('2024-02', 45000, 38500, 2024, 2),
('2024-03', 48000, 51200, 2024, 3),
('2024-04', 48000, 47800, 2024, 4),
('2024-05', 50000, 55300, 2024, 5),
('2024-06', 55000, 62100, 2024, 6),
('2024-07', 55000, 58900, 2024, 7),
('2024-08', 52000, 49700, 2024, 8),
('2024-09', 58000, 63400, 2024, 9),
('2024-10', 65000, 71200, 2024, 10),
('2024-11', 75000, 84500, 2024, 11),
('2024-12', 85000, 92300, 2024, 12);

-- ===================== VENTES (transactions réelles - 2024) =====================
-- Ventes pour Janvier 2024
INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(1, '2024-01-05', 2, 1299.00, 'Karim Khali', 'carte'),
(4, '2024-01-08', 5, 279.00, 'Sophie Martin', 'espèces'),
(5, '2024-01-12', 8, 79.00, 'Pierre Moreau', 'carte'),
(8, '2024-01-15', 30, 18.00, 'Jean Lefebvre', 'virement'),
(2, '2024-01-20', 3, 999.00, 'Marie Lambert', 'carte'),
(12, '2024-01-25', 12, 35.00, 'Léa Rousseau', 'carte'),
(9, '2024-01-28', 50, 12.00, 'Nathalie Bernard', 'virement');

-- Ventes pour Février 2024
INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(3, '2024-02-03', 2, 1599.00, 'Fatima Alaoui', 'carte'),
(6, '2024-02-07', 15, 59.00, 'Thomas Petit', 'espèces'),
(7, '2024-02-12', 7, 129.00, 'Ahmed Benali', 'carte'),
(8, '2024-02-15', 25, 18.00, 'Karim Khali', 'carte'),
(4, '2024-02-20', 8, 279.00, 'Pierre Moreau', 'carte'),
(1, '2024-02-28', 4, 1299.00, 'Sophie Martin', 'carte');

-- Ventes pour Mars 2024 (meilleur mois)
INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(1, '2024-03-05', 8, 1299.00, 'Jean-Paul Lebrun', 'carte'),
(3, '2024-03-10', 5, 1599.00, 'Nathalie Bernard', 'carte'),
(6, '2024-03-15', 20, 59.00, 'Fatima Alaoui', 'espèces'),
(10, '2024-03-18', 3, 899.00, 'Karim Khali', 'virement'),
(11, '2024-03-22', 25, 49.00, 'Léa Rousseau', 'carte'),
(2, '2024-03-28', 6, 999.00, 'Marie Lambert', 'carte'),
(12, '2024-03-30', 22, 35.00, 'Thomas Petit', 'carte');

-- Ventes pour Avril 2024
INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(4, '2024-04-05', 12, 279.00, 'Ahmed Benali', 'carte'),
(8, '2024-04-10', 40, 18.00, 'Jean Lefebvre', 'espèces'),
(5, '2024-04-15', 10, 79.00, 'Pierre Moreau', 'carte'),
(7, '2024-04-22', 8, 129.00, 'Sophie Martin', 'carte'),
(9, '2024-04-28', 60, 12.00, 'Karim Khali', 'virement');

-- Ventes pour Décembre 2024 (top mois)
INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method) VALUES
(1, '2024-12-05', 15, 1299.00, 'Marie Lambert', 'carte'),
(3, '2024-12-08', 10, 1599.00, 'Fatima Alaoui', 'carte'),
(6, '2024-12-12', 50, 59.00, 'Pierre Moreau', 'espèces'),
(4, '2024-12-15', 30, 279.00, 'Jean-Paul Lebrun', 'carte'),
(2, '2024-12-20', 12, 999.00, 'Nathalie Bernard', 'carte'),
(12, '2024-12-24', 40, 35.00, 'Léa Rousseau', 'carte'),
(10, '2024-12-28', 5, 899.00, 'Karim Khali', 'virement'),
(5, '2024-12-30', 20, 79.00, 'Thomas Petit', 'carte');

-- ===================== AVIS CLIENTS =====================
INSERT INTO reviews (product_id, customer_name, rating, comment, sentiment, score, date) VALUES
(1, 'Sophie Martin', 5, 'Excellent produit, livraison rapide et emballage parfait. Je recommande vivement !', 'positif', 0.95, '2024-03-15'),
(5, 'Ahmed Benali', 2, 'Très déçu de la qualité, la couture s''est défaite après seulement 2 semaines d''utilisation.', 'négatif', 0.12, '2024-03-14'),
(3, 'Marie Dupont', 5, 'Performance incroyable, batterie longue durée. Le meilleur ordinateur que j''aie jamais eu !', 'positif', 0.97, '2024-03-13'),
(8, 'Jean-Paul Lebrun', 3, 'Café correct mais pas exceptionnel pour le prix. La livraison était dans les temps.', 'neutre', 0.52, '2024-03-12'),
(6, 'Fatima Alaoui', 5, 'Magnifique robe, très belle coupe et tissu de qualité. J''en suis très satisfaite !', 'positif', 0.93, '2024-03-11'),
(7, 'Pierre Moreau', 1, 'Totalement insatisfait. Produit non conforme à la description, taille incorrecte et service client inexistant.', 'négatif', 0.03, '2024-03-10'),
(4, 'Léa Rousseau', 4, 'Très bon son et réduction de bruit efficace. Légers et confortables pour une utilisation prolongée.', 'positif', 0.82, '2024-03-09'),
(12, 'Karim Khali', 5, 'Parfait pour mes séances de yoga quotidiennes, antidérapant et facile à nettoyer.', 'positif', 0.91, '2024-03-08'),
(10, 'Nathalie Bernard', 3, 'Design sympa mais montage difficile. Instructions peu claires. Résultat final acceptable.', 'neutre', 0.48, '2024-03-07'),
(2, 'Thomas Petit', 4, 'Très bon smartphone, caméra excellente. Juste un peu cher mais qualité au rendez-vous.', 'positif', 0.78, '2024-03-06');

-- ===================== ANOMALIES =====================
INSERT INTO anomalies (type, severity, product_name, description, status, detected_at) VALUES
('baisse_ventes', 'haute', 'Café Premium 500g', 'Baisse de 15.3% des ventes sur 30 jours', 'non_résolu', '2024-03-15'),
('rupture_stock', 'critique', 'Café Premium 500g', 'Rupture de stock complète (0 unités)', 'non_résolu', '2024-03-14'),
('rupture_stock', 'critique', 'Lampe de Bureau LED', 'Rupture de stock (0 unités), baisse de 25% des ventes', 'non_résolu', '2024-03-13'),
('stock_faible', 'moyenne', 'MacBook Air M2', 'Stock critique : 8 unités restantes', 'en_cours', '2024-03-12'),
('stock_faible', 'moyenne', 'Sneakers Running', 'Stock faible : 5 unités restantes, forte demande', 'non_résolu', '2024-03-11'),
('avis_négatifs', 'haute', 'Sneakers Running', 'Augmentation des avis négatifs (25% de 1-2 étoiles)', 'en_cours', '2024-03-10');

-- ===================== RECOMMANDATIONS =====================
INSERT INTO recommendations (priority, category, title, description, action, impact, icon) VALUES
('critique', 'stock', 'Réapprovisionner immédiatement le Café Premium 500g',
    'Rupture de stock détectée. Ce produit génère en moyenne 16 020 DA/mois. Chaque jour sans stock = perte estimée à 534 DA.',
    'Commander au moins 200 unités', '+16 000 DA/mois estimé', '📦'),

('critique', 'stock', 'Réapprovisionner la Lampe de Bureau LED',
    'Stock épuisé avec une tendance négative de -25%. Risque de perte de clientèle permanente.',
    'Commander 300 unités + analyser la qualité produit', '+22 050 DA/mois potentiel', '💡'),

('haute', 'promotion', 'Lancer une promotion sur les Sneakers Running',
    'Baisse de 8.5% des ventes + avis négatifs. Une promotion de 20% pourrait relancer les ventes et améliorer la perception.',
    'Promotion -20% + améliorer description produit', '+45% ventes estimé', '🏷️'),

('haute', 'service_client', 'Améliorer le service après-vente Sneakers Running',
    '25% d''avis négatifs liés à la taille et la conformité produit. Action urgente recommandée.',
    'Revoir guide des tailles + politique de retour', 'Satisfaction client +30%', '⭐'),

('moyenne', 'stock', 'Anticiper le réapprovisionnement MacBook Air M2',
    'Stock à 8 unités, tendance haussière de +22.1%. Risque de rupture dans 2-3 semaines.',
    'Commander 25 unités supplémentaires', 'Éviter une perte de 107 000 DA', '💻'),

('moyenne', 'promotion', 'Capitaliser sur le succès de la Robe Été Femme',
    'Croissance de +15.8%, forte satisfaction client (5/5). Opportunité d''augmenter la visibilité.',
    'Mettre en avant produit + upsell collection', '+25% revenus catégorie vêtements', '👗'),

('basse', 'analyse', 'Analyser la saisonnalité du Jean Slim Homme',
    'Légère baisse de -3.2% à analyser. Possible effet saisonnier à confirmer avec données historiques.',
    'Étudier tendances sur 12 mois + adapter stocks', 'Optimisation stocks estimée', '📊');

-- ===================== CACHE PRÉDICTIONS (par défaut) =====================
INSERT INTO predictions_cache (horizon_months, period, predicted_value, confidence, model_name) VALUES
(6, '2025-01', 78500, 0.85, 'LinearRegression'),
(6, '2025-02', 82000, 0.83, 'LinearRegression'),
(6, '2025-03', 94500, 0.81, 'LinearRegression'),
(6, '2025-04', 88200, 0.79, 'LinearRegression'),
(6, '2025-05', 97800, 0.77, 'LinearRegression'),
(6, '2025-06', 105400, 0.74, 'LinearRegression');

-- ====================================================================
-- FIN DU SEED
-- ====================================================================