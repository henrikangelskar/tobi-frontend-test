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

// Timing data structure matching backend
export type TimingStep = {
  step: string;
  duration: number;
  substeps?: TimingStep[];
  metadata?: {
    toolName?: string;
    tokens?: number;
    reasoningTokens?: number;
  };
};

export type TimingData = {
  steps: TimingStep[];
};

// Define custom data parts for product previews and timing
type CustomDataParts = {
  productPreviews?: ProductPreviewsData;
  timing?: TimingData;
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
