"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ProductPreview } from "@/components/product-preview";
import { CustomUIMessage, ProductPreviewsData, Prompt } from "@/lib/types";
import { Loader2, Send } from "lucide-react";

export function Chat() {
  const [input, setInput] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showPrompts, setShowPrompts] = useState(true);

  const { messages, sendMessage, status } = useChat<CustomUIMessage>({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Fetch prompts on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch("/api/prompts");
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchPrompts();
  }, []);

  // Hide prompts when user types or sends a message
  useEffect(() => {
    if (messages.length > 0 || input.length > 0) {
      setShowPrompts(false);
    }
  }, [messages.length, input.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handlePromptClick = (promptText: string) => {
    sendMessage({ content: promptText });
    setShowPrompts(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Tobi Chat</h1>
        <p className="text-sm text-muted-foreground">
          Chat with the shopping assistant
        </p>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && !showPrompts && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation...</p>
            </div>
          )}

          {messages.length === 0 && showPrompts && prompts.length > 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-semibold mb-1">
                  How can I help you today?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Try one of these suggestions
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {prompts
                  .sort((a, b) => a.position - b.position)
                  .map((prompt) => (
                    <Button
                      key={prompt.position}
                      variant="outline"
                      size="lg"
                      onClick={() => handlePromptClick(prompt.prompt)}
                      className="rounded-full gap-2 hover:scale-[1.02] transition-transform"
                    >
                      <span className="text-lg">{prompt.emoji}</span>
                      <span>{prompt.title}</span>
                    </Button>
                  ))}
              </div>
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

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Card className="mt-4 p-3 shadow-lg border-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ content: input });
              setInput("");
            }
          }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="pr-4 py-6 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none outline-none"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            size="lg"
            className="h-11 px-6 shrink-0 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
