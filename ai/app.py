"""
Smart Business Assistant - Module IA
Flask API pour les analyses IA : prédictions, sentiment, anomalies, chatbot, CSV analysis
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_absolute_error, r2_score
import json
import os
from datetime import datetime
import io

app = Flask(__name__)
CORS(app)

# ===================== DONNÉES HISTORIQUES =====================
HISTORICAL_SALES = [42000, 38500, 51200, 47800, 55300, 62100, 58900, 49700, 63400, 71200, 84500, 92300]
MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

# ===================== MODULE PRÉDICTION =====================
class SalesPredictionModel:
    def __init__(self):
        self.model = LinearRegression()
        self.poly = PolynomialFeatures(degree=2)
        self.is_trained = False

    def train(self, sales_data: list) -> dict:
        X = np.array(range(len(sales_data))).reshape(-1, 1)
        y = np.array(sales_data)
        X_poly = self.poly.fit_transform(X)
        self.model.fit(X_poly, y)
        self.is_trained = True
        y_pred = self.model.predict(X_poly)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        return {'mae': round(mae, 2), 'r2': round(r2, 4), 'accuracy': round(r2 * 100, 1)}

    def predict(self, n_periods: int = 6) -> list:
        if not self.is_trained:
            self.train(HISTORICAL_SALES)
        n_hist = len(HISTORICAL_SALES)
        predictions = []
        for i in range(n_periods):
            idx_poly = self.poly.transform(np.array([[n_hist + i]]))
            pred = self.model.predict(idx_poly)[0]
            seasonal_factor = 1 + 0.05 * np.sin((n_hist + i) * np.pi / 6)
            predictions.append(round(max(pred * seasonal_factor, 0)))
        return predictions

predictor = SalesPredictionModel()
metrics = predictor.train(HISTORICAL_SALES)

class SentimentAnalyzer:
    POSITIVE_WORDS = ['excellent', 'parfait', 'magnifique', 'incroyable', 'rapide', 'satisfait', 'super', 'bon', 'bien', 'qualité', 'recommande', 'efficace', 'confortable', 'top']
    NEGATIVE_WORDS = ['déçu', 'mauvais', 'terrible', 'problème', 'cassé', 'défaite', 'incorrect', 'insatisfait', 'nul', 'horrible', 'retard', 'inexistant', 'défaut', 'périme']

    def analyze(self, text: str) -> dict:
        lower = text.lower()
        positive = sum(1 for word in self.POSITIVE_WORDS if word in lower)
        negative = sum(1 for word in self.NEGATIVE_WORDS if word in lower)
        total = positive + negative
        score = 0.5 if total == 0 else positive / total
        sentiment = 'positif' if score >= 0.65 else 'négatif' if score <= 0.35 else 'neutre'
        return {'sentiment': sentiment, 'score': round(score, 3), 'positive_words': positive, 'negative_words': negative, 'confidence': round(abs(score - 0.5) * 2, 3)}

    def analyze_batch(self, reviews: list) -> dict:
        results = [self.analyze(review.get('comment', '')) for review in reviews]
        stats = {'positif': 0, 'neutre': 0, 'négatif': 0}
        for result in results:
            stats[result['sentiment']] += 1
        total = len(results) or 1
        return {'results': results, 'summary': {key: {'count': value, 'percentage': round(value / total * 100, 1)} for key, value in stats.items()}, 'average_score': round(sum(result['score'] for result in results) / total, 3)}

analyzer = SentimentAnalyzer()

class AnomalyDetector:
    def detect_sales_anomalies(self, sales: list, threshold: float = 1.5) -> list:
        if not sales:
            return []
        arr = np.array(sales)
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return []
        anomalies = []
        for i, (value, z_score) in enumerate(zip(sales, np.abs((arr - mean) / std))):
            if z_score > threshold:
                anomalies.append({'index': i, 'month': MONTHS[i] if i < len(MONTHS) else f'Mois {i + 1}', 'value': value, 'z_score': round(float(z_score), 3), 'deviation_pct': round(float((value - mean) / mean * 100), 1), 'type': 'baisse_anormale' if value < mean else 'pic_anormal'})
        return anomalies

    def detect_stock_anomalies(self, products: list) -> list:
        anomalies = []
        for product in products:
            stock = float(product.get('stock', 0) or 0)
            if stock == 0:
                anomalies.append({'product': product['name'], 'type': 'rupture', 'severity': 'critique', 'stock': 0})
            elif stock <= 10:
                anomalies.append({'product': product['name'], 'type': 'stock_faible', 'severity': 'haute', 'stock': stock})
        return anomalies

detector = AnomalyDetector()

# ===================== ROUTES API =====================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'module': 'AI Engine', 'version': '1.0.0', 'timestamp': datetime.now().isoformat()})

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Prédit les ventes futures"""
    horizon = int(request.args.get('horizon', 6))
    if request.method == 'POST':
        data = request.get_json()
        sales_data = data.get('sales', HISTORICAL_SALES)
        predictor.train(sales_data)
    predictions_list = predictor.predict(min(horizon, 12))
    future_months = ['Jan 25', 'Fév 25', 'Mar 25', 'Avr 25', 'Mai 25', 'Juin 25',
                     'Juil 25', 'Août 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Déc 25']
    return jsonify({
        'predictions': [{'month': future_months[i], 'value': v} for i, v in enumerate(predictions_list)],
        'model_metrics': metrics,
        'horizon': horizon,
        'total_predicted': sum(predictions_list)
    })

