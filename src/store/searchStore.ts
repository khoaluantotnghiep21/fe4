import { create } from 'zustand';
import { Product } from '@/types/product.types';

interface SearchState {
  searchResults: {
    data: Product[];
    meta: {
      total: number;
      page: number;
      take: number;
      pageCount: number;
    };
  } | null;
  setSearchResults: (results: {
    data: Product[];
    meta: {
      total: number;
      page: number;
      take: number;
      pageCount: number;
    };
  }) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchResults: null,
  setSearchResults: (results) => set({ searchResults: results }),
}));