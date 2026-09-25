# ACTION REQUIRED — P0 coordination

Оновлено: 2026-09-25 ~14:20 Europe/Kyiv

## Alert: PR #1 більше не fully superseded

MVP tip `253e56d` має **2 коміти поза #7**:
- `247218a` Harden profile merge + AGENTS.md/CLAUDE.md
- `253e56d` Merge expertise on import extraction

Файли лише в #1: `AGENTS.md`, `CLAUDE.md` (+ зміни `src/lib/vault.ts`, `next.config.ts`).

### Що зробити перед merge #7
1. **Pause** MVP agent (#1), щоб не накопичувати ще delta
2. **Port** ці 2 коміти в `#7` (cherry-pick на `implement-adr-004-…`) **або** rebase `#7` на новий tip `#1`
3. Потім merge **#7**; закрити #1/#6
4. Rebase #5 → brand #3 → INT-1

Owners: `004` (#7), `Адр 005` (#5). MVP (#1) не розвивати окремо після port.

Напиши `port #1 into #7` — зроблю cherry-pick на гілці #7 / окремій гілці від #7 tip.
