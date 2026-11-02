import pg from 'pg';
import { SUPPORTED_PLATFORMS } from '../config/platforms.js';

const {
    Pool
} = pg;

// console.log('DATABASE_URL:', process.env.DATABASE_URL);

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function query(
    text,
    params
) {
    return pool.query(
        text,
        params
    );
}

// SUPPORTED_PLATFORMS là hằng số nội bộ nên có thể ghép trực tiếp vào câu lệnh CHECK.
const platformCheckList = SUPPORTED_PLATFORMS
    .map(platform => `'${platform}'`)
    .join(', ');

export async function initializeDatabase() {
    await query(`
      CREATE TABLE IF NOT EXISTS discovery_job_slots (
          platform TEXT NOT NULL
              CONSTRAINT discovery_job_slots_platform_check
              CHECK (platform IN (${platformCheckList})),

          slot_number SMALLINT NOT NULL
              CHECK (slot_number IN (1, 2)),

          job_id UUID NOT NULL UNIQUE,

          status TEXT NOT NULL DEFAULT 'IDLE'
              CHECK (
                  status IN (
                      'IDLE',
                      'RUNNING',
                      'COMPLETED',
                      'FAILED'
                  )
              ),

          request_data JSONB,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          finished_at TIMESTAMPTZ,

          result_count INTEGER,
          creator_count INTEGER,
          error_message TEXT,

          PRIMARY KEY (platform, slot_number)
      );
  `);

    // CREATE TABLE IF NOT EXISTS không cập nhật bảng đã có,
    // nên đồng bộ lại CHECK mỗi lần khởi động để nhận nền tảng mới.
    await query(`
      ALTER TABLE discovery_job_slots
          DROP CONSTRAINT IF EXISTS discovery_job_slots_platform_check;

      ALTER TABLE discovery_job_slots
          ADD CONSTRAINT discovery_job_slots_platform_check
          CHECK (platform IN (${platformCheckList}));
  `);

    await query(`
      INSERT INTO discovery_job_slots (
          platform,
          slot_number,
          job_id,
          status
      )
      SELECT
          platforms.platform,
          slots.slot_number,
          gen_random_uuid(),
          'IDLE'
      FROM unnest($1::text[]) AS platforms(platform)
      CROSS JOIN (
          VALUES (1), (2)
      ) AS slots(slot_number)
      ON CONFLICT (platform, slot_number) DO NOTHING;
  `, [SUPPORTED_PLATFORMS]);


    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,

            email TEXT UNIQUE,

            name TEXT,

            created_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS google_accounts (
            id BIGSERIAL PRIMARY KEY,

            user_id BIGINT NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            google_user_id TEXT NOT NULL,

            google_email TEXT NOT NULL,

            access_token TEXT,

            refresh_token TEXT,

            token_type TEXT,

            scope TEXT,

            expiry_date BIGINT,

            created_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW(),

            UNIQUE(user_id),

            UNIQUE(google_user_id)
        );
    `);

    const result = await query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema,
        to_regclass('discovery_job_slots') AS table_name,
        COUNT(*) AS slot_count
      FROM discovery_job_slots
    `);

    console.log('Slot table verification:', result.rows[0]);

    console.log(
        'Database initialized successfully.'
    );
}
