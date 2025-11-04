# Tobi Frontend Test

A Next.js frontend for testing the vipps-tobi backend with real-time chat streaming and rich product previews.

## Features

- **Real-time Streaming**: Uses Vercel AI SDK v5 with Server-Sent Events (SSE) for live chat responses
- **Rich Previews**: Displays product cards with images, prices, and shop information
- **Modern UI**: Built with Next.js 15, shadcn/ui, and Tailwind CSS
- **Type-safe**: Full TypeScript support matching backend types

## Getting Started

### Prerequisites

- Node.js 18+
- vipps-tobi backend running (default: http://localhost:3000)

### Installation

```bash
npm install
```

### Configuration

Update `.env.local` with your backend URL:

```env
BACKEND_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3333](http://localhost:3333) in your browser.

## How It Works

### Backend Integration

The frontend proxies chat requests to the vipps-tobi backend:

1. User sends a message via the chat UI
2. Frontend sends POST request to `/api/chat`
3. API route forwards to backend's `/chat` endpoint
4. Backend streams response using SSE (Server-Sent Events)
5. Frontend receives and displays:
   - Text responses in real-time
   - Product previews as custom data parts

### Custom Data Parts

The backend sends product data using the Vercel AI SDK's data parts system:

```typescript
{
  type: "data-productPreviews",
  data: {
    products: [
      {
        title: "Product Name",
        price: "99 kr",
        shopName: "Shop Name",
        shopUrl: "https://...",
        imageUrl: "https://..."
      }
    ]
  }
}
```

The frontend renders these as product cards using the `ProductPreview` component.

## Project Structure

```
├── app/
│   ├── api/chat/route.ts      # Proxy to backend
│   ├── page.tsx                # Main chat page
│   └── globals.css             # Global styles
├── components/
│   ├── chat.tsx                # Main chat component with useChat
│   ├── product-preview.tsx     # Product card component
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── types.ts                # TypeScript types matching backend
│   └── utils.ts                # Utilities
└── .env.local                  # Environment variables
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Streaming**: Vercel AI SDK v5 (Server-Sent Events)
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## Streaming Protocol

This app uses the latest streaming approach (November 2025):

- **Server-Sent Events (SSE)**: Standard streaming protocol
- **Data Stream Protocol**: Vercel AI SDK v5's built-in protocol
- **Custom Data Parts**: Type-safe custom data streaming
- **Progressive Loading**: Products appear as they're discovered

## Authentication

If your backend requires authentication, you can add the Authorization header in the chat component:

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } =
  useChat<CustomUIMessage>({
    api: "/api/chat",
    headers: {
      Authorization: "Bearer YOUR_TOKEN",
    },
  });
```
