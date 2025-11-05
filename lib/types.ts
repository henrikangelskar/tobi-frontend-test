import type { UIMessage } from "ai";

// Product preview data structure matching backend
export type Product = {
  title: string;
  price: string;
  shopName: string;
  shopUrl: string;
  imageUrl?: string;
  preOwned?: boolean;
};

export type ProductPreviewsData = {
  products: Product[];
};

// Define custom data parts for product previews
type CustomDataParts = {
  productPreviews?: ProductPreviewsData;
};

export type CustomUIMessage = UIMessage<unknown, CustomDataParts>;

// Prompt/suggestion from backend
export type Prompt = {
  position: number;
  emoji: string;
  title: string;
  description: string;
  prompt: string;
};
