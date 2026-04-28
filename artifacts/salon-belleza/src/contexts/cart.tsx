import { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (product_id: number) => void;
  setQty: (product_id: number, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue>({
  items: [], add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}, count: 0, subtotal: 0,
});

const STORAGE_KEY = "salon_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartContextValue["add"] = (item, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(p => p.product_id === item.product_id);
      if (existing) {
        return prev.map(p => p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p);
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };
  const remove = (id: number) => setItems(prev => prev.filter(p => p.product_id !== id));
  const setQty = (id: number, q: number) => {
    if (q <= 0) return remove(id);
    setItems(prev => prev.map(p => p.product_id === id ? { ...p, quantity: q } : p));
  };
  const clear = () => setItems([]);

  const count = items.reduce((s, x) => s + x.quantity, 0);
  const subtotal = items.reduce((s, x) => s + x.quantity * x.price, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
