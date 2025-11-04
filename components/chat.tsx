"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ProductPreview } from "@/components/product-preview";
import { CustomUIMessage, ProductPreviewsData } from "@/lib/types";
import { Loader2, Send } from "lucide-react";

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat<CustomUIMessage>({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Debug: log messages when they change
  useEffect(() => {
    console.log("Messages:", messages);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Tobi Chat</h1>
        <p className="text-sm text-muted-foreground">
          Chat with the shopping assistant
        </p>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation...</p>
            </div>
          )}

          {messages.map((message) => {
            // Extract text from parts
            const textParts = message.parts?.filter(
              (part: any) => part.type === "text"
            );
            const textContent = textParts?.map((part: any) => part.text).join("");

            return (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Render text content from parts or fallback to content */}
                    {(textContent || message.content) && (
                      <div className="whitespace-pre-wrap">
                        {textContent || message.content}
                      </div>
                    )}

                    {/* Render product previews from data parts */}
                    {message.parts &&
                      message.parts
                        .filter((part: any) => part.type === "data-productPreviews")
                        .map((part: any, index: number) => {
                          const data = part.data as ProductPreviewsData;
                          return (
                            <ProductPreview key={index} products={data.products} />
                          );
                        })}
                  </div>
                </Card>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </Card>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ content: input });
            setInput("");
          }
        }}
        className="mt-4 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
