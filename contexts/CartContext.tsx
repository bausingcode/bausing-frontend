"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: string;
  quantity: number;
}

interface FavoritesItem {
  id: string;
  name: string;
  image: string;
  price: string;
}

interface CartContextType {
  cart: CartItem[];
  favorites: FavoritesItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  addToFavorites: (item: FavoritesItem) => void;
  removeFromFavorites: (id: string) => void;
  isInCart: (id: string) => boolean;
  isInFavorites: (id: string) => boolean;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<FavoritesItem[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Cargar desde localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem("bausing_cart");
    const savedFavorites = localStorage.getItem("bausing_favorites");
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
    
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("bausing_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("bausing_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Disparar evento personalizado para abrir el carrito
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartItemAdded'));
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const addToFavorites = (item: FavoritesItem) => {
    if (!isAuthenticated) {
      // Use replace instead of push to avoid adding to history, but this shouldn't cause page reload
      router.replace("/login");
      return;
    }
    setFavorites((prev) => {
      if (prev.find((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const isInCart = (id: string) => {
    return cart.some((item) => item.id === id);
  };

  const isInFavorites = (id: string) => {
    return favorites.some((item) => item.id === id);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        favorites,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToFavorites,
        removeFromFavorites,
        isInCart,
        isInFavorites,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

