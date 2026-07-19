// Public GitHub Search API. Works unauthenticated at a low rate limit; set
// GITHUB_TOKEN in .env to raise it. No paid API involved either way.
//
// Query intent (matches the pre-seed/seed thesis): OR the keywords (ANDing them
// matches ~nothing), then window on a stars range + recent push so we surface
// *emerging* projects with early traction — not already-famous repos, and not
// zero-star noise. The window comes from the channel config so it's tunable
// without code changes.
export async function searchGithub(keywords, { starsMin = 25, starsMax = 3000, pushedAfter } = {}) {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const orTerms = keywords.map((k) => `"${k}"`).join(" OR ");
  const filters = [`stars:${starsMin}..${starsMax}`];
  if (pushedAfter) filters.push(`pushed:>${pushedAfter}`);
  const q = encodeURIComponent(`${orTerms} in:name,description ${filters.join(" ")}`);

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${q}&sort=updated&order=desc&per_page=10`,
    { headers }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.items || []).map((repo) => ({
    source: "github",
    sourceUrl: repo.html_url,
    founderHandle: repo.owner?.login,
    company: repo.name,
    signal: {
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      description: repo.description,
    },
  }));
}

// Used by the Founder Score's technical_signal factor when a founder supplies
// (or is discovered with) a GitHub handle.
export async function getGithubUserSignal(handle) {
  if (!handle) return null;
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/users/${handle}`, { headers });
  if (!res.ok) return null;
  const user = await res.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${handle}/repos?sort=pushed&per_page=10`,
    { headers }
  );
  const repos = reposRes.ok ? await reposRes.json() : [];
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const mostRecentPush = repos[0]?.pushed_at || null;

  return {
    followers: user.followers,
    publicRepos: user.public_repos,
    accountCreatedAt: user.created_at,
    totalStarsAcrossTopRepos: totalStars,
    mostRecentPush,
  };
}
