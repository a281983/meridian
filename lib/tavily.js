// Thin fetch wrapper — no SDK dependency needed for one REST call.
export async function tavilySearch(query, { maxResults = 3 } = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: [], error: "TAVILY_API_KEY not set" };

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!res.ok) return { results: [], error: `Tavily ${res.status}` };
  const data = await res.json();
  return { results: data.results || [] };
}
