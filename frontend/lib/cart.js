/**
 * Shared storefront cart state (localStorage backed).
 * One source of truth so the header drawer, cards, product page and
 * cart page always agree — even across tabs.
 */
import { useCallback, useEffect, useState } from "react";
import { priceOf, hasPromotion } from "./money";

const CART_EVENT = "storefront:cart-changed";
const WISHLIST_EVENT = "storefront:wishlist-changed";

const cartKey = (userId) => `cart_${userId}`;
const wishlistKey = (userId) => `wishlist_${userId}`;

const read = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const write = (key, value, eventName) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
  return value;
};

/* ----------------------------- cart ----------------------------- */

export const getCart = (userId) => (userId ? read(cartKey(userId)) : []);

export const setCart = (userId, items) =>
  userId ? write(cartKey(userId), items, CART_EVENT) : [];

export const addToCart = (userId, product, quantity = 1) => {
  if (!userId || !product) return [];
  const cart = getCart(userId);
  const existing = cart.find((item) => item.id === product.id);

  const maxQty = Number.isFinite(Number(product.stock))
    ? Number(product.stock)
    : Infinity;

  if (existing) {
    existing.quantity = Math.min(
      (existing.quantity || 1) + quantity,
      Math.max(1, maxQty),
    );
    // keep price fresh (promotions may have changed)
    existing.price = priceOf(product);
    existing.original_price = hasPromotion(product) ? Number(product.price) : null;
    existing.stock = product.stock;
  } else {
    cart.push({
      ...product,
      price: priceOf(product),
      original_price: hasPromotion(product) ? Number(product.price) : null,
      quantity: Math.min(quantity, Math.max(1, maxQty)),
    });
  }
  return setCart(userId, cart);
};

export const setQuantity = (userId, productId, quantity) => {
  const cart = getCart(userId);
  const next =
    quantity <= 0
      ? cart.filter((item) => item.id !== productId)
      : cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.min(quantity, item.stock ?? Infinity) }
            : item,
        );
  return setCart(userId, next);
};

export const removeFromCart = (userId, productId) => {
  const cart = getCart(userId);
  return setCart(userId, cart.filter((item) => item.id !== productId));
};

export const clearCart = (userId) => setCart(userId, []);

export const cartCount = (items = []) =>
  items.reduce((sum, item) => sum + (item.quantity || 0), 0);

export const cartSubtotal = (items = []) =>
  items.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 0),
    0,
  );

/* --------------------------- wishlist --------------------------- */

export const getWishlist = (userId) => (userId ? read(wishlistKey(userId)) : []);

export const toggleWishlist = (userId, product) => {
  if (!userId || !product) return [];
  const list = getWishlist(userId);
  const exists = list.some((item) => item.id === product.id);
  const next = exists
    ? list.filter((item) => item.id !== product.id)
    : [...list, { ...product, price: priceOf(product) }];
  write(wishlistKey(userId), next, WISHLIST_EVENT);
  return next;
};

export const removeFromWishlist = (userId, productId) => {
  const list = getWishlist(userId);
  return write(
    wishlistKey(userId),
    list.filter((item) => item.id !== productId),
    WISHLIST_EVENT,
  );
};

export const inWishlist = (userId, productId) =>
  getWishlist(userId).some((item) => item.id === productId);

/* ----------------------------- hooks ---------------------------- */

function useLocalState(keyFn, readFn, event, userId) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setHydrated(true);
      return;
    }
    const sync = () => setItems(readFn(userId));
    sync();
    setHydrated(true);
    const onStorage = (e) => {
      if (e.key === keyFn(userId)) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(event, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(event, sync);
    };
  }, [userId]);

  return [items, setItems, hydrated];
}

export function useCart(userId) {
  const [items, , hydrated] = useLocalState(
    cartKey,
    getCart,
    CART_EVENT,
    userId,
  );

  const add = useCallback(
    (product, quantity = 1) => (userId ? addToCart(userId, product, quantity) : []),
    [userId],
  );
  const update = useCallback(
    (productId, quantity) =>
      userId ? setQuantity(userId, productId, quantity) : [],
    [userId],
  );
  const remove = useCallback(
    (productId) => (userId ? removeFromCart(userId, productId) : []),
    [userId],
  );
  const clear = useCallback(
    () => (userId ? clearCart(userId) : []),
    [userId],
  );

  return {
    items,
    hydrated,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    add,
    update,
    remove,
    clear,
  };
}

export function useWishlist(userId) {
  const [items, , hydrated] = useLocalState(
    wishlistKey,
    getWishlist,
    WISHLIST_EVENT,
    userId,
  );

  const toggle = useCallback(
    (product) => (userId ? toggleWishlist(userId, product) : []),
    [userId],
  );
  const remove = useCallback(
    (productId) => (userId ? removeFromWishlist(userId, productId) : []),
    [userId],
  );

  return {
    items,
    hydrated,
    count: items.length,
    has: (productId) => items.some((i) => i.id === productId),
    toggle,
    remove,
  };
}
