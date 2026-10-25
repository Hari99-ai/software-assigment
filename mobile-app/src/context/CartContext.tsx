// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { CartItem, Product } from "../types";
import { useAuth } from "./AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const cartKey = user ? `cart_${user.uid}` : "cart_guest";
  const [items, setItems] = useState<CartItem[]>([]);

  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  // Hydrate before saving so switching users cannot overwrite another user's cart.
  useEffect(() => {
    let cancelled = false;
    const key = cartKey;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled) return;
        try {
          setItems(raw ? JSON.parse(raw) : []);
        } catch {
          setItems([]);
        }
        setHydratedKey(key);
      })
      .catch(() => {
        if (!cancelled) setHydratedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [cartKey]);

  // Persist cart to AsyncStorage on change
  useEffect(() => {
    const key = cartKey;
    if (hydratedKey === key)
      AsyncStorage.setItem(key, JSON.stringify(items)).catch(console.warn);
  }, [items, cartKey, hydratedKey]);

  const addToCart = (product: Product, quantity = 1) => {
    if (hydratedKey !== (user ? `cart_${user.uid}` : "cart_guest")) return;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || product.stock < 1)
      return;
    quantity = Math.min(quantity, product.stock);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i,
        );
      }
      return [...prev, { productId: product.id, product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.product.stock) }
          : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const isInCart = (productId: string) =>
    items.some((i) => i.productId === productId);

  const getItemQuantity = (productId: string) =>
    items.find((i) => i.productId === productId)?.quantity || 0;

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const dealer = user?.role === "dealer" && user?.dealerStatus === "approved";
  const subtotal = items.reduce(
    (sum, i) =>
      sum + (dealer ? i.product.wholesalePrice : i.product.price) * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items:
          hydratedKey === (user ? `cart_${user.uid}` : "cart_guest")
            ? items
            : [],
        itemCount:
          hydratedKey === (user ? `cart_${user.uid}` : "cart_guest")
            ? itemCount
            : 0,
        subtotal:
          hydratedKey === (user ? `cart_${user.uid}` : "cart_guest")
            ? subtotal
            : 0,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
