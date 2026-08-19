# TripStudio

TripStudio is an open-source structured workspace for travel-planning agents. The web app and MCP
server share one domain service: a concise Markdown planning brief plus a validated structured trip
document. TripStudio never books, changes, or cancels travel.

## Stack

- TanStack Start on Vercel
- PostgreSQL with Drizzle ORM
- Better Auth for browser sessions and MCP OAuth 2.1
- Official MCP TypeScript SDK v2
- shadcn/ui

## Local development

Requirements: Node.js 22+, pnpm 11+, and PostgreSQL.

```sh
createdb tripstudio
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`, create an account, then connect an MCP client to
`http://localhost:3000/mcp`.

## Environments

| Environment | Application                 | MCP                             |
| ----------- | --------------------------- | ------------------------------- |
| Development | `https://dev.tripstudio.cc` | `https://dev.tripstudio.cc/mcp` |
| Production  | `https://tripstudio.cc`     | `https://tripstudio.cc/mcp`     |

`main` deploys Development and promotes `dev.tripstudio.cc`. A `v*` tag deploys Production. Each
environment has independent Postgres data and Better Auth secrets. Configure `APP_URL`,
`DATABASE_URL`, and `BETTER_AUTH_SECRET` in Vercel's Preview and Production environments; mirror
the database and auth secrets in the matching GitHub environments for migrations.

## Plugins

`plugins/tripstudio` is the production Codex plugin. `plugins/tripstudio-dev` uses the Development
MCP endpoint. Their `plan-trip` skills intentionally remain identical.

## Checks

```sh
pnpm check
```
