# Yeh Adventure

This is a clean rebuild of the text adventure app.

## Current shape

- `src/app/page.tsx` contains the playable client experience.
- `src/app/api/adventure/route.ts` is the single backend entry point for story turns.
- `src/lib/adventure/engine.ts` contains the temporary local story engine.
- `src/lib/adventure/types.ts` defines the game state contract shared by the UI and API.

## Next steps

- Replace the local story engine with a Vercel-safe AI provider.
- Add persistence after the core loop feels right.
- Rebuild NPC memory, dice, traits, and long-term summary as separate modules only when needed.