@app.route('/sentiment', methods=['POST'])
def sentiment():
    """Analyse le sentiment d'un texte ou d'une liste d'avis"""
    data = request.get_json()
    if 'text' in data:
        result = analyzer.analyze(data['text'])
        return jsonify(result)
    elif 'reviews' in data:
        result = analyzer.analyze_batch(data['reviews'])
        return jsonify(result)
    return jsonify({'error': 'Fournir text ou reviews'}), 400

@app.route('/anomalies', methods=['POST'])
def anomalies():
    """Détecte les anomalies dans les données"""
    data = request.get_json()
    result = {}
    if 'sales' in data:
        result['sales_anomalies'] = detector.detect_sales_anomalies(data['sales'])
    if 'products' in data:
        result['stock_anomalies'] = detector.detect_stock_anomalies(data['products'])
    return jsonify(result)

@app.route('/analyze', methods=['POST'])
def full_analysis():
    """Analyse complète : prédictions + sentiment + anomalies + recommandations"""
    data = request.get_json()
    sales = data.get('sales', HISTORICAL_SALES)
    products = data.get('products', [])
    reviews = data.get('reviews', [])

    # Réentraîner si nouvelles données
    metrics_result = predictor.train(sales)
    pred_values = predictor.predict(6)

    # Sentiment
    sent_result = analyzer.analyze_batch(reviews) if reviews else None

    # Anomalies
    sales_anomalies = detector.detect_sales_anomalies(sales)
    stock_anomalies = detector.detect_stock_anomalies(products) if products else []

    # Générer recommandations automatiques
    recommendations = generate_recommendations(stock_anomalies, sales_anomalies, sent_result)

    return jsonify({
        'predictions': pred_values,
        'model_accuracy': metrics_result.get('accuracy'),
        'sentiment': sent_result,
        'anomalies': { 'sales': sales_anomalies, 'stock': stock_anomalies },
        'recommendations': recommendations,
        'analyzed_at': datetime.now().isoformat()
    })

@app.route('/chatbot', methods=['POST'])
def chatbot_endpoint():
    """Endpoint pour le chatbot IA sur les produits"""
    data = request.get_json()
    question = data.get('question', '')
    products = data.get('products', [])
    history = data.get('history', [])
    
    if not question:
        return jsonify({'error': 'Question is required'}), 400
    
    result = chatbot.answer_question(question, products, history)
    return jsonify(result)

