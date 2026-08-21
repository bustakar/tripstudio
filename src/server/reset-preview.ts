import { pathToFileURL } from 'node:url'

import { pool } from '@/lib/database'

function requirePreviewEnvironment() {
  if (process.env.TRIPSTUDIO_PR_PREVIEW !== '1')
    throw new Error(
      'Preview reset requires TRIPSTUDIO_PR_PREVIEW=1 and an isolated database.',
    )
}

export async function resetPreview() {
  requirePreviewEnvironment()
  await pool.query(`
    DO $$
    DECLARE preview_table record;
    BEGIN
      FOR preview_table IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      LOOP
        EXECUTE format(
          'TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE',
          preview_table.tablename
        );
      END LOOP;
    END $$;
  `)
}

async function main() {
  try {
    await resetPreview()
    process.stdout.write('Cleared inherited preview data.\n')
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main()
