# OUTPUT LEAGUE

**CODE. THINK. SCORE.** A local, playable arcade game about reading Python output. Built with React, TypeScript, Vite, and Phaser 3.

## Run

```sh
npm install
npm run dev -- --port 5186 --strictPort
```

Open **http://localhost:5186**. On an iPad on the same Wi-Fi, use the network address printed by Vite. Port 5186 avoids the other local project using 5173.

```sh
npm run build
npm run preview -- --port 5186
npm test
npx playwright install chromium webkit
npm run test:e2e -- --workers=1
```

The production output is `dist/`. A static host should rewrite navigation requests to `index.html` for the client-side routes. Fonts and artwork are served locally; student sessions, progress, garage choices, scores, and standings use Supabase.

## Supabase setup

1. Authenticate and link the configured project with `npx supabase login` and `npx supabase link --project-ref imodobxbarcsjylvitxt`.
2. Apply the migration and import the 276 supplied students with `npx supabase db push --include-seed`. The source snapshot is `supabase/students_supabase.csv`; regenerate the seed after updating it with `npm run seed:students`.
3. Copy `.env.example` to `.env.local` for local development. The deployed project URL and publishable key are already configured as safe frontend fallbacks.
4. Restart Vite after changing environment values.

The browser has no direct table permissions. Login, settings, progress, and leaderboard access use narrowly granted database functions; student sessions are random, hashed, and expire after 30 days. Because the requested login has no password, a classmate who knows another student’s username and grade can still impersonate them. Add a per-student PIN or Supabase Auth before treating the scores as tamper-proof.

## Play

Choose your grade, enter the supplied first-and-last-name username, then select PRINT → PLAY MATCH. Grade 7 enters Python, Grade 8 enters Swift, and Grade 9 enters C#. The staff accounts `leleomaker`, `davimaker`, and `brianmaker` exist in every grade; after signing in they can open all three languages and use the TEACH DASHBOARD button, which lists every student with their best score, stars, and completed levels in Python, Swift, and C#. Try the first-game code demo, watch the stadium reveal, then steer your rover and score the ball in the matching output goal. Settings includes a garage with four paints, three roof decals, three boost trails, and five atmosphere options. Choices sync to the active student and retain a local fallback.

| Action | Touch | Keyboard |
|---|---|---|
| Drive | Drag the analog joystick | WASD / arrows |
| Boost | Hold BOOST | Hold Shift |
| Kick | Tap KICK near the ball | Space |
| Pause | Pause or Back button | Escape |

Steering magnitude controls speed. Kicks follow the rover's facing direction and work within 94 world units. Boost energy recharges while released; an exhausted tank must recover before boosting again. Settings include synthesized sound effects and reduced motion. Switching tabs pauses the match and XP.

## The vertical slice

- Launcher uses the supplied transparent logo and a new alpine arena illustration inspired by the reference images.
- A skippable logo entrance plays once per page load. Every match opens with a brief full-stadium overview, then zooms to the car and counts down 3, 2, 1. Round transitions repeat the zoom and countdown. These introductions and the tutorial freeze gameplay and XP. Reduced motion uses a short overview and a direct camera cut.
- The live arena is a true top-down octagon with three times the original playing area, six boundary-aligned goal pockets, and two solid side walls. Introductory rounds activate four goals; later rounds use all six.
- A smooth camera follows the rover with directional look-ahead. The radar sits beside the joystick, leaving the center clear. Off-screen output markers, detailed turf, beveled neon nets, tire marks, colored exhaust, impact particles, drifting momentum, and a visibly rolling ball bring the arena to life.
- Four pitch styles: alpine turf, midnight rain with puddles, polar ice with cracks and snow, and sun-worn grass with dust. Rain and ice loosen lateral grip and ice extends ball travel; worn turf adds a little rolling resistance. Choose one in Settings or let each match select a random atmosphere. Car cosmetics update immediately; atmosphere applies next match.
- Grandstands surround all eight edges. Fans wave and cheer, correct goals trigger confetti and a synthesized crowd roar, and wrong goals bring a dramatic red vignette. Reduced motion removes confetti, weather animation, camera shake, and animated zoom.
- Each language map includes eight levels. Levels 1–4 are playable and unlock in order; Levels 5–8 remain marked coming soon.
- Ten designed rounds: integers, strings, punctuation, six goals, escalating barriers, bumpers, opening pits, rotating arms, brief portal-rover steals, four moving goals in Orbit Mode, zero or a negative number, and a two-phase mastery sequence. The ball drops into the center and makes a small bounce in a random direction at each kickoff.
- Every entry and replay generates fresh numbers and words while preserving the learning progression and misconception-based choices. Mastery asks for two randomized outputs in order. Its code stays unchanged between the two shots; scoring the second output early is a wrong goal.
- The first-game tutorial has an interactive code/output demo. Completing PRINT opens a learning recap using the actual mastery code, with animated output and reminders about values, quotes, and execution order, before showing scores. Later levels remain coming soon.
- From round five, a portal rover gives a visible warning, tries to steal the ball, then carries it to the opposite side and disappears. Rover rounds also offer one `###` slot roll; a jackpot arms a layered shockwave that explodes the rover and safely releases the ball. Later rounds increase its speed and frequency. Amber repair pits open and close, gently ejecting cars or balls without an XP penalty. Neither distraction appears in the opening rounds.
- Wrong goals deduct 50 points (never below zero), reset the streak and vehicles, and preserve the challenge, output positions, round, and mastery phase.
- No time-based failure. Potential XP starts at 300, has a three-second grace period, decays by seven per second, and stops at 60. The first round gets eight seconds and slower decay. Each round allows three kicks; Orbit Mode removes the kick option.
- Accuracy +40, clean shot +20, streak +15 per consecutive clean round (capped at +75), Orbit +40, mastery +100.
- Stars weight accuracy 50%, score 35%, and clean shots 15%, with additional wrong-goal caps. Completion always earns at least one star.
- Supabase stores each student’s level bests, stars, attempts, and garage/settings profile. Local storage acts as a responsive cache and keeps the game playable when the remote service is temporarily unavailable.