@app.route('/analyze-csv', methods=['POST'])
def analyze_csv_endpoint():
    """Endpoint pour analyser un fichier CSV de produits"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400
    
    try:
        csv_content = file.read().decode('utf-8')
        result = csv_analyzer.analyze_csv(csv_content)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_recommendations(stock_anomalies, sales_anomalies, sentiment_data):
    """Génère des recommandations basées sur l'analyse"""
    recs = []
    for a in stock_anomalies:
        if a['type'] == 'rupture':
            recs.append({'priority': 'critique', 'type': 'stock', 'message': f"Réapprovisionnement urgent : {a['product']}", 'action': 'Commander immédiatement'})
        elif a['type'] == 'stock_faible':
            recs.append({'priority': 'haute', 'type': 'stock', 'message': f"Stock faible : {a['product']} ({a['stock']} unités)", 'action': 'Planifier réapprovisionnement'})
    for a in sales_anomalies:
        if a['type'] == 'baisse_anormale':
            recs.append({'priority': 'haute', 'type': 'ventes', 'message': f"Baisse anormale en {a['month']} ({a['deviation_pct']}%)", 'action': 'Analyser causes + lancer promotion'})
    if sentiment_data:
        neg_pct = sentiment_data['summary'].get('négatif', {}).get('percentage', 0)
        if neg_pct > 20:
            recs.append({'priority': 'haute', 'type': 'service', 'message': f"{neg_pct}% d'avis négatifs détectés", 'action': 'Améliorer qualité produit et service client'})
    return recs

