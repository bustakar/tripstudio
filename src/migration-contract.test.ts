import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('trip document migration command', () => {
  it('loads the configured local environment', async () => {
    const packageJson = await readFile(
      new URL('../package.json', import.meta.url),
      'utf8',
    )

    expect(packageJson).toContain(
      '"db:migrate-trip-documents": "tsx --env-file-if-exists=.env.local',
    )
    expect(packageJson).toContain(
      'drizzle-kit migrate && auth migrate --config src/lib/auth.ts --yes',
    )
    expect(packageJson).toContain(
      '"vercel-build": "pnpm db:migrate && pnpm build"',
    )
  })
})
