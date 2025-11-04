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

  // Return the streaming response from backend
  // The backend already uses createUIMessageStreamResponse, so we can pass it through
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
