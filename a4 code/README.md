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

## Running Automated Tests

The project uses [Vitest](https://vitest.dev/) for fast unit and domain logic verification. The test suite covers core modules including activity filtering (`filterActivities`), input validation (`validatePlan`), plan lifecycle management (`PlanService`), and offline synchronization (`SyncService`).

### Prerequisites
* Node.js installed on your local machine.

### Setup & Execution Steps

# STEMMate Namibia (Assessment 4)

STEMMate Namibia is an audit-ready software prototype built with TypeScript and React (Vite). Designed for resource-constrained environments, the application prioritizes low-bandwidth payloads, client-side persistence via IndexedDB, and resilient offline synchronization.

---

## 1. Environment & Terminal Setup

If you encounter script execution policy errors in Visual Studio Code under Windows PowerShell (e.g., `PSSecurityException` or `running scripts is disabled on this system`), switch your integrated terminal profile to **Command Prompt (CMD)**:

### Option A: Change Terminal via VS Code UI
1. Open the Integrated Terminal in VS Code (`Ctrl + ~` or `View` > `Terminal`).
2. Click the drop-down menu next to the **`+`** icon in the top-right corner of the terminal panel.
3. Select **Command Prompt** (or set it as your default profile via **Select Default Profile** > **Command Prompt**).

### Option B: Switch to CMD via Command Line
Alternatively, switch the active terminal instance to Command Prompt by executing:
```cmd
cmd

# Clone the project repository
git clone [https://github.com/225173131-Christian/Dsa.git](https://github.com/225173131-Christian/Dsa.git)

# Navigate into the project directory
cd Dsa

# Install project dependencies
npm install

# to run test use :
npm test

#To execute the complete test suite once and view a full execution timing summary :
npm run test:run

