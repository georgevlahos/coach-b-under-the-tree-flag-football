# Formations — Coach B Under the Tree


## Position ID reference
| ID  | Label                    | Priority        |
| --- | ------------------------ | --------------- |
| `X` | Outside Receiver (Left)  | **Learn first** |
| `L` | Slot Receiver (Left)     | **Learn first** |
| `R` | Slot Receiver (Right)    | **Learn first** |
| `Z` | Outside Receiver (Right) | **Learn first** |
| `Q` | Quarterback              | Learn later     |
| `C` | Center                   | Learn later     |
| `H` | Halfback                 | Learn later     |


##Formations 
1. Spread 
2. Trips Left
3. Trips Right

## Spread — `spread`
```
                    END ZONE
    ← LEFT SIDELINE          RIGHT SIDELINE →

    (X)----(L)----(C)----(R)----(Z)
                      (H)
                      (Q)
```
### Number to listen for in play call
- **X, Z:** 1st number
- **L, R:** 2nd number
- **H:** from tag (always tagged for now)

## Trips Left — `trips-left`
```
                    END ZONE

    (X)--(L)--(R)----(C)----------------(Z)
                      (H)
                      (Q)
```
### Number to listen for in play call
- **X, Z:** 1st number
- **L:** 2nd number
- **R:** 3rd number
- **H:** from tag (always tagged for now)

## Trips Right — `trips-right`
```
                    END ZONE

    (X)----------------(C)----(L)--(R)--(Z)
                        (H)
                        (Q)
```
### Number to listen for in play call
- **X, Z:** 1st number
- **R:** 2nd number
- **L:** 3rd number
- **H:** from tag (always tagged for now)

## How the coach will call plays

3-step sequence (written form matches `BASICS.md` — **no commas** in the route digits):

1. Formation (e.g. `Spread`)
2. Routes from outside in, mirrored on both sides for Spread (e.g. `2-3` or Trips `193`)
3. Tags for H and overrides / motion (e.g. `H-7`, `Hazer Left 3`, `X-X-X 2`)
   - Always tag H (for now)
   - Repeat non-H position 3 times so the player notices (`X-X-X 2`)

Examples:

`Spread 2-3, H-7`
- Outside (X, Z) run 2 (Slant); inside (L, R) run 3 (Arrow); H runs 7 (Wheel)

`Trips Right 193 Hazer Left-3, X-2`
- Outside (X, Z) run 1 (Hitch); R runs 9 (Corner); L runs 3 (Arrow)
- Tags: X overridden to 2 (Slant); H motions left and runs 3 (Arrow)

`Trips Right 011 Hazer Right 3, R-R-R Reverse`
- Outside (X, Z) run 0 (Vertical); R runs 1 (Hitch); L runs 1 (Hitch)
- Tags: H motions right and runs 3 (Arrow); R runs Reverse (play, not a route number)
