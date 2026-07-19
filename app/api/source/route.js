import { NextResponse } from "next/server";
import { getSourcingChannels } from "@/lib/config";
import { searchGithub } from "@/lib/sourcing/github";
import { searchHackerNews } from "@/lib/sourcing/hackernews";
import { processOutboundLead } from "@/lib/pipeline";

// Each fetcher takes (keywords, channelConfig) and returns leads. Keeping the
// per-channel options in the config keeps this dispatch dumb and uniform.
const FETCHERS = {
  github: (keywords, c) =>
    searchGithub(keywords, {
      starsMin: c.stars_min,
      starsMax: c.stars_max,
      pushedAfter: c.pushed_after,
    }),
  hackernews: (keywords) => searchHackerNews(keywords),
};

// Outbound: scan enabled channels for the thesis's sectors, score each lead
// through the same pipeline as an inbound application, converge into one funnel.
export async function POST() {
  const { channels } = getSourcingChannels();

  const enabled = channels.filter((c) => c.enabled && FETCHERS[c.id]);
  const leadLists = await Promise.all(
    enabled.map((c) => FETCHERS[c.id](c.query_keywords, c))
  );
  const leads = leadLists.flat();

  const opportunities = [];
  for (const lead of leads) {
    const opp = await processOutboundLead(lead);
    opportunities.push(opp);
  }

  return NextResponse.json({ scanned: leads.length, opportunities });
}
