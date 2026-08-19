import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

describe('published plugins', () => {
  it('keeps development and production guidance identical', async () => {
    expect(await read('plugins/tripstudio-dev/skills/plan-trip/SKILL.md')).toBe(
      await read('plugins/tripstudio/skills/plan-trip/SKILL.md'),
    )
  })

  it('keeps environments on their stable domains', async () => {
    expect(await read('plugins/tripstudio/.mcp.json')).toContain(
      'https://tripstudio.cc/mcp',
    )
    expect(await read('plugins/tripstudio-dev/.mcp.json')).toContain(
      'https://dev.tripstudio.cc/mcp',
    )
  })
})
