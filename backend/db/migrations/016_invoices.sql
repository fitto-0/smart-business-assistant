-- ====================================================================
-- INVOICES, INVOICE ITEMS, AND QUOTES
-- ====================================================================

-- ===================== TABLE INVOICES =====================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tva_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    payment_terms VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, invoice_number)
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date DESC);

-- ===================== TABLE INVOICE ITEMS =====================
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    tva_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.0 CHECK (tva_rate >= 0),
    total NUMERIC(12, 2) GENERATED ALWAYS AS (
        ROUND((quantity * unit_price * (1 - discount / 100))::numeric, 2)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ===================== TABLE QUOTES =====================
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tva_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted', 'expired')),
    notes TEXT,
    converted_to_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quote_number)
);

CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_date ON quotes(date DESC);

-- ===================== TABLE QUOTE ITEMS =====================
CREATE TABLE IF NOT EXISTS quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    tva_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.0 CHECK (tva_rate >= 0),
    total NUMERIC(12, 2) GENERATED ALWAYS AS (
        ROUND((quantity * unit_price * (1 - discount / 100))::numeric, 2)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- ===================== INVOICE NUMBER SEQUENCE =====================
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    next_num INTEGER;
    year_str VARCHAR;
BEGIN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM invoices
    WHERE user_id = p_user_id
      AND invoice_number LIKE 'INV-' || year_str || '-%';
    RETURN 'INV-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_number(p_user_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    next_num INTEGER;
    year_str VARCHAR;
BEGIN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM quotes
    WHERE user_id = p_user_id
      AND quote_number LIKE 'DEV-' || year_str || '-%';
    RETURN 'DEV-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ===================== TRIGGER: UPDATE INVOICE TOTALS =====================
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET subtotal = COALESCE((SELECT SUM(total) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0),
        tva_amount = COALESCE((SELECT SUM(total * tva_rate / 100) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0),
        total = COALESCE((SELECT SUM(total * (1 + tva_rate / 100)) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0),
        updated_at = NOW()
    WHERE id = NEW.invoice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- ===================== TRIGGER: UPDATE QUOTE TOTALS =====================
CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotes
    SET subtotal = COALESCE((SELECT SUM(total) FROM quote_items WHERE quote_id = NEW.quote_id), 0),
        tva_amount = COALESCE((SELECT SUM(total * tva_rate / 100) FROM quote_items WHERE quote_id = NEW.quote_id), 0),
        total = COALESCE((SELECT SUM(total * (1 + tva_rate / 100)) FROM quote_items WHERE quote_id = NEW.quote_id), 0),
        updated_at = NOW()
    WHERE id = NEW.quote_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_totals
    AFTER INSERT OR UPDATE OR DELETE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_totals();

-- ===================== TRIGGER: UPDATE UPDATED_AT =====================
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
