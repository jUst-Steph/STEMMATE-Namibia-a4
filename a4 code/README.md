# STEMMate Namibia v1.1

STEMMate Namibia is an offline-first university software-engineering prototype
for adult STEM facilitators and teachers. It uses synthetic activities and
generic facilitator profiles only. It never stores pupil or attendance data.

## Install and run

Requirements: Node.js 22 and pnpm.

```sh
pnpm install
pnpm dev
```

The Figma Make development environment starts the development server
automatically, so `pnpm dev` is only needed outside that environment.

## Build and test

```sh
pnpm build
pnpm test
```

## Implemented

- Hash-based routes that survive reloads and work with browser Back.
- Activity search, exact filter rules, per-activity details and offline saving.
- IndexedDB persistence with an in-memory fallback and a visible warning.
- Stored plan creation, editing, one-second autosave, completion and deletion.
- Ordered steps with individual timings, materials, safety and inclusion.
- Queued, syncing, failed and synced states with an idempotent mock gateway.
- Guided and manual connection simulation controls.
- Keyboard-accessible native controls, focus management and trapped dialogs.
- Plan export, data deletion, text-size settings and demo reset.
- Responsive bottom navigation and desktop left rail.
- A small web manifest and service worker that cache the app shell and visited
  same-origin resources in production builds.

## Prototype boundaries

- There is no real server, account system, analytics or background sync.
- Sync uses a delayed, controllable mock gateway and creates no remote record.
- The service worker is registered only in production builds.
- The optional facilitator profile switcher and PIN are not implemented.
  Anyone using the device can open its plans.
- This is a prototype, not a production system.