## Implementation

React owns navigation, menus, dialogs, HUD, touch controls, and results. Phaser owns the arena, vehicles, ball, collisions, obstacles, AI, goals, effects, and match events. The live scene uses Phaser's Canvas renderer with code-drawn graphics, independent from the launcher artwork. The static landscape is baked into one texture. Frame smoothing is disabled; physics recovery after a stalled frame is capped at 200 ms. XP, the stadium reveal, goal pauses, and rover cameo use elapsed wall time so slow rendering does not stretch those moments. Pausing freezes the simulation and those scene timers. Radar text colors update only when they change.

`src/data/challenges.ts` contains the curated challenge bank and restrained randomization. `src/data/levels.ts` contains the campaign metadata. `src/game/match.ts` is the pure learning and scoring model. `src/game/physics.ts` handles collision resolution; `src/game/DrivingScene.ts` steps it at 120 Hz, using a capped frame accumulator. The world uses uncompressed top-down coordinates. `pitchArt.ts` draws the terrain and goals; `vehicleArt.ts` draws the rover and rolling ball. `followCamera.ts` controls tracking and speed-dependent zoom, while `arenaGuidance.ts` provides a separate fixed HUD camera for navigation. HUD updates are limited to 10 Hz; physics do not trigger React renders.

`src/game/obstacles.ts` supports static wall, moving wall, bumper, disappearing wall, rotating arm, speed pad, slow zone, orbiting bumper, and repair pit. Only the Level 1 subset appears in the match. `StadiumAtmosphere.ts` draws the bounded crowd/weather layer; `distractions.ts` defines the portal rover's timing. `src/data/garage.ts` contains cosmetic choices and surface tuning.

Keyboard and Pointer Events share one control state. The canvas scales to fit, and menus are designed for 1024×768, 1180×820, and 1194×834 landscape viewports. Portrait menus adapt with scrolling; landscape is the intended gameplay orientation.

## Validation

Run `npm test` for the unit suite and `npm run test:e2e -- --workers=1` for Chromium and WebKit browser checks. To smoke-test production, serve the build on port 5187 and run `node scripts/production-smoke.mjs`. `node scripts/capture-experience.mjs` captures the garage, tutorial, field styles, and goal reactions from the development server into the ignored `artifacts/` directory.

Unit tests cover XP floors, retry semantics, ordered mastery scoring, star ratings, curated choices, octagon reflections, six goal pockets, threefold playing area, goal-line crossing, post collisions, car-to-ball momentum, wall penetration, obstacle warning timing, bounded camera look-ahead, and reduced-motion zoom.

Browser tests cover navigation, settings, locked feedback, all eight nodes fitting the specified iPad layouts, analog movement, boost, kick range, physical goal detection, all ten rounds, Orbit Mode, pause, results, persistence, and replay. The opt-in `?qa=1` hook exists only in development and is removed from production. Tests move the ball into goals through the live physics loop; they do not replace the scoring method.

Experience tests cover garage persistence and live appearance updates, the tutorial's actual output, frozen XP during the stadium reveal, fresh replay values, all four surfaces, reduced-motion camera behavior, the repair pit's recovery, and the portal rover releasing its steal without a wrong-goal penalty.

The browser suite also checks camera tracking, stationary HUD placement, the six-goal layout, persistent trails, rolling-ball orientation, and paused-camera behavior. Chromium additionally checks simultaneous touch steering, boost, kick, and boost recharge. The equivalent raw-touch injection is skipped in WebKit because it requires Chromium's CDP; WebKit still runs the Pointer Events tests and the complete match. The production smoke check covers navigation, arena loading, no page overflow at 1024×768, no external requests, absence of the development hook, and no browser errors.

WebKit emulation checks browser behavior, but it is not a substitute for testing performance and simultaneous fingers on a physical iPad. Target is 60 FPS; hardware performance has not been measured.

## Artwork

Optimized runtime artwork: `public/assets/logo.webp` and `public/assets/world.webp` (about 274 KB combined). Original PNGs are retained. The supplied inspiration files remain untouched. Generation method and exact prompt are documented in [ARTWORK.md](ARTWORK.md). Font license files are in `public/assets/fonts/`.

Useful engine documentation: [Phaser scale manager](https://docs.phaser.io/phaser/concepts/scale-manager), [Phaser scenes](https://docs.phaser.io/phaser/concepts/scenes).
