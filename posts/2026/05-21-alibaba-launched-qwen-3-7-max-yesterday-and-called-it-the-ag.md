---
urn: 'urn:li:activity:7463200841769017345'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7463200841769017345/'
posted_at: '2026-05-21T12:15:40.244Z'
impressions: 160
likes: 2
comments: 1
shares: null
scraped_at: '2026-05-25T06:58:42.201Z'
---
Alibaba launched Qwen 3.7 Max yesterday and called it "The Agent Frontier."

That phrasing is the part worth noticing. It's not the most intelligent open model or GPT-class reasoning. It's a positioning claim about what the model is for.

Three frontier labs have now branded their flagship the same way inside one quarter. Anthropic leaned into agentic coding for the last two major Sonnet releases. OpenAI just folded ChatGPT and Codex into a single agentic product line under Brockman. Now Qwen ships with "The Agent Frontier" as the literal subtitle.

The chat-model era is functionally over at the top of the stack. Nobody at the frontier is selling completion quality anymore. They're selling how well the model holds a 40-step tool-use loop together without falling off.

The practical implication is about evals. If your benchmark suite is built around MMLU, instruction-following, or human-preference ratings on single-turn outputs, you're measuring the thing the labs no longer optimize for. The numbers that move the frontier ranking are agent benchmarks. SWE-bench, OSWorld, browser tasks, multi-step tool chains. Different leaderboards, different winners.

I keep seeing teams pick a model based on chat scoreboards and then wonder why their agent stack is fragile. The mismatch is in the eval, not the model.

The question worth sitting with: which lab is the first to drop chat quality from its flagship's positioning entirely. Whoever does that first has accepted the new game.

---

## Comments

**Gabe Perez**

> the moment you realize your eval suite is a museum exhibit
> 
> qwen naming it that explicitly is the tell — they're not even pretending the old benchmarks matter. anthropic stopped listing MMLU deltas months ago. openai's blog posts now open with "can hold context across 47 tool calls" instead of "beats gpt, 4 on reasoning."
> 
> the fragile agent stacks make sense now. everyone's still picking models like they're buying a better autocomplete when the actual question is "does this survive 12 API failures and a malformed JSON without losing the plot"
> 
> which lab do you think blinks first and ships a model with *no* chat interface at all — just native tool

