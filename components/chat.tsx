"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductPreview } from "@/components/product-preview";
import { CustomUIMessage, ProductPreviewsData, Prompt, TimingStep } from "@/lib/types";
import { Loader2, Send, Clock, ChevronDown, ChevronUp } from "lucide-react";

export function Chat() {
  const [input, setInput] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showPrompts, setShowPrompts] = useState(true);
  const [messageTiming, setMessageTiming] = useState<Record<string, number>>({});
  const [messageTimingSteps, setMessageTimingSteps] = useState<Record<string, TimingStep[]>>({});
  const [expandedTiming, setExpandedTiming] = useState<Record<string, boolean>>({});
  const [liveElapsedTime, setLiveElapsedTime] = useState<number>(0);
  const requestStartTimeRef = useRef<number | null>(null);
  const pendingMessageIdRef = useRef<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, sendMessage, status } = useChat<CustomUIMessage>({
    api: "/api/chat",
  } as any);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Start/stop live timer when loading
  useEffect(() => {
    if (isLoading && requestStartTimeRef.current !== null) {
      // Start the live timer interval
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          if (requestStartTimeRef.current !== null) {
            setLiveElapsedTime(Date.now() - requestStartTimeRef.current);
          }
        }, 50); // Update every 50ms for smooth counting
      }
    } else {
      // Clear the interval when not loading
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isLoading]);

  // Track when actual text content arrives to calculate time to first token
  useEffect(() => {
    if (requestStartTimeRef.current !== null) {
      // Find the latest assistant message
      const latestAssistantMessage = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");

      if (latestAssistantMessage) {
        // Check if this message has actual text content
        const textParts = latestAssistantMessage.parts?.filter(
          (part: any) => part.type === "text"
        );
        const textContent = textParts?.map((part: any) => part.text).join("");
        const hasContent = textContent && textContent.length > 0;

        // If we have content and haven't recorded timing for this message yet
        if (hasContent && pendingMessageIdRef.current !== latestAssistantMessage.id) {
          const timeToFirstToken = Date.now() - requestStartTimeRef.current;

          setMessageTiming((prev) => ({
            ...prev,
            [latestAssistantMessage.id]: timeToFirstToken,
          }));
          pendingMessageIdRef.current = latestAssistantMessage.id;
          requestStartTimeRef.current = null; // Reset the timer
          setLiveElapsedTime(0); // Reset live elapsed time

          // Clear the interval
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        }
      }
    }
  }, [messages]);

  // Collect timing data from messages
  useEffect(() => {
    messages.forEach((message: any) => {
      if (message.role === "assistant" && message.parts) {
        // Find timing data parts
        const timingParts = message.parts.filter(
          (part: any) => part.type === "data-timing"
        );

        if (timingParts.length > 0) {
          setMessageTimingSteps((prev) => {
            const existingSteps = prev[message.id] || [];
            const newSteps = timingParts.flatMap((part: any) => part.data?.steps || []);

            // Merge steps, avoiding duplicates based on step name
            const allSteps = [...existingSteps];
            newSteps.forEach((newStep: TimingStep) => {
              const existingIndex = allSteps.findIndex(s => s.step === newStep.step);
              if (existingIndex === -1) {
                allSteps.push(newStep);
              } else {
                // Update if the new one has more data
                allSteps[existingIndex] = newStep;
              }
            });

            return {
              ...prev,
              [message.id]: allSteps,
            };
          });
        }
      }
    });
  }, [messages]);

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
    requestStartTimeRef.current = Date.now();
    sendMessage({ content: promptText } as any);
    setShowPrompts(false);
  };

  // Helper function to render timing breakdown
  const renderTimingBreakdown = (steps: TimingStep[], messageId: string) => {
    const isExpanded = expandedTiming[messageId] || false;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    // Organize steps for better display
    const stepOrder = [
      "routing",
      "mcp_client",
      "tools_loading",
      "llm_first_chunk",
      "conversation_llm_first_chunk",
      "llm_step_1",
      "llm_step_2",
      "llm_step_3",
      "llm_step_4",
      "llm_step_5",
      "llm_total",
      "conversation_llm_total",
    ];

    const sortedSteps = [...steps].sort((a, b) => {
      const aIndex = stepOrder.findIndex(s => a.step.startsWith(s));
      const bIndex = stepOrder.findIndex(s => b.step.startsWith(s));
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    const formatStepName = (step: string) => {
      return step
        .replace(/_/g, " ")
        .replace(/llm/g, "LLM")
        .replace(/mcp/g, "MCP")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return (
      <div className="mt-2 text-xs">
        <button
          onClick={() =>
            setExpandedTiming((prev) => ({
              ...prev,
              [messageId]: !isExpanded,
            }))
          }
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <Clock className="h-3 w-3" />
          <span>
            Total: {totalDuration.toFixed(0)}ms ({sortedSteps.length} steps)
          </span>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
            {sortedSteps.map((step, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">{formatStepName(step.step)}</div>
                  {step.metadata?.toolName && (
                    <div className="text-muted-foreground text-[10px]">
                      Tool: {step.metadata.toolName}
                    </div>
                  )}
                  {step.metadata?.tokens && (
                    <div className="text-muted-foreground text-[10px]">
                      Tokens: {step.metadata.tokens}
                      {step.metadata.reasoningTokens
                        ? ` (${step.metadata.reasoningTokens} reasoning)`
                        : ""}
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground whitespace-nowrap">
                  {step.duration.toFixed(0)}ms
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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

          {messages.map((message: any) => {
            // Extract text from parts
            const textParts = message.parts?.filter(
              (part: any) => part.type === "text"
            );
            const textContent = textParts?.map((part: any) => part.text).join("");
            const timing = messageTiming[message.id];
            const timingSteps = messageTimingSteps[message.id] || [];

            // Check for product previews
            const hasProductPreviews = message.parts?.some(
              (part: any) => part.type === "data-productPreviews"
            );

            // Check if this is the latest assistant message being streamed
            const isLatestAssistant = message.role === "assistant" &&
              messages[messages.length - 1]?.id === message.id;
            const showLiveTimer = isLatestAssistant && isLoading && timing === undefined;

            // Only render if there's actual content (text, products, or timing for latest message)
            const hasContent = textContent || message.content || hasProductPreviews;
            const hasVisibleTiming = timingSteps.length > 0 && isLatestAssistant;

            if (!hasContent && !hasVisibleTiming && message.role === "assistant") {
              return null; // Skip rendering empty assistant messages without timing
            }

            return (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Only show card if there's actual content */}
                {hasContent && (
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
                )}

                {/* Show timing information for assistant messages */}
                {message.role === "assistant" && (
                  <div className={`${hasContent ? 'mt-1' : ''} max-w-[80%] w-full`}>
                    {/* Original TTFT timing badge */}
                    {(timing !== undefined || showLiveTimer) && (
                      <Badge variant="secondary" className="text-xs mb-1">
                        <Clock className="h-3 w-3" />
                        TTFT: {timing !== undefined ? `${timing}ms` : `${liveElapsedTime}ms`}
                      </Badge>
                    )}

                    {/* Detailed timing breakdown */}
                    {timingSteps.length > 0 && (
                      <div className="bg-muted/50 rounded-md px-3 py-2">
                        {renderTimingBreakdown(timingSteps, message.id)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Show loading indicator with live timer when waiting for first response */}
          {isLoading && requestStartTimeRef.current !== null && 
           messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="flex flex-col items-start">
              <Card className="max-w-[80%] p-4 bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </Card>
              <Badge variant="secondary" className="mt-1 text-xs">
                <Clock className="h-3 w-3" />
                {liveElapsedTime}ms
              </Badge>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <Card className="mt-4 p-3 shadow-lg border-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              requestStartTimeRef.current = Date.now();
              sendMessage({ content: input } as any);
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
