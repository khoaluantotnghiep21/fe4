import { create } from "zustand";

interface CartItem {
  id: string;
  name: string;
  option: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, option: string) => void;
  updateQuantity: (id: string, option: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.id === item.id && i.option === item.option
      );
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id && i.option === item.option
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (id, option) =>
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.id === id && item.option === option)
      ),
    })),
  updateQuantity: (id, option, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id && item.option === option
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    })),
  clearCart: () => set({ items: [] }),
}));
