"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompetitionBadge =
  | "PREMIER_LEAGUE" | "CHAMPIONS_LEAGUE" | "EUROPA_LEAGUE"
  | "FA_CUP" | "SERIE_A" | "LA_LIGA" | "BUNDESLIGA" | "LIGUE_1" | "NONE" | "WORLD_CUP";

export type CartItem = {
  id:        number;
  name:      string;
  price:     number;
  quantity:  number;
  size?:     string;
  version?:  string;
  image?:    string;
  variantId?: string;
  // Customisation
  competitionBadge?: CompetitionBadge;
  playerName?:       string;
  playerNumber?:     string;
};

type CartContextType = {
  cart:        CartItem[];
  loading:     boolean;
  addToCart:   (item: CartItem) => Promise<void>;
  removeFromCart: (id: number, size?: string, version?: string) => Promise<void>;
  updateQuantity: (id: number, size: string | undefined, version: string | undefined, quantity: number) => Promise<void>;
  updateCustomisation: (
    id: number,
    size: string | undefined,
    version: string | undefined,
    customisation: { competitionBadge: CompetitionBadge; playerName: string; playerNumber: string }
  ) => void;
  clearCart: () => Promise<void>;
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "jersey_cart";

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

function clearStorage() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ─── DB → CartItem mapper ─────────────────────────────────────────────────────
// Converts the shape returned by /api/cart into our CartItem type

function mapDbItem(dbItem: any): CartItem {
  const product = dbItem.variant?.product;
  return {
    id:        product?.id        ?? 0,
    name:      product?.name      ?? "",
    price:     product?.price     ?? 0,
    image:     product?.image     ?? "",
    quantity:  dbItem.quantity,
    size:      dbItem.variant?.size,
    version:   dbItem.variant?.version,
    variantId: dbItem.variantId ?? dbItem.variant?.id,
    // Customisation not stored in DB — preserved from localStorage on merge
    competitionBadge: undefined,
    playerName:       undefined,
    playerNumber:     undefined,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn  = status === "authenticated" && !!session?.user?.id;
  const isLoading   = status === "loading";

  const [cart,    setCart]    = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref to track whether we've already done the merge for this session
  const hasMerged = useRef(false);

  // ── Helper: find item in cart ──
  const findItem = (items: CartItem[], id: number, size?: string, version?: string) =>
    items.find((i) => i.id === id && i.size === size && i.version === version);

  // ── Load cart on mount / auth change ──
  useEffect(() => {
    if (isLoading) return; // wait for session to resolve

    const init = async () => {
      setLoading(true);

      if (isLoggedIn) {
        try {
          // 1. Load server cart
          const res  = await fetch("/api/cart");
          const data = await res.json();
          const serverItems: CartItem[] = (data.items || []).map(mapDbItem);

          // 2. Check for guest items in localStorage to merge
          const guestItems = loadFromStorage();

          if (guestItems.length > 0 && !hasMerged.current) {
            hasMerged.current = true;

            // Merge guest items into server cart via PUT
            const mergeRes  = await fetch("/api/cart", {
              method:  "PUT",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                items: guestItems.map((i) => ({
                  variantId: i.variantId,
                  quantity:  i.quantity,
                })),
              }),
            });
            const mergeData = await mergeRes.json();

            // Use merged server cart, but preserve customisation from localStorage
            const mergedItems: CartItem[] = (mergeData.items || []).map((dbItem: any) => {
              const mapped = mapDbItem(dbItem);
              // Re-attach customisation from guest items if present
              const guest = guestItems.find((g) => g.variantId === mapped.variantId);
              return {
                ...mapped,
                competitionBadge: guest?.competitionBadge,
                playerName:       guest?.playerName,
                playerNumber:     guest?.playerNumber,
              };
            });

            setCart(mergedItems);
            clearStorage(); // guest cart merged — clear localStorage
          } else {
            setCart(serverItems);
          }
        } catch (err) {
          console.error("Cart load error:", err);
          // Fallback to localStorage if API fails
          setCart(loadFromStorage());
        }
      } else {
        // Guest — load from localStorage only
        hasMerged.current = false;
        setCart(loadFromStorage());
      }

      setLoading(false);
    };

    init();
  }, [isLoggedIn, isLoading]);

  // ── Persist to localStorage whenever cart changes (guest only) ──
  useEffect(() => {
    if (!isLoggedIn && !isLoading && !loading) {
      saveToStorage(cart);
    }
  }, [cart, isLoggedIn, isLoading, loading]);

  // ─── addToCart ─────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (item: CartItem) => {
    if (isLoggedIn && item.variantId) {
      try {
        const res  = await fetch("/api/cart", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ variantId: item.variantId, quantity: item.quantity }),
        });
        const data = await res.json();

        if (data.success) {
          const serverItem = mapDbItem(data.item);
          setCart((prev) => {
            const existing = findItem(prev, item.id, item.size, item.version);
            if (existing) {
              return prev.map((i) =>
                i.id === item.id && i.size === item.size && i.version === item.version
                  ? { ...i, quantity: serverItem.quantity }
                  : i
              );
            }
            return [...prev, { ...serverItem, ...item, quantity: serverItem.quantity }];
          });
          return;
        }
      } catch (err) {
        console.error("addToCart DB error:", err);
        // Fall through to local update on API failure
      }
    }

    // Guest or API failure — update local state only
    setCart((prev) => {
      const existing = findItem(prev, item.id, item.size, item.version);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.version === item.version
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }, [isLoggedIn]);

  // ─── removeFromCart ────────────────────────────────────────────────────────

  const removeFromCart = useCallback(async (id: number, size?: string, version?: string) => {
    const item = findItem(cart, id, size, version);

    if (isLoggedIn && item?.variantId) {
      try {
        await fetch(`/api/cart?variantId=${encodeURIComponent(item.variantId)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("removeFromCart DB error:", err);
      }
    }

    setCart((prev) =>
      prev.filter((i) => !(i.id === id && i.size === size && i.version === version))
    );
  }, [isLoggedIn, cart]);

  // ─── updateQuantity ────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (
    id: number,
    size: string | undefined,
    version: string | undefined,
    quantity: number
  ) => {
    if (quantity < 1) {
      return removeFromCart(id, size, version);
    }

    const item = findItem(cart, id, size, version);

    if (isLoggedIn && item?.variantId) {
      try {
        await fetch("/api/cart", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ variantId: item.variantId, quantity }),
        });
      } catch (err) {
        console.error("updateQuantity DB error:", err);
      }
    }

    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.size === size && i.version === version
          ? { ...i, quantity }
          : i
      )
    );
  }, [isLoggedIn, cart, removeFromCart]);

  // ─── updateCustomisation ───────────────────────────────────────────────────
  // Customisation (badge, name, number) is local-only — not stored in DB
  // It travels to the checkout via the cart state and order payload

  const updateCustomisation = useCallback((
    id: number,
    size: string | undefined,
    version: string | undefined,
    customisation: { competitionBadge: CompetitionBadge; playerName: string; playerNumber: string }
  ) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.size === size && i.version === version
          ? { ...i, ...customisation }
          : i
      )
    );
  }, []);

  // ─── clearCart ─────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        // Delete all cart items for this user sequentially
        for (const item of cart) {
          if (item.variantId) {
            await fetch(`/api/cart?variantId=${encodeURIComponent(item.variantId)}`, {
              method: "DELETE",
            });
          }
        }
      } catch (err) {
        console.error("clearCart DB error:", err);
      }
    }
    clearStorage();
    setCart([]);
  }, [isLoggedIn, cart]);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCustomisation,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}