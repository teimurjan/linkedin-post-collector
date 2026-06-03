---
urn: 'urn:li:activity:7464656714479616000'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7464656714479616000/'
posted_at: '2026-05-25T12:40:47.347Z'
impressions: 184
likes: 2
comments: null
shares: null
scraped_at: '2026-06-03T07:11:25.321Z'
---
A new paper benchmarks LLM coding agents on 100 back-end tasks across 8 web frameworks and finds something the leaderboard versions don't.

Capable configurations lost 30 percentage points on average in assertion pass rate as task constraints stacked up. Weaker ones went to near zero. Flask did fine. FastAPI and Django, where the framework dictates structure, broke the agents. Data-layer defects were the leading root cause.

The phenomenon has a name now. Constraint decay. As structural requirements accumulate (ORM patterns, dependency injection, response shapes, auth middleware), the agent stays confident and the output stops working.

This is the gap between "writes code" and "writes the code we ship." Every benchmark you see quoted, including the ones in this week's Gartner coding-agent ranking, rewards functional correctness on greenfield tasks with thin specs. The thing real teams need is the opposite: production code that obeys an architecture someone already chose.

ClickHouse's year-long retro, also published this week, points at the same shape from the other side. Real production use, real lessons, and the lessons aren't "agents are great."

Two narratives are running in parallel. One says agents are Leaders, Spark runs 24/7, Codex is in production at Virgin Atlantic. The other says structural requirements break them, and the breakage is invisible to the agent.

If you're shipping with agents on a real back end, the question isn't which one tops the benchmark. It's which one degrades the slowest as your constraints stack.
