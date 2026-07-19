// Algolia's public HN Search API — fully free, no key required.
// Use search_by_date + tags=show_hn to surface *recent* launches rather than
// years-old viral posts: fresher founders (closer to the pre-fundraising moment
// the thesis targets) and a more varied traction signal than relevance sort,
// which just returns the same famous few.
export async function searchHackerNews(keywords) {
  const q = encodeURIComponent(keywords.join(" "));
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=show_hn&hitsPerPage=10`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.hits || [])
    .filter((hit) => hit.title)
    .map((hit) => ({
      source: "hackernews",
      sourceUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      founderHandle: hit.author,
      company: hit.title,
      signal: {
        points: hit.points,
        comments: hit.num_comments,
        createdAt: hit.created_at,
      },
    }));
}
