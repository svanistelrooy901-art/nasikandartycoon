# Nasi Kandar Tycoon — playable first upgrade

A Malaysian service/tycoon browser game. Vinext + Cloudflare Worker with a Sites-managed D1 database. The original counter, food sprites, customer art, mouse/touch dragging and ladle mechanic remain. Canvas compatibility mode is available when WebGL is unavailable.

## Authoring and build

- `public/` holds the browser game, branding and static pages.
- `lib/engine.mjs` and `lib/tycoon.mjs` are canonical shared gameplay/config sources. Keep their corresponding `public/` copies identical. API imports canonical files; the browser imports the public copies.
- `lib/server.mjs` calculates revenue from timed gameplay events, uses cookie-bound guest profiles, and enforces revisions and atomic wallet crediting. The app route is a thin binding adapter.
- `db/schema.ts`, generated `drizzle/` SQL and metadata own the schema. Hosted Sites publication applies pending migrations; never create tables during requests.
- Build with the Sites `build-site.mjs` helper. Existing Site ID and public audience are preserved. This migrates the prior static Site to a Worker + D1 Site; the domain remains the same.
- Tests: `node --test tests/*.test.mjs`. SQLite-backed API tests run against isolated in-memory databases and never write production data.

## Implemented

- Seeded random orders restricted to unlocked ingredients; server replay uses the same seed/state.
- 30-second initial patience, annoyed sprites at 10 seconds; comfort upgrades add 2 seconds per level.
- Accepted order combo, milestones 3/5/8, Perfect, Fast Service and Last-Second Save bonuses with animated feedback and ascending audio.
- Ingredient-based food sales; tips are separate. Wallet = food sales + tips - upgrade spending. Spending never reduces total sales.
- Six functional upgrades: tray capacity, ladle capacity/rate, recipe sale value, comfort, refill speed and auto-refill helper.
- Stock consumption and timed refill; discarded plates do not refund stock.
- Roadside stall → shophouse → restaurant, distinct background art and unlocks, 8/12/16-customer shifts. Promotion thresholds: RM5,000 sales + RM1,500 wallet; RM30,000 + RM10,000.
- Live all-time and Malaysia-week sales leaderboard. Only server-calculated revenue is ranked; no fictional rows.
- Cookie guest progress, editable public nickname, favicon and approved logo. Practice never credits persistent earnings.

## Validation limits / next scope

The browser environment only provides Canvas rendering. Hardware WebGL and actual Android/iOS touch still need real-device QA. API timing/rate/stock/revision checks prevent simple balance injection, replay and cross-profile writes; this is baseline abuse resistance, not bot-proof gameplay.

Guest saves require the same browser cookie (180 days), with no cross-device account recovery yet. Google sign-in is not implemented. Menu currently expands from 6 to 8 to 9 foods plus sauces; the full 20-lauk menu, multiple plates, cashier and group orders remain future work. Economy values are initial balance values.

AdSense remains disabled, with no ad script or ads.txt seller claim. No payments or real-money game purchases exist.

## Art provenance

Built-in ImageGen created the approved food atlas and annoyed-character variants. New roadside/shophouse environment prompts: realistic Penang nasi kandar setting, server-side viewpoint, empty central customer area, no people or foreground counter; modest roadside canopy vs tiled shophouse. Approved chef logo/title art uses the user's requested brown uniform, chef hat, nasi kandar plate and playful yellow-orange title. Project assets are copied into `public/assets/` and shipped with the game.

## Arcade presentation skin

`public/arcade.css` replaces the website-style wrapper with a viewport-sized game lobby, raised play/menu buttons, coin-style wallet/sales HUD, stage progression indicators, game shop/ranking windows and an in-game help dialog. The approved character/logo art is reused. UI icon SVGs are exported directly from Lucide React; its license ships in assets. No gameplay rules, D1 schema, balances or leaderboard scoring were changed for this restyle.

## Deploy to your own Cloudflare account

Connect this GitHub repository as a **Worker**, with root directory `/` and production branch `main`. Leave Build command empty; set Deploy command to `pnpm run deploy:cloudflare`. Clear the optional Preview command until an isolated preview database is configured. Wrangler bundles the standalone entrypoint directly; the Sites/Vinext build is not required for this target.

The deploy script resolves or creates only `nasikandartycoon-db`, applies the tracked Drizzle migrations, then deploys Worker `nasikandartycoon` with the `DB` binding and public assets. The build token needs Workers deployment and D1 read/edit permissions. Migration failure stops deployment. Database IDs are resolved in the build environment, never invented.

This creates a separate database. Existing Sites sales and guest sessions are not migrated by this script. Keep the old Site available until migration or a fresh launch is agreed. HTML OG/canonical URLs use the incoming Cloudflare/custom-domain origin.
