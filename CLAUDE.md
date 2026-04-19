# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
expo start

# Run on specific platform
expo start --ios
expo start --android
expo start --web

# Lint
expo lint
```

No test suite is configured yet.

## Architecture

**EventHive** is a multi-tenant event management app built with React Native + Expo, using Supabase for backend/auth.

### Navigation (Expo Router file-based)

```
app/
├── _layout.tsx          # Root layout — checks auth session, redirects accordingly
├── (auth)/              # Unauthenticated routes (login, register)
└── (app)/               # Protected routes (requires session)
    ├── _layout.tsx      # Auth guard — redirects to /login if no session
    ├── create-org.tsx
    └── (tabs)/          # Tab navigation (home/dashboard)
```

Auth redirect logic lives in `app/_layout.tsx` — it listens to `useAuth()` and routes to `(auth)` or `(app)` accordingly.

### Auth & State

- `hooks/use-auth.ts` — central auth hook. Returns `{ session, profile, loading, signIn, signUp, signOut }`. Subscribes to Supabase auth state changes and loads the user's profile from the `profiles` table.
- No global state library (no Redux/Context). Components call `useAuth()` directly.
- Session is persisted via `@react-native-async-storage/async-storage`.

### Supabase Backend

- Client initialized in `lib/supabase.ts` using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`.
- Full schema in `supabase-schema.sql`.

**Tables**: `profiles`, `organizations`, `organization_members`, `invitations`

**Role model**:
- Platform-level: `admin` (first registered user) or `organizer`
- Org-level: `owner` or `member`
- RLS is enforced on all tables — backend access control is defined in the SQL schema, not just in the app.

**Automatic profile creation**: A Postgres trigger fires on `auth.users` insert to create a row in `profiles`. The first user gets `admin` role; subsequent users become `organizer`.

### TypeScript

- Path alias `@/*` resolves to project root (configured in `tsconfig.json`).
- Shared types (Profile, Organization, Invitation) are in `types/index.ts`.

### UI & Theming

- `ThemedText` and `ThemedView` in `components/` wrap standard RN primitives with light/dark mode support via `useThemeColor`.
- Colors and fonts defined in `constants/theme.ts`. Primary green: `#22c55e`.

### Expo Config

- New Architecture, React Compiler (experimental), and Typed Routes (experimental) are all enabled in `app.json`.
- Web output is `static`.
