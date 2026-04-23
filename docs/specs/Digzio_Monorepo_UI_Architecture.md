# Digzio Monorepo & Shared UI Architecture

This document outlines the refactored frontend architecture for the Digzio platform. To ensure a seamless "look and feel" between the marketing website (`www.digzio.co.za`) and the application portals (`app.digzio.co.za`), the repository has been structured as a **PNPM Workspace Monorepo**.

## 1. The Monorepo Structure

The codebase is organized to separate deployable applications from shared libraries.

```
digzio/
├── pnpm-workspace.yaml
├── apps/
│   ├── web-marketing/    # React + Vite (www.digzio.co.za)
│   ├── web-student/      # React + Vite (app.digzio.co.za/student)
│   ├── web-provider/     # React + Vite (app.digzio.co.za/provider)
│   └── web-admin/        # React + Vite (admin.digzio.co.za)
├── packages/
│   ├── ui/               # Shared React components (@digzio/ui)
│   ├── config/           # Shared ESLint, TSConfig, Prettier
│   └── types/            # Shared TypeScript interfaces (API contracts)
└── backend/              # Node.js Microservices
```

## 2. The `@digzio/ui` Package

The `@digzio/ui` package acts as the single source of truth for the Digzio design system. It contains the Tailwind configuration, CSS variables, and all reusable React components (buttons, inputs, dialogs, cards).

### Benefits of the Shared UI Package
1. **Visual Consistency:** The Student App and Provider App import buttons and forms directly from `@digzio/ui`. If the primary brand color (`--color-teal`) is updated in the UI package, it instantly reflects across the marketing site and all apps.
2. **Development Speed:** Engineers building the Provider Portal do not need to rewrite complex UI components (like the drag-and-drop image gallery). They simply import them.
3. **Reduced Bundle Size:** Shared dependencies are hoisted to the root `node_modules` folder by PNPM, reducing disk space and install times.

### Implementation Example

Inside `apps/web-student/src/pages/Dashboard.tsx`:

```tsx
import { Button, Card, Typography } from '@digzio/ui';

export default function Dashboard() {
  return (
    <Card>
      <Typography variant="h2">Welcome back</Typography>
      <Button variant="primary">View Applications</Button>
    </Card>
  );
}
```

## 3. Tailwind CSS Integration

To ensure Tailwind classes are properly compiled across workspace boundaries, the `tailwind.config.ts` in each application must scan the `@digzio/ui` package for class names.

```typescript
// apps/web-student/tailwind.config.ts
import sharedConfig from '@digzio/ui/tailwind.config';

export default {
  presets: [sharedConfig],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}" // Scan shared UI package
  ],
};
```

## 4. Next Steps for Developers

Before starting development on the Student or Provider apps, engineers must run `pnpm install` from the repository root. This will automatically link the `@digzio/ui` package into the `node_modules` of each application, enabling seamless imports without publishing to a public npm registry.
