# Mobile-Ready Architecture

CrewAnywhere should support mobile web first, with the option to share domain and service contracts with a future native shell.

## Rules

- Use responsive layouts by default.
- Use `min-h-dvh` for full-height screens to handle mobile browser chrome.
- Keep UI state in small client stores and keep server state out of UI components.
- Keep business rules in domain/application code, not in route components.
- Keep API contracts transport-safe so future mobile clients can reuse them.

## Current Foundation

- `src/app/layout.tsx` defines mobile viewport behavior.
- `src/app/manifest.ts` defines a PWA-ready baseline.
- `src/shared/ui` components use minimum touch target heights.
- `src/shared/state/app-store.ts` tracks navigation surface without coupling to a specific feature.
