# Live office sync

Shared protocol for the post-pipeline skills. Each skill reflects its own stage
on the owner's Post Office dashboard (`bun run office`) as it runs — best-effort,
never block the real work. Opening the dashboard and resetting the board are
handled automatically by the session hooks (`.claude/settings.json`,
`.codex/hooks.json`), so a skill only emits its own stage.

Find your skill's row in the stage map, then:

- At the **start**, run: `bun run office emit --stage <id> --event start`
- At the **end**, run: `bun run office emit --stage <id> --event end <response>`,
  where `<response>` is the row's end form — either `--response-file <path>`
  pointing at the artifact you just wrote, or `--response "<one-line summary>"`.

If any command errors, skip it and continue.

## Stage map

| Skill | `--stage <id>` | Emit `start` | Emit `end` with |
| --- | --- | --- | --- |
| `topics-briefing` | `scout` | before fetching sources | `--response-file <the briefing you wrote>` |
| `post-ideator` | `ideator` | at the start | `--response-file ideas/<YYYY-MM-DD>.md` |
| `post-writer` | `writer` | before step 1 | `--response-file <the draft you wrote>` |
| `post-image` | `illustrator` | at the start | `--response-file concepts/<date>-<slug>/prompt.md` |
| `post-critic` | `critic` | at the start of the review | `--response "<one-line verdict, e.g. APPROVE 8/10 — ship it, or REVISE — weak hook>"` |
| `post-retro` | `analyst` | at the start | `--response-file retros/<date>-<slug>.md` |
