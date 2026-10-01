/**
 * Guided resolution plans for anomalies.
 * Each anomaly type maps to an ordered checklist. Steps carry everything the
 * frontend needs: where to act (link), what to do, and how to verify it.
 * Placeholders like {product} are interpolated with the anomaly's own data.
 */

const PLANS = {
  rupture_stock: {
    title: "Restock {product}",
    summary:
      "{product} is out of stock (0 units). Every day without stock is lost revenue. Follow these steps to get it selling again.",
    link: "/products",
    linkLabel: "Open products",
    steps: [
      {
        title: "Confirm the stock-out",
        detail: "Open the product list and check the current stock of {product}.",
        action: "Check stock of {product}",
        link: "/products",
        linkLabel: "Open products",
        verify: "Stock column shows 0 units.",
      },
      {
        title: "Place a purchase order",
        detail: "Contact your supplier and order enough units to cover demand until the next delivery.",
        action: "Order from supplier",
        verify: "You have a confirmed quantity and delivery date.",
      },
      {
        title: "Record the incoming stock",
        detail: "When the delivery arrives, update the stock quantity of {product} in the products page.",
        action: "Update stock in Products",
        link: "/products",
        linkLabel: "Update stock",
        verify: "Stock of {product} is above 0.",
      },
      {
        title: "Mark the anomaly resolved",
        detail: "Once stock is back, resolve this anomaly so it leaves the open list.",
        action: "Resolve",
        verify: "Status changes to Resolved.",
      },
    ],
  },
  stock_faible: {
    title: "Plan a restock of {product}",
    summary:
      "Stock of {product} is low ({stock}). Order ahead now so you never hit a full stock-out.",
    link: "/products",
    linkLabel: "Open products",
    steps: [
      {
        title: "Check the remaining stock",
        detail: "In the product list, compare the remaining units of {product} against your sales pace.",
        action: "Review stock of {product}",
        link: "/products",
        linkLabel: "Open products",
        verify: "You know how many selling days are left.",
      },
      {
        title: "Set or adjust the low-stock threshold",
        detail: "Edit {product} so its low-stock alert fires early enough to reorder in time.",
        action: "Edit threshold",
        link: "/products",
        linkLabel: "Edit product",
        verify: "Threshold saved on the product.",
      },
      {
        title: "Order ahead",
        detail: "Create a purchase order with your supplier before the stock hits zero.",
        action: "Create a purchase order",
        verify: "Order placed with quantity and date.",
      },
      {
        title: "Confirm and resolve",
        detail: "Once stock is replenished, resolve this anomaly.",
        action: "Resolve",
        verify: "Status changes to Resolved.",
      },
    ],
  },
  baisse_ventes: {
    title: "Recover the sales drop",
    summary: "Sales slipped {deviation}. Diagnose the cause, act on it, then confirm the recovery.",
    link: "/sales",
    linkLabel: "Open sales",
    steps: [
      {
        title: "Diagnose the cause",
        detail: "Open sales history and compare recent weeks: price change, stock-out, seasonality, or a lost channel?",
        action: "Review sales history",
        link: "/sales",
        linkLabel: "Open sales",
        verify: "You can name the most likely cause.",
      },
      {
        title: "Check price, stock and reviews",
        detail: "For {product}: still in stock, price competitive, recent reviews positive?",
        action: "Check product, stock and reviews",
        link: "/products",
        linkLabel: "Check product",
        verify: "No hidden blocker found (or noted).",
      },
      {
        title: "Launch a corrective action",
        detail: "Run a promotion, restock, fix the listing, or follow up with customers.",
        action: "See AI recommendations",
        link: "/recommendations",
        linkLabel: "Open recommendations",
        verify: "At least one action launched.",
      },
      {
        title: "Confirm the recovery and resolve",
        detail: "Watch the next sales. When the trend is back, resolve this anomaly.",
        action: "Resolve",
        verify: "Sales back on trend, status Resolved.",
      },
    ],
  },
  pic_ventes: {
    title: "Ride the sales spike",
    summary: "Demand surged {deviation}. Make sure stock and fulfilment keep up.",
    link: "/products",
    linkLabel: "Open products",
    steps: [
      {
        title: "Verify stock covers demand",
        detail: "Check that {product} has enough units for the spike. Reorder fast if tight.",
        action: "Check stock",
        link: "/products",
        linkLabel: "Open products",
        verify: "Stock covers the next selling days.",
      },
      {
        title: "Protect fulfilment",
        detail: "Confirm supplier lead time and delivery capacity so orders ship on time.",
        action: "Confirm with supplier",
        verify: "No delivery risk identified.",
      },
      {
        title: "Resolve",
        detail: "Once stock is safe, resolve this anomaly.",
        action: "Resolve",
        verify: "Status changes to Resolved.",
      },
    ],
  },
  avis_negatifs: {
    title: "Fix the negative reviews",
    summary: "{product} gets negative feedback. Read reviews, fix the cause, reply, then resolve.",
    link: "/reviews",
    linkLabel: "Open reviews",
    steps: [
      {
        title: "Read the recent reviews",
        detail: "Open reviews and read what customers complain about for {product}.",
        action: "Read reviews",
        link: "/reviews",
        linkLabel: "Open reviews",
        verify: "Top complaint identified.",
      },
      {
        title: "Fix the root cause",
        detail: "Quality, delivery, description mismatch? Fix the product or process.",
        action: "Fix product or process",
        link: "/products",
        linkLabel: "Open products",
        verify: "Fix applied.",
      },
      {
        title: "Reply to unhappy customers",
        detail: "Acknowledge, explain the fix, offer a solution.",
        action: "Reply to reviews",
        link: "/reviews",
        linkLabel: "Reply in reviews",
        verify: "Customers answered.",
      },
      {
        title: "Confirm and resolve",
        detail: "When new reviews turn positive again, resolve this anomaly.",
        action: "Resolve",
        verify: "Sentiment recovered, status Resolved.",
      },
    ],
  },
};

