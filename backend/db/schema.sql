-- ====================================================================
-- SMART BUSINESS ASSISTANT - Schéma PostgreSQL (multi-tenant)
-- Chaque table métier est scopée par user_id (provenant du JWT).
-- ====================================================================

-- Nettoyage (à exécuter avec précaution en production)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS anomalies CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS monthly_targets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS predictions_cache CASCADE;
DROP VIEW IF EXISTS v_product_performance;
DROP VIEW IF EXISTS v_monthly_sales;
DROP VIEW IF EXISTS v_global_kpis;
DROP VIEW IF EXISTS v_sentiment_summary;

-- ===================== Extensions =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== TABLE USERS =====================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company VARCHAR(150),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ===================== TABLE PRODUCTS =====================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Électronique', 'Vêtements', 'Alimentation', 'Maison', 'Sport', 'Autre')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
    description TEXT,
    image_url TEXT,
    sku VARCHAR(50),
    trend DECIMAL(5, 2) DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN stock = 0 THEN 'rupture'
            WHEN stock <= 10 THEN 'stock_faible'
            ELSE 'actif'
        END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products(name);

-- ===================== TABLE SALES =====================
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    customer_name VARCHAR(150),
    payment_method VARCHAR(30) DEFAULT 'carte' CHECK (payment_method IN ('carte', 'espèces', 'virement', 'chèque', 'autre')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_user_date ON sales(user_id, date DESC);
CREATE INDEX idx_sales_user_product ON sales(user_id, product_id);

-- ===================== TABLE MONTHLY_TARGETS =====================
CREATE TABLE monthly_targets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    target NUMERIC(12, 2) NOT NULL,
    actual NUMERIC(12, 2) DEFAULT 0,
    year INTEGER NOT NULL,
    month_num INTEGER NOT NULL CHECK (month_num BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

CREATE INDEX idx_targets_user ON monthly_targets(user_id);
CREATE INDEX idx_targets_user_year_month ON monthly_targets(user_id, year, month_num);

-- ===================== TABLE REVIEWS =====================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positif', 'neutre', 'négatif')),
    score NUMERIC(3, 2) CHECK (score BETWEEN 0 AND 1),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_user_product ON reviews(user_id, product_id);
CREATE INDEX idx_reviews_user_sentiment ON reviews(user_id, sentiment);
CREATE INDEX idx_reviews_user_rating ON reviews(user_id, rating);

-- ===================== TABLE ANOMALIES =====================
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('baisse_ventes', 'rupture_stock', 'stock_faible', 'avis_négatifs', 'pic_ventes')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('basse', 'moyenne', 'haute', 'critique')),
    product_name VARCHAR(200),
    description TEXT NOT NULL,
    detected_at DATE DEFAULT CURRENT_DATE,
    resolved_at DATE,
    status VARCHAR(20) DEFAULT 'non_résolu' CHECK (status IN ('non_résolu', 'en_cours', 'résolu')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_user ON anomalies(user_id);
CREATE INDEX idx_anomalies_user_status ON anomalies(user_id, status);
CREATE INDEX idx_anomalies_user_severity ON anomalies(user_id, severity);
CREATE INDEX idx_anomalies_user_type ON anomalies(user_id, type);

-- ===================== TABLE RECOMMENDATIONS =====================
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('basse', 'moyenne', 'haute', 'critique')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('stock', 'promotion', 'service_client', 'analyse', 'marketing')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action VARCHAR(255),
    impact VARCHAR(255),
    icon VARCHAR(10),
    done BOOLEAN DEFAULT FALSE,
    done_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_user_priority ON recommendations(user_id, priority);
CREATE INDEX idx_recommendations_user_done ON recommendations(user_id, done);

-- ===================== TABLE PREDICTIONS_CACHE =====================
CREATE TABLE predictions_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    horizon_months INTEGER NOT NULL,
    period VARCHAR(7) NOT NULL,
    predicted_value NUMERIC(12, 2) NOT NULL,
    confidence NUMERIC(3, 2),
    model_name VARCHAR(100) DEFAULT 'LinearRegression',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, horizon_months, period)
);

CREATE INDEX idx_predictions_user ON predictions_cache(user_id);
CREATE INDEX idx_predictions_user_period ON predictions_cache(user_id, period);

-- ===================== VUES =====================
-- NOTE MULTI-TENANT :
--   v_global_kpis a été SUPPRIMÉE (elle renvoyait des statistiques globales =
--   fuite de données inter-utilisateurs). Tous les KPIs sont désormais des
--   requêtes scopées par user_id directement dans les routes backend.

-- ===================== FONCTIONS & TRIGGERS =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Met à jour les stats produit (sold, revenue, stock) après insertion d'une vente.
-- Sécurisé multi-tenant : le produit n'est mis à jour que si la vente ET le
-- produit appartiennent au même utilisateur.
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET sold = sold + NEW.quantity,
        revenue = revenue + NEW.total_amount,
        stock = GREATEST(stock - NEW.quantity, 0)
    WHERE id = NEW.product_id
      AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stats
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stats();

-- ====================================================================
-- FIN DU SCHÉMA
-- ====================================================================
