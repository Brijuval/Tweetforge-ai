export async function callGroq(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a senior brand strategist and social media copywriter. You always respond with valid JSON only — no markdown, no explanation, no code fences. Just raw JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