const FALLBACK_KEY = "baisse_ventes";

function interpolate(text, vars) {
  if (typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null && vars[key] !== ""
      ? String(vars[key])
      : `{${key}}`
  );
}

function buildPlan(anomaly) {
  anomaly = anomaly || {};
  const rawType = String(anomaly.type || "").toLowerCase();
  const template = PLANS[rawType] || PLANS[FALLBACK_KEY];
  const product = anomaly.product_name || anomaly.product || "this product";
  const stock = anomaly.stock !== undefined && anomaly.stock !== null ? anomaly.stock : "low";
  const deviation =
    anomaly.deviation_pct !== undefined && anomaly.deviation_pct !== null
      ? Math.abs(Number(anomaly.deviation_pct)) + "%"
      : "significantly";
  const vars = { product: product, stock: stock, deviation: deviation };
  const doneList = Array.isArray(anomaly.resolution_steps) ? anomaly.resolution_steps : [];
  const doneSet = new Set(doneList.map(Number).filter((n) => Number.isInteger(n)));
  const steps = template.steps.map((s, index) => ({
    index: index,
    title: interpolate(s.title, vars),
    detail: interpolate(s.detail, vars),
    action: interpolate(s.action, vars),
    link: s.link || null,
    linkLabel: s.linkLabel || null,
    verify: interpolate(s.verify, vars),
    done: doneSet.has(index),
  }));
  const firstOpen = steps.find((s) => !s.done);
  const baseStep =
    Number.isInteger(anomaly.current_step) && anomaly.current_step >= 0
      ? anomaly.current_step
      : firstOpen
        ? firstOpen.index
        : steps.length;
  return {
    type: PLANS[rawType] ? rawType : FALLBACK_KEY,
    title: interpolate(template.title, vars),
    summary: interpolate(template.summary, vars),
    link: template.link || null,
    linkLabel: template.linkLabel || null,
    steps: steps,
    current_step: Math.min(baseStep, steps.length),
    total_steps: steps.length,
    completed_steps: steps.filter((s) => s.done).length,
  };
}

module.exports = { PLANS: PLANS, buildPlan: buildPlan };

