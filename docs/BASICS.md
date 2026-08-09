# Basics of the site

## Learning path

What we want to teach users of the site, including using fun score-keeping quizzes:

1. **Formations** — Where everyone lines up (Spread, Trips Left, Trips Right)
   - Light coverage — don't spend a lot of time here
2. **Routes** — Players learn the routes they will run
   - Look at a route image → name the **number**
   - Show image + details when learning; quiz on **name and number**
   - Mode: **"Just test me on routes"**
3. **Plays** — Route combinations called from each formation
   - Hear or read a play call → say what **you** run for your position
   - Positions quizzed: **X, L, R, Z, H** (not C, not Q)
   - Weight: ~90% receiver questions (X/L/R/Z), ~10% H
   - Mode: **"Just test me on play calls"**
   - Practice with **audio (browser TTS)** and **text-only** cues

## Parts of a play call

1. **Formation** — where to line up
2. **Route numbers** — from outside receiver in (no commas; see formats below)
3. **Tags** — H instruction and route overrides for other positions
   - If coach calls your position, that tag is your new assignment (ex. `X7` or `X-X-X 2`)
   - For now, **always tag H** (no H default)
4. **Motion tags** — presnap motion + direction + route
   - `Hazer Left 3` — H motions left, runs 3 (Arrow)
   - `Lazer Left 3` — L motions left, runs 3
   - `Razer Left 3` — R motions left, runs 3
   - `Xavier Right 3` — X motions right, runs 3
   - `Zazer Left 3` — Z motions left, runs 3

## Route number formats

### Spread `A-B`

Mirrored outside / inside:

| Position | Route |
| -------- | ----- |
| X, Z     | A     |
| L, R     | B     |
| H        | from tag (required) |

Example: `Spread 0-1, H-0` → X:0 | L:1 | R:1 | Z:0 | H:0

### Trips Left `ABC`

| Position | Route |
| -------- | ----- |
| X, Z     | A (1st digit) |
| L        | B (2nd digit) |
| R        | C (3rd digit) |
| H        | from tag (required) |

Tags override any of the above.

### Trips Right `ABC`

| Position | Route |
| -------- | ----- |
| X, Z     | A (1st digit) |
| R        | B (2nd digit) |
| L        | C (3rd digit) |
| H        | from tag (required) |

Tags override any of the above.

**Outside receivers:** X and Z always take the **first** number unless tagged otherwise.

## Plays vs routes

These tags are **plays**, not route-tree numbers:

- **Reverse** — receiver comes behind Q, takes the ball, runs
- **Fake Reverse** — receiver comes to Q, fakes the handoff; Q does something else
- **Fake run left / right** — H pretends to get the ball and run that way (no actual handoff)

## Example play calls

1. `Spread 0-1, H-0` → X: 0 | L: 1 | R: 1 | Z: 0 | H: 0
2. `Spread 2-3, H-9` → X: 2 | L: 3 | R: 3 | Z: 2 | H: 9
3. `Spread 2-7, H-0, Z-8` → X: 2 | L: 7 | R: 7 | Z: 8 | H: 0
4. `Spread 9-0, H-3, L-8` → X: 9 | L: 8 | R: 0 | Z: 9 | H: 3
5. `Spread 2-3, H-8, R-0` → X: 2 | L: 3 | R: 0 | Z: 2 | H: 8
6. `Spread 8-1, H-3, X-7` → X: 7 | L: 1 | R: 1 | Z: 8 | H: 3
7. `Trips Right 193 Hazer Left-3, X-2` → X: 2 | L: 3 | R: 9 | Z: 1 | H: motion left 3
8. `Trips Right 222, H-3, X-8` → X: 8 | L: 2 | R: 2 | Z: 2 | H: 3
9. `Trips Right 911, Hazer Right-3, L-Reverse` → X: 9 | L: Reverse | R: 1 | Z: 9 | H: motion right 3
10. `Trips Right 910, Xavier Right-3, H-fake run left` → X: motion right 3 | L: 0 | R: 1 | Z: 9 | H: fake run left
11. `Trips Left 193 Hazer Right-3, Z-2` → X: 1 | L: 9 | R: 3 | Z: 2 | H: motion right 3
12. `Trips Left 222, H-3, Z-8` → X: 2 | L: 2 | R: 2 | Z: 8 | H: 3
13. `Trips Left 911, Hazer Right-3, R-Fake Reverse` → X: 9 | L: 1 | R: fake reverse | Z: 9 | H: motion right 3
14. `Trips Left 910, Zazer Left-3, H-fake run right` → X: 9 | L: 1 | R: 0 | Z: motion left 3 | H: fake run right

## Brand / visual reference

Lake Zurich Flames Girls Flag Football: https://www.lzflames.org/lzflames/GirlsFlagFootball

- Navy `#0d1167`
- Orange accent `#eb6d20`
- White / light gray surfaces, dark gray text
