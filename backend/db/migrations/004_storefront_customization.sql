-- Storefront customization tokens and editable copy.
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS header_background_color VARCHAR(7) DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS footer_background_color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS card_background_color VARCHAR(7) DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS card_text_color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS content_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;