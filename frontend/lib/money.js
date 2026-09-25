/**
 * Storefront money helpers — Moroccan dirham (MAD).
 * All customer-facing prices go through these helpers.
 */

export const CURRENCY = "MAD";

const nf = (min, max) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

/** 1299 -> "1 299 MAD", 1299.5 -> "1 299,50 MAD" */
export const money = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const rounded = Math.round(v * 100) / 100;
  const s = Number.isInteger(rounded)
    ? nf(0, 0).format(rounded)
    : nf(2, 2).format(rounded);
  return `${s} ${CURRENCY}`;
};

/** Always two decimals — used in totals/invoices. */
export const money2 = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${nf(2, 2).format(v)} ${CURRENCY}`;
};

/** Promotion active on a product? */
export const hasPromotion = (p) =>
  !!p &&
  p.promotion_price !== null &&
  p.promotion_price !== undefined &&
  p.promotion_price !== "" &&
  Number.isFinite(Number(p.promotion_price)) &&
  Number(p.promotion_price) < Number(p.price);

/** Price the customer actually pays. */
export const priceOf = (p) => (hasPromotion(p) ? Number(p.promotion_price) : Number(p.price));

/** Discount percentage (rounded) when a promotion is active. */
export const discountPercent = (p) =>
  hasPromotion(p)
    ? Math.max(1, Math.round((1 - Number(p.promotion_price) / Number(p.price)) * 100))
    : 0;
