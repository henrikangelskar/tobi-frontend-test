export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log("Messages received:", JSON.stringify(messages, null, 2));

  // Transform messages to ensure they have the parts array structure
  const transformedMessages = messages.map((msg: any) => {
    // If message already has parts, return as is
    if (msg.parts) {
      return msg;
    }

    // Otherwise, create parts array from content
    return {
      ...msg,
      parts: msg.content ? [{ type: "text", text: msg.content }] : [],
    };
  });

  console.log("Transformed messages:", JSON.stringify(transformedMessages, null, 2));

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  // Forward the request to the vipps-tobi backend
  const response = await fetch(`${backendUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Forward authorization header if present
      ...(req.headers.get("Authorization") && {
        Authorization: req.headers.get("Authorization")!,
      }),
    },
    body: JSON.stringify({ messages: transformedMessages }),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`);
  }

  // Wrap the stream to add timing information
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Pass through the original chunk
          controller.enqueue(value);

          // Log the data for debugging
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("[API Route] SSE Event:", data.type);
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        console.error("[API Route] Stream error:", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
