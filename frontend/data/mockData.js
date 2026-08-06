// ===================== DONNÉES FICTIVES =====================

export const monthlySales = [
  { month: 'Jan', ventes: 42000, objectif: 45000, commandes: 210 },
  { month: 'Fév', ventes: 38500, objectif: 45000, commandes: 192 },
  { month: 'Mar', ventes: 51200, objectif: 48000, commandes: 256 },
  { month: 'Avr', ventes: 47800, objectif: 48000, commandes: 239 },
  { month: 'Mai', ventes: 55300, objectif: 50000, commandes: 277 },
  { month: 'Juin', ventes: 62100, objectif: 55000, commandes: 310 },
  { month: 'Juil', ventes: 58900, objectif: 55000, commandes: 294 },
  { month: 'Août', ventes: 49700, objectif: 52000, commandes: 248 },
  { month: 'Sep', ventes: 63400, objectif: 58000, commandes: 317 },
  { month: 'Oct', ventes: 71200, objectif: 65000, commandes: 356 },
  { month: 'Nov', ventes: 84500, objectif: 75000, commandes: 422 },
  { month: 'Déc', ventes: 92300, objectif: 85000, commandes: 461 },
];

export const weeklyRevenue = [
  { jour: 'Lun', revenus: 8200 },
  { jour: 'Mar', revenus: 9400 },
  { jour: 'Mer', revenus: 7800 },
  { jour: 'Jeu', revenus: 11200 },
  { jour: 'Ven', revenus: 13500 },
  { jour: 'Sam', revenus: 15800 },
  { jour: 'Dim', revenus: 6300 },
];

export const categoryData = [
  { name: 'Électronique', value: 32, color: '#6366f1', amount: 28800 },
  { name: 'Vêtements', value: 25, color: '#06b6d4', amount: 22500 },
  { name: 'Alimentation', value: 20, color: '#10b981', amount: 18000 },
  { name: 'Maison', value: 15, color: '#f59e0b', amount: 13500 },
  { name: 'Sport', value: 8, color: '#ec4899', amount: 7200 },
];

export const products = [
  { id: 1, name: 'iPhone 14 Pro', category: 'Électronique', price: 1299, stock: 45, sold: 128, revenue: 166272, trend: +12.4, status: 'actif' },
  { id: 2, name: 'Samsung Galaxy S23', category: 'Électronique', price: 999, stock: 32, sold: 95, revenue: 94905, trend: +8.2, status: 'actif' },
  { id: 3, name: 'MacBook Air M2', category: 'Électronique', price: 1599, stock: 8, sold: 67, revenue: 107133, trend: +22.1, status: 'stock_faible' },
  { id: 4, name: 'AirPods Pro', category: 'Électronique', price: 279, stock: 120, sold: 210, revenue: 58590, trend: +5.7, status: 'actif' },
  { id: 5, name: 'Jean Slim Homme', category: 'Vêtements', price: 79, stock: 245, sold: 189, revenue: 14931, trend: -3.2, status: 'actif' },
  { id: 6, name: 'Robe Été Femme', category: 'Vêtements', price: 59, stock: 180, sold: 320, revenue: 18880, trend: +15.8, status: 'actif' },
  { id: 7, name: 'Sneakers Running', category: 'Sport', price: 129, stock: 5, sold: 145, revenue: 18705, trend: -8.5, status: 'stock_faible' },
  { id: 8, name: 'Café Premium 500g', category: 'Alimentation', price: 18, stock: 0, sold: 890, revenue: 16020, trend: -15.3, status: 'rupture' },
  { id: 9, name: 'Huile d\'Olive Bio', category: 'Alimentation', price: 12, stock: 340, sold: 567, revenue: 6804, trend: +2.1, status: 'actif' },
  { id: 10, name: 'Canapé Moderne', category: 'Maison', price: 899, stock: 15, sold: 28, revenue: 25172, trend: +6.3, status: 'actif' },
  { id: 11, name: 'Lampe de Bureau LED', category: 'Maison', price: 49, stock: 0, sold: 450, revenue: 22050, trend: -25.0, status: 'rupture' },
  { id: 12, name: 'Tapis de Yoga', category: 'Sport', price: 35, stock: 210, sold: 380, revenue: 13300, trend: +18.9, status: 'actif' },
];

