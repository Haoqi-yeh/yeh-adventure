# Art Pipeline

This project now treats visual assets as generated game content instead of page-only styling.

## Goals

- Keep the game as a text adventure at the logic layer.
- Make backgrounds and sprites swappable without rewriting React components.
- Reserve map generation for top-down route or scene backgrounds.
- Reserve sprite generation for player, NPC, prop, and effect assets.

## Tool split

- `generate2dmap`: route maps, area backgrounds, world scenes, login and chapter map backdrops
- `generate2dsprite`: player sprites, NPC sprites, portraits, props, and effects

## Current asset contract

- Login background file: `/assets/maps/login-route-topdown-v1.svg`
- Background registry: `src/lib/assets/game-art.ts`
- Sprite presets: `src/lib/assets/game-art.ts`
- Sprite drop zone: `public/assets/sprites/`

## Recommended rollout

1. Replace temporary SVG login background with a generated top-down map export.
2. Generate one controllable protagonist overworld sheet.
3. Generate one NPC sheet for recurring dialogue scenes.
4. Add props that match the map style.
5. Only then expand story-specific backgrounds or chapter art.

## Notes

- The UI should load backgrounds from asset paths, not inline layout art.
- Sprite manifests should stay stable even if individual files are regenerated.
- If a future generated asset is rejected, replace the file in `public/assets/...` rather than editing layout code again.