# ===================== MODULE CHATBOT =====================
class ProductChatbot:
    """Chatbot IA pour répondre aux questions sur les produits"""
    
    def __init__(self):
        self.products_context = []
    
    def set_products(self, products):
        """Définit le contexte des produits pour le chatbot"""
        self.products_context = products

    @staticmethod
    def _number(value):
        try:
            return float(value or 0)
        except (TypeError, ValueError):
            return 0.0

    def _money(self, value):
        return f"{self._number(value):,.0f} DA"

    def _find_product(self, question):
        question_lower = question.lower()
        matches = [
            product for product in self.products_context
            if product.get('name') and product['name'].lower() in question_lower
        ]
        return max(matches, key=lambda product: len(product['name'])) if matches else None

    @staticmethod
    def _is_french(question):
        french_words = ('bonjour', 'combien', 'quel', 'quelle', 'stock', 'ventes', 'produit', 'merci')
        return any(word in question.lower() for word in french_words)
    
    def answer_question(self, question, products=None, history=None):
        """Répond à une question sur les produits"""
        if products is not None:
            self.set_products(products)

        question = (question or '').strip()
        question_lower = question.lower()
        history = history or []
        language = 'fr' if self._is_french(question) else 'en'

        if not question:
            return {'answer': 'Tell me what you would like to check.', 'confidence': 0.2}

        products_context = self.products_context
        if any(word in question_lower for word in ('hello', 'hi', 'bonjour', 'salut', 'hey')):
            answer = ('Bonjour ! Je peux vous aider avec vos produits, stocks et ventes. Que souhaitez-vous regarder ?'
                      if language == 'fr' else
                      'Hello! I can help you explore your products, stock, and sales. What would you like to look at?')
            return {'answer': answer, 'confidence': 0.99}

        if products_context:
            product = self._find_product(question)
            asks_stock = any(word in question_lower for word in ('stock', 'inventory', 'inventaire', 'disponib', 'rupture'))
            asks_sales = any(word in question_lower for word in ('sales', 'revenue', 'ventes', 'revenu', 'chiffre'))
            asks_top = any(word in question_lower for word in ('top', 'best', 'meilleur', 'meilleure', 'perform'))

            if product and asks_stock:
                stock = int(self._number(product.get('stock')))
                answer = (f"{product['name']} a actuellement {stock} unités en stock."
                          if language == 'fr' else
                          f"{product['name']} currently has {stock} units in stock.")
                if stock == 0:
                    answer += (' Il faut prévoir un réapprovisionnement rapidement.' if language == 'fr'
                               else ' It would be worth planning a replenishment soon.')
                return {'answer': answer, 'confidence': 0.98}

            if product and asks_sales:
                sold = int(self._number(product.get('sold')))
                answer = (f"{product['name']} a généré {self._money(product.get('revenue'))} et {sold} unités ont été vendues."
                          if language == 'fr' else
                          f"{product['name']} has generated {self._money(product.get('revenue'))} and sold {sold} units.")
                return {'answer': answer, 'confidence': 0.98}

            if asks_stock:
                low_stock = [p for p in products_context if self._number(p.get('stock')) <= 10]
                out_of_stock = [p for p in products_context if self._number(p.get('stock')) == 0]
                if any(word in question_lower for word in ('out', 'empty', 'zero', 'rupture', 'épuis')):
                    names = ', '.join(p['name'] for p in out_of_stock[:5]) or ('aucun' if language == 'fr' else 'none')
                    answer = f"Produits en rupture : {names}." if language == 'fr' else f"Out-of-stock products: {names}."
                elif any(word in question_lower for word in ('low', 'faible', 'basse', 'alert')):
                    names = ', '.join(f"{p['name']} ({int(self._number(p.get('stock')))})" for p in low_stock[:5]) or ('aucun' if language == 'fr' else 'none')
                    answer = f"Stock faible : {names}." if language == 'fr' else f"Low-stock products: {names}."
                else:
                    total = int(sum(self._number(p.get('stock')) for p in products_context))
                    answer = (f"Vous avez {total} unités sur {len(products_context)} produits, dont {len(low_stock)} sous le seuil de 10 unités."
                              if language == 'fr' else
                              f"You have {total} units across {len(products_context)} products; {len(low_stock)} are at or below the 10-unit alert threshold.")
                return {'answer': answer, 'confidence': 0.95}

            if asks_sales or asks_top:
                top_products = sorted(products_context, key=lambda item: self._number(item.get('revenue')), reverse=True)[:3]
                names = ', '.join(f"{item['name']} ({self._money(item.get('revenue'))})" for item in top_products)
                total = sum(self._number(item.get('revenue')) for item in products_context)
                answer = (f"Votre chiffre d’affaires produit est de {self._money(total)}. Les meilleurs résultats sont : {names}."
                          if language == 'fr' else
                          f"Your product revenue totals {self._money(total)}. The strongest performers are {names}.")
                return {'answer': answer, 'confidence': 0.94}

        if history:
            return {'answer': ('Je peux poursuivre, mais j’ai besoin d’un produit ou d’une mesure précise. Voulez-vous parler du stock ou des ventes ?'
                               if language == 'fr' else
                               'I can keep going, but I need a product or metric to focus on. Would you like to look at stock or sales?'), 'confidence': 0.55}
        
        # Analyser la question et fournir une réponse basée sur les produits
        if not self.products_context:
            return {
                'answer': "I don't have any product data available. Please provide product information first.",
                'confidence': 0.0
            }
        
        # Questions sur le stock
        if 'stock' in question_lower or 'inventory' in question_lower:
            low_stock = [p for p in self.products_context if p.get('stock', 0) <= 10]
            out_of_stock = [p for p in self.products_context if p.get('stock', 0) == 0]
            
            if 'low' in question_lower or 'faible' in question_lower:
                if low_stock:
                    items = ', '.join([p['name'] for p in low_stock[:5]])
                    return {
                        'answer': f"Products with low stock: {items}. Total: {len(low_stock)} products.",
                        'confidence': 0.9
                    }
            elif 'out' in question_lower or 'rupture' in question_lower:
                if out_of_stock:
                    items = ', '.join([p['name'] for p in out_of_stock[:5]])
                    return {
                        'answer': f"Products out of stock: {items}. Total: {len(out_of_stock)} products.",
                        'confidence': 0.9
                    }
            else:
                total_stock = sum(p.get('stock', 0) for p in self.products_context)
                return {
                    'answer': f"Total inventory: {total_stock} units across {len(self.products_context)} products. {len(low_stock)} products have low stock.",
                    'confidence': 0.85
                }
        
        # Questions sur les ventes/revenus
        elif 'sales' in question_lower or 'revenue' in question_lower or 'ventes' in question_lower or 'revenu' in question_lower:
            total_revenue = sum(p.get('revenue', 0) for p in self.products_context)
            top_products = sorted(self.products_context, key=lambda x: x.get('revenue', 0), reverse=True)[:3]
            top_names = ', '.join([p['name'] for p in top_products])
            
            return {
                'answer': f"Total revenue: ${total_revenue:,.2f}. Top performing products: {top_names}.",
                'confidence': 0.9
            }
        
        # Questions sur les catégories
        elif 'category' in question_lower or 'catégorie' in question_lower:
            categories = {}
            for p in self.products_context:
                cat = p.get('category', 'Unknown')
                categories[cat] = categories.get(cat, 0) + 1
            
            cat_str = ', '.join([f"{k}: {v}" for k, v in categories.items()])
            return {
                'answer': f"Products by category: {cat_str}.",
                'confidence': 0.85
            }
        
        # Questions sur les produits spécifiques
        elif 'product' in question_lower or 'produit' in question_lower:
            if len(self.products_context) <= 5:
                names = ', '.join([p['name'] for p in self.products_context])
                return {
                    'answer': f"Available products: {names}.",
                    'confidence': 0.9
                }
            else:
                return {
                    'answer': f"You have {len(self.products_context)} products in inventory. Ask about specific products, stock levels, sales, or categories.",
                    'confidence': 0.8
                }
        
        # Questions sur les tendances
        elif 'trend' in question_lower or 'tendance' in question_lower:
            trending_up = [p for p in self.products_context if p.get('trend', 0) > 0]
            trending_down = [p for p in self.products_context if p.get('trend', 0) < 0]
            
            return {
                'answer': f"Products with positive trend: {len(trending_up)}. Products with negative trend: {len(trending_down)}.",
                'confidence': 0.85
            }
        
        # Réponse par défaut
        else:
            return {
                'answer': "I can help you with questions about your products, inventory, sales, categories, and trends. Try asking about stock levels, revenue, or specific products.",
                'confidence': 0.5
            }