export const customerReviews = [
  { id: 1, customer: 'Sophie Martin', product: 'iPhone 14 Pro', rating: 5, comment: 'Excellent produit, livraison rapide et emballage parfait. Je recommande vivement !', sentiment: 'positif', date: '2024-03-15', score: 0.95 },
  { id: 2, customer: 'Ahmed Benali', product: 'Jean Slim Homme', rating: 2, comment: 'Très déçu de la qualité, la couture s\'est défaite après seulement 2 semaines d\'utilisation.', sentiment: 'négatif', date: '2024-03-14', score: 0.12 },
  { id: 3, customer: 'Marie Dupont', product: 'MacBook Air M2', rating: 5, comment: 'Performance incroyable, batterie longue durée. Le meilleur ordinateur que j\'aie jamais eu !', sentiment: 'positif', date: '2024-03-13', score: 0.97 },
  { id: 4, customer: 'Jean-Paul Lebrun', product: 'Café Premium 500g', rating: 3, comment: 'Café correct mais pas exceptionnel pour le prix. La livraison était dans les temps.', sentiment: 'neutre', date: '2024-03-12', score: 0.52 },
  { id: 5, customer: 'Fatima Alaoui', product: 'Robe Été Femme', rating: 5, comment: 'Magnifique robe, très belle coupe et tissu de qualité. J\'en suis très satisfaite !', sentiment: 'positif', date: '2024-03-11', score: 0.93 },
  { id: 6, customer: 'Pierre Moreau', product: 'Sneakers Running', rating: 1, comment: 'Totalement insatisfait. Produit non conforme à la description, taille incorrecte et service client inexistant.', sentiment: 'négatif', date: '2024-03-10', score: 0.03 },
  { id: 7, customer: 'Léa Rousseau', product: 'AirPods Pro', rating: 4, comment: 'Très bon son et réduction de bruit efficace. Légers et confortables pour une utilisation prolongée.', sentiment: 'positif', date: '2024-03-09', score: 0.82 },
  { id: 8, customer: 'Karim Khali', product: 'Tapis de Yoga', rating: 5, comment: 'Parfait pour mes séances de yoga quotidiennes, antidérapant et facile à nettoyer.', sentiment: 'positif', date: '2024-03-08', score: 0.91 },
  { id: 9, customer: 'Nathalie Bernard', product: 'Canapé Moderne', rating: 3, comment: 'Design sympa mais montage difficile. Instructions peu claires. Résultat final acceptable.', sentiment: 'neutre', date: '2024-03-07', score: 0.48 },
  { id: 10, customer: 'Thomas Petit', product: 'Samsung Galaxy S23', rating: 4, comment: 'Très bon smartphone, caméra excellente. Juste un peu cher mais qualité au rendez-vous.', sentiment: 'positif', date: '2024-03-06', score: 0.78 },
];

export const sentimentStats = {
  positif: { count: 6, percentage: 60, color: '#10b981' },
  neutre: { count: 2, percentage: 20, color: '#f59e0b' },
  négatif: { count: 2, percentage: 20, color: '#ef4444' },
};

export const anomalies = [
  { id: 1, type: 'baisse_ventes', severity: 'haute', product: 'Café Premium 500g', description: 'Baisse de 15.3% des ventes sur 30 jours', detected: '2024-03-15', status: 'non_résolu' },
  { id: 2, type: 'rupture_stock', severity: 'critique', product: 'Café Premium 500g', description: 'Rupture de stock complète (0 unités)', detected: '2024-03-14', status: 'non_résolu' },
  { id: 3, type: 'rupture_stock', severity: 'critique', product: 'Lampe de Bureau LED', description: 'Rupture de stock (0 unités), baisse de 25% des ventes', detected: '2024-03-13', status: 'non_résolu' },
  { id: 4, type: 'stock_faible', severity: 'moyenne', product: 'MacBook Air M2', description: 'Stock critique : 8 unités restantes', detected: '2024-03-12', status: 'en_cours' },
  { id: 5, type: 'stock_faible', severity: 'moyenne', product: 'Sneakers Running', description: 'Stock faible : 5 unités restantes, forte demande', detected: '2024-03-11', status: 'non_résolu' },
  { id: 6, type: 'avis_négatifs', severity: 'haute', product: 'Sneakers Running', description: 'Augmentation des avis négatifs (25% de 1-2 étoiles)', detected: '2024-03-10', status: 'en_cours' },
];

