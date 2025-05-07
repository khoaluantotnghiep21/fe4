export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    discount?: string;
    options?: string[];
    originalPrice?: number;
    subText?: string;
  }