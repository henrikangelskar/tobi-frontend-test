"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, Brain, Wrench, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export type StepType = "reasoning" | "tool" | "text";

export type StepTiming = {
  id: string;
  type: StepType;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
};

type StepTimingProps = {
  steps: StepTiming[];
  isStreaming: boolean;
};

const getStepIcon = (type: StepType) => {
  switch (type) {
    case "reasoning":
      return <Brain className="h-4 w-4" />;
    case "tool":
      return <Wrench className="h-4 w-4" />;
    case "text":
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getStepColor = (type: StepType) => {
  switch (type) {
    case "reasoning":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    case "tool":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "text":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  }
};

const formatDuration = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

export function StepTiming({ steps, isStreaming }: StepTimingProps) {
  const [, setTick] = useState(0);

  // Force re-render every 100ms while streaming to update live timings
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming]);

  console.log('[StepTiming Component] Received steps:', steps, 'isStreaming:', isStreaming);

  if (steps.length === 0) {
    console.log('[StepTiming Component] No steps to display, returning null');
    return null;
  }

  const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);
  
  // Calculate total elapsed time from first step start to last step end (or now if streaming)
  const firstStepStart = steps.length > 0 ? Math.min(...steps.map(s => s.startTime)) : 0;
  const lastStepEnd = isStreaming 
    ? Date.now() 
    : steps.length > 0 ? Math.max(...steps.map(s => s.endTime || s.startTime)) : 0;
  const totalElapsed = lastStepEnd - firstStepStart;
  
  console.log('[StepTiming Component] Rendering accordion with', steps.length, 'steps');

  return (
    <div className="space-y-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="timing-overview" className="border rounded-lg bg-muted/30">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Timing</span>
              {!isStreaming && totalDuration > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono font-medium">
                    {formatDuration(totalDuration)}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{steps.length} steps</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            <div className="space-y-1">
              {steps.map((step) => {
                const isInProgress = !step.endTime && isStreaming;
                const currentDuration = isInProgress
                  ? Date.now() - step.startTime
                  : step.duration || 0;

                return (
                  <div
                    key={step.id}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${getStepColor(step.type)}`}>
                        {getStepIcon(step.type)}
                        <span className="font-medium truncate">{step.name}</span>
                      </div>
                      {isInProgress && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
                          ●
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">
                        {formatDuration(currentDuration)}
                        {isInProgress && "..."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Total time at the bottom */}
      {totalElapsed > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
          <Clock className="h-3 w-3" />
          <span>Total response time:</span>
          <span className="font-mono font-semibold text-foreground">
            {formatDuration(totalElapsed)}
            {isStreaming && "..."}
          </span>
        </div>
      )}
    </div>
  );
}