export const predictions = [
  { month: 'Jan', historique: 42000, prediction: null },
  { month: 'Fév', historique: 38500, prediction: null },
  { month: 'Mar', historique: 51200, prediction: null },
  { month: 'Avr', historique: 47800, prediction: null },
  { month: 'Mai', historique: 55300, prediction: null },
  { month: 'Juin', historique: 62100, prediction: null },
  { month: 'Juil', historique: 58900, prediction: null },
  { month: 'Août', historique: 49700, prediction: null },
  { month: 'Sep', historique: 63400, prediction: null },
  { month: 'Oct', historique: 71200, prediction: null },
  { month: 'Nov', historique: 84500, prediction: null },
  { month: 'Déc', historique: 92300, prediction: null },
  { month: 'Jan 25', historique: null, prediction: 78500 },
  { month: 'Fév 25', historique: null, prediction: 82000 },
  { month: 'Mar 25', historique: null, prediction: 94500 },
  { month: 'Avr 25', historique: null, prediction: 88200 },
  { month: 'Mai 25', historique: null, prediction: 97800 },
  { month: 'Juin 25', historique: null, prediction: 105400 },
];

export const recommendations = [
  {
    id: 1, priority: 'critique', category: 'stock',
    title: 'Réapprovisionner immédiatement le Café Premium 500g',
    description: 'Rupture de stock détectée. Ce produit génère en moyenne 16 020 DA/mois. Chaque jour sans stock = perte estimée à 534 DA.',
    action: 'Commander au moins 200 unités',
    impact: '+16 000 DA/mois estimé',
    icon: '📦',
  },
  {
    id: 2, priority: 'critique', category: 'stock',
    title: 'Réapprovisionner la Lampe de Bureau LED',
    description: 'Stock épuisé avec une tendance négative de -25%. Risque de perte de clientèle permanente.',
    action: 'Commander 300 unités + analyser la qualité produit',
    impact: '+22 050 DA/mois potentiel',
    icon: '💡',
  },
  {
    id: 3, priority: 'haute', category: 'promotion',
    title: 'Lancer une promotion sur les Sneakers Running',
    description: 'Baisse de 8.5% des ventes + avis négatifs. Une promotion de 20% pourrait relancer les ventes et améliorer la perception.',
    action: 'Promotion -20% + améliorer description produit',
    impact: '+45% ventes estimé',
    icon: '🏷️',
  },
  {
    id: 4, priority: 'haute', category: 'service_client',
    title: 'Améliorer le service après-vente Sneakers Running',
    description: '25% d\'avis négatifs liés à la taille et la conformité produit. Action urgente recommandée.',
    action: 'Revoir guide des tailles + politique de retour',
    impact: 'Satisfaction client +30%',
    icon: '⭐',
  },
  {
    id: 5, priority: 'moyenne', category: 'stock',
    title: 'Anticiper le réapprovisionnement MacBook Air M2',
    description: 'Stock à 8 unités, tendance haussière de +22.1%. Risque de rupture dans 2-3 semaines.',
    action: 'Commander 25 unités supplémentaires',
    impact: 'Éviter une perte de 107 000 DA',
    icon: '💻',
  },
  {
    id: 6, priority: 'moyenne', category: 'promotion',
    title: 'Capitaliser sur le succès de la Robe Été Femme',
    description: 'Croissance de +15.8%, forte satisfaction client (5/5). Opportunité d\'augmenter la visibilité.',
    action: 'Mettre en avant produit + upsell collection',
    impact: '+25% revenus catégorie vêtements',
    icon: '👗',
  },
  {
    id: 7, priority: 'basse', category: 'analyse',
    title: 'Analyser la saisonnalité du Jean Slim Homme',
    description: 'Légère baisse de -3.2% à analyser. Possible effet saisonnier à confirmer avec données historiques.',
    action: 'Étudier tendances sur 12 mois + adapter stocks',
    impact: 'Optimisation stocks estimée',
    icon: '📊',
  },
];

export const kpis = {
  totalRevenue: 716200,
  revenueGrowth: +18.4,
  totalOrders: 3582,
  ordersGrowth: +12.7,
  avgOrderValue: 200,
  avgOrderGrowth: +5.1,
  customerSatisfaction: 4.2,
  satisfactionGrowth: +0.3,
  topProduct: 'iPhone 14 Pro',
  stockAlerts: 4,
  activeProducts: 12,
  pendingOrders: 28,
};
