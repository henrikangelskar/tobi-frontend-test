export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  try {
    // Forward the request to the vipps-tobi backend
    const response = await fetch(`${backendUrl}/prompts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(req.headers.get("Authorization") && {
          Authorization: req.headers.get("Authorization")!,
        }),
      },
    });

    if (!response.ok) {
      console.error(`Backend /prompts responded with ${response.status}`);
      return Response.json(
        { prompts: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Failed to fetch prompts from backend:", error);
    // Return empty prompts array on error to gracefully degrade
    return Response.json({ prompts: [] }, { status: 500 });
  }
}
