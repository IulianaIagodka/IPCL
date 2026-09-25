# Main must stay green

Канон: після кожного мерджа в `main` тести мають прогнатися знову, і `main` має бути зеленим.

## Що забезпечує CI

Workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (`CI` / job `test`) запускається:

1. **на кожному PR у `main`** — щоб зламаний код не потрапив у main;
2. **на кожному push у `main`** (після merge) — щоб main залишався зеленим навіть якщо щось проскочило або середовище відрізняється.

Гейт однаковий у обох випадках:

- `npm ci`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

## Правила для агентів і людей

- Не мерджити PR, поки check `CI / test` не зелений.
- Після merge перевірити Actions на `main`: push-run теж має бути зеленим.
- Якщо `main` червоний — P0: фікс або revert, перш ніж продовжувати продуктову роботу.
- Локально перед PR: `npm test` і `npx tsc --noEmit` (бажано також `npm run build`).

## Branch protection (вручну в GitHub)

Інтеграційний токен агента не може увімкнути protection. Власник репо має:

1. Settings → Branches → Branch protection rule для `main`
2. Require a pull request before merging
3. Require status checks to pass: **`CI / test`**
4. Do not allow bypassing the above settings (за можливості)