chatbot = ProductChatbot()

# ===================== MODULE ANALYSE CSV =====================
class CSVAnalyzer:
    """Analyseur de CSV pour importer automatiquement des produits"""
    
    def analyze_csv(self, csv_content):
        """Analyse un fichier CSV et mappe les colonnes aux champs produits"""
        try:
            df = pd.read_csv(io.StringIO(csv_content))
            
            # Colonnes attendues et leurs variations possibles
            column_mapping = {
                'name': ['name', 'product', 'product_name', 'nom', 'produit', 'title'],
                'category': ['category', 'cat', 'categorie', 'type'],
                'price': ['price', 'prix', 'cost', 'amount'],
                'stock': ['stock', 'inventory', 'quantity', 'qty', 'quantité'],
                'sold': ['sold', 'sales', 'ventes'],
                'revenue': ['revenue', 'revenu', 'income'],
                'description': ['description', 'desc', 'details']
            }
            
            # Détecter les colonnes
            detected_columns = {}
            df_columns_lower = [col.lower().strip() for col in df.columns]
            
            for field, variations in column_mapping.items():
                for i, col in enumerate(df_columns_lower):
                    if any(var in col for var in variations):
                        detected_columns[field] = df.columns[i]
                        break
            
            # Valider les colonnes requises
            required_fields = ['name', 'category', 'price', 'stock']
            missing_fields = [f for f in required_fields if f not in detected_columns]
            
            if missing_fields:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing_fields)}',
                    'detected_columns': detected_columns,
                    'available_columns': list(df.columns)
                }
            
            # Transformer les données
            products = []
            for _, row in df.iterrows():
                product = {
                    'name': str(row[detected_columns['name']]).strip(),
                    'category': str(row[detected_columns['category']]).strip(),
                    'price': float(row[detected_columns['price']]),
                    'stock': int(row[detected_columns['stock']]),
                    'sold': int(row.get(detected_columns.get('sold', ''), 0)) if 'sold' in detected_columns else 0,
                    'revenue': float(row.get(detected_columns.get('revenue', ''), 0)) if 'revenue' in detected_columns else 0,
                    'description': str(row[detected_columns['description']]).strip() if 'description' in detected_columns else None,
                    'trend': 0.0
                }
                products.append(product)
            
            return {
                'success': True,
                'products': products,
                'total': len(products),
                'column_mapping': detected_columns,
                'preview': products[:3]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

csv_analyzer = CSVAnalyzer()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🤖 Smart Business Assistant AI Engine starting on port {port}")
    app.run(host='127.0.0.1', port=port, debug=False)
