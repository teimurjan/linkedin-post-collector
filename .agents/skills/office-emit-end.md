# Office: emit end

Each pipeline skill lights its own stage on the Post Office dashboard
(`bun run office`) — best-effort, never block the real work. The dashboard open,
the board reset, and the stage's `start` are all automatic via the session hooks
(`.claude/settings.json`, `.codex/hooks.json`): on invocation the hook maps the
skill to a stage and emits `start`. So you never emit `start` — you only emit the
**end**, once your work is written, so the figure flips to done and shows its
artifact. Find your row below and run it; if it errors, skip and continue.

`bun run office emit --stage <id> --event end <response>`

## Stage map

| Skill | `--stage <id>` | `<response>` |
| --- | --- | --- |
| `topics-briefing` | `scout` | `--response-file <the briefing you wrote>` |
| `post-ideator` | `ideator` | `--response-file ideas/<YYYY-MM-DD>.md` |
| `post-writer` | `writer` | `--response-file <the draft you wrote>` |
| `post-image` | `illustrator` | `--response-file concepts/<date>-<slug>/prompt.md` |
| `post-carousel` | `illustrator` | `--response-file concepts/<date>-<slug>/prompt.md` (the index) |
| `post-flowchart` | `illustrator` | `--response-file concepts/<date>-<slug>/prompt.md` |
| `post-critic` | `critic` | `--response "<one-line verdict, e.g. APPROVE 8/10 — ship it, or REVISE — weak hook>"` |
| `post-retro` | `analyst` | `--response-file retros/<date>-<slug>.md` |
