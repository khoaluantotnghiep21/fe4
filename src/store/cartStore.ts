import { create } from "zustand";
import { message } from "antd";

export interface CartItem {
  id: string;
  name: string;
  option: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string, option: string) => Promise<void>;
  updateQuantity: (id: string, option: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadUserCart: () => Promise<void>;
}

const CART_STORAGE_KEY = "user_cart";

const saveToStorage = (userId: string, items: CartItem[]) => {
  try {
    const allCarts = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
    allCarts[userId] = items;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(allCarts));
    return true;
  } catch (error) {
    console.error("Error saving cart to storage:", error);
    return false;
  }
};

const loadFromStorage = (userId: string): CartItem[] => {
  try {
    const allCarts = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
    return allCarts[userId] || [];
  } catch (error) {
    console.error("Error loading cart from storage:", error);
    return [];
  }
};

// Load initial cart data
const getInitialCartData = () => {
  try {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) return [];
    
    const user = JSON.parse(userInfo);
    return loadFromStorage(user.id);
  } catch (error) {
    console.error("Error loading initial cart data:", error);
    return [];
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: getInitialCartData(),
  isLoading: false,

  loadUserCart: async () => {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) return;

    set({ isLoading: true });
    try {
      const user = JSON.parse(userInfo);
      const items = loadFromStorage(user.id);
      set({ items });
    } catch (error) {
      console.error("Error loading user cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) {
      message.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    set({ isLoading: true });
    try {
      const user = JSON.parse(userInfo);
      const state = get();
      const existingItem = state.items.find(
        (i) => i.id === item.id && i.option === item.option
      );

      let newItems;
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.id === item.id && i.option === item.option
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }

      const success = saveToStorage(user.id, newItems);
      if (success) {
        set({ items: newItems });
      } else {
        message.error("Không thể thêm sản phẩm vào giỏ hàng!");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!");
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (id, option) => {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) return;

    set({ isLoading: true });
    try {
      const user = JSON.parse(userInfo);
      const state = get();
      const newItems = state.items.filter(
        (item) => !(item.id === id && item.option === option)
      );

      const success = saveToStorage(user.id, newItems);
      if (success) {
        set({ items: newItems });
      } else {
        message.error("Không thể xóa sản phẩm khỏi giỏ hàng!");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng!");
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (id, option, quantity) => {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) return;

    set({ isLoading: true });
    try {
      const user = JSON.parse(userInfo);
      const state = get();
      const newItems = state.items.map((item) =>
        item.id === id && item.option === option
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      );

      const success = saveToStorage(user.id, newItems);
      if (success) {
        set({ items: newItems });
      } else {
        message.error("Không thể cập nhật số lượng sản phẩm!");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật số lượng sản phẩm!");
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    const userInfo = localStorage.getItem("user_information");
    if (!userInfo) return;

    set({ isLoading: true });
    try {
      const user = JSON.parse(userInfo);
      const success = saveToStorage(user.id, []);
      if (success) {
        set({ items: [] });
      } else {
        message.error("Không thể xóa giỏ hàng!");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa giỏ hàng!");
    } finally {
      set({ isLoading: false });
    }
  },
}));
