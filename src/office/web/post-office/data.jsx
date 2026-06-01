// data.jsx — mock agent pipeline data + canned streaming responses.
// SWAP POINT: replace `mockRun(agent)` with a real model call that resolves
// to the streamed string. Everything else (runner, UI) stays the same.

const AGENTS = [
  {
    id: "analyst",
    name: "Analyst",
    role: "reviews past performance",
    blurb: "Reads the postmortems — what landed, what flopped — and sets the bar for today.",
    currentInstruction:
`# post-retro
Pull the last 14 days of published posts + their metrics.
For each: impressions, saves, comment quality.
Output 3 patterns to repeat and 2 to avoid.`,
    response:
`RETRO — trailing 14d (9 posts)
\u2191 best: "I stopped writing tests for a week" \u2014 41k impr, 312 saves
\u2193 worst: "5 AI tools you must try" \u2014 listicles underperforming -60%

REPEAT
 \u2022 first-person failure hooks (+ saves)
 \u2022 one concrete number in line 1
 \u2022 short paragraphs, lots of breathing room

AVOID
 \u2022 listicles / "X tools" framing
 \u2022 hashtag stuffing (>3 kills reach)

Bar for today: a hook that admits something.`,
  },
  {
    id: "scout",
    name: "Scout",
    role: "gathers the morning briefing",
    blurb: "Sweeps Hacker News, Lobsters, RSS and Exa for what's actually moving today.",
    currentInstruction:
`# topics-briefing
sources: hackernews(top=30), lobsters(hot), rss(feeds.opml), exa("ai dev tools" recency=24h)
dedupe + cluster by theme.
score each cluster 0-100 by: novelty, relevance-to-owner, discussion heat.`,
    response:
`BRIEFING \u2014 14 clusters \u2192 top 4
[92] Context windows hit 10M tokens \u2014 but devs say recall still degrades past 200k
[88] "Agentic" IDEs: everyone shipped one this week, nobody agrees what it means
[81] Postgres 18 ships async I/O; benchmarks are wild
[74] The great unbundling of the AI SDK \u2014 teams ripping out frameworks

heat: HN 2.1k pts / Lobsters 340 / 6 RSS hits
recommend \u2192 cluster #2 (agentic IDEs), owner has takes here.`,
  },
  {
    id: "ideator",
    name: "Ideator",
    role: "brainstorms scored angles",
    blurb: "Turns the briefing into post angles, each scored on hook strength and fit.",
    currentInstruction:
`# post-ideator
input: Scout briefing (cluster #2, agentic IDEs)
generate 5 angles in the owner's voice.
score each: hook(0-10), originality(0-10), risk(0-10). rank.`,
    response:
`ANGLES \u2014 ranked
1. [hook 9 \u00b7 orig 8] "Everyone's shipping 'agentic' IDEs. Most are autocomplete
   wearing a trenchcoat." \u2014 contrarian, owner can back it up.
2. [hook 7 \u00b7 orig 6] "What 'agentic' should actually mean" \u2014 definitional, safe.
3. [hook 6 \u00b7 orig 7] a day-in-the-life of pairing with an agent IDE
4. [hook 5 \u00b7 orig 4] feature comparison table (Analyst says: no listicles)
5. [hook 8 \u00b7 orig 5] "I let it touch prod. Here's what broke."

\u2192 advancing #1.`,
  },
  {
    id: "writer",
    name: "Writer",
    role: "drafts the post in the owner's voice",
    blurb: "Takes the winning angle and writes the actual post — hook, body, no fluff.",
    currentInstruction:
`# post-writer
angle: "agentic IDEs = autocomplete in a trenchcoat"
voice: dry, first-person, concrete. <1100 chars. one idea.
open with a confession or a strong claim. no hashtags > 3.`,
    response:
`Everyone shipped an "agentic" IDE this week.

I tried four of them. Three are autocomplete wearing a trenchcoat.

Here's the tell: a real agent changes its plan when the build fails.
Autocomplete just suggests the next plausible line and hopes.

The one that impressed me did something small but honest \u2014 it ran the
tests, read the red, and *backed out* its own change before asking me.
That's the whole game. Not bigger context windows. Not more buttons.

The loop, not the model.

If your "agent" can't be wrong out loud, it's a very confident parrot.`,
  },
  {
    id: "illustrator",
    name: "Illustrator",
    role: "designs the cover image prompt",
    blurb: "Writes the prompt for the cover image that rides with the post.",
    currentInstruction:
`# post-image
read final draft. produce ONE cover-image prompt.
style: editorial, single metaphor, no text in image, 1.91:1.`,
    response:
`COVER PROMPT
"A trenchcoat hung on a coat rack, slightly slumped as if a person just
stepped out of it, single warm desk lamp, ink-and-wash editorial style,
muted paper tones, lots of negative space, 1.91:1, no text."

alt-text: an empty trenchcoat on a rack \u2014 the 'agent' that isn't there.
negative: neon, 3d render, glossy, robot mascots.`,
  },
  {
    id: "critic",
    name: "Critic",
    role: "gates the draft, approves or rejects",
    blurb: "The bouncer. Checks the draft against the bar and either ships it or sends it back.",
    currentInstruction:
`# post-critic
gate the draft against: Analyst bar, voice, hook, length, claims.
verdict: APPROVE | REVISE. if REVISE, say exactly what.`,
    response:
`REVIEW
hook ....... admits something + contrarian \u2713 (meets today's bar)
voice ...... dry, first-person \u2713
length ..... 612 chars \u2713
claims ..... "backed out its own change" \u2014 verifiable, owner saw it \u2713
risk ....... mild vendor shade, acceptable \u2713

VERDICT: \u2705 APPROVE \u2014 ship at 9:10am local.
one nit: "very confident parrot" is close to a meme; keep, it lands.`,
  },
];

// Per-agent canned timing (ms of "work" before done) — scaled by loop-speed tweak.
const BASE_WORK_MS = {
  analyst: 2600,
  scout: 3000,
  ideator: 2800,
  writer: 3600,
  illustrator: 2400,
  critic: 2600,
};

// Where each idle worker hangs out (lounge zone): coffee, cooler, sofa.
const IDLE_SPOTS = {
  analyst: "sofa-l",
  scout: "coffee",
  ideator: "sofa-r",
  writer: "sofa-l",
  illustrator: "cooler",
  critic: "coffee",
};

Object.assign(window, { AGENTS, BASE_WORK_MS, IDLE_SPOTS });
