import { query, pool } from '../../db/index.js';

const PLATFORMS = ['tiktok', 'instagram', 'youtube'];

export class JobSlotService {
  async acquireSlot(platform, requestData) {
    if (!PLATFORMS.includes(platform)) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Khóa các slot của nền tảng để tránh hai request
      // đồng thời cùng cấp một slot.
      await client.query(
        `SELECT slot_number
         FROM discovery_job_slots
         WHERE platform = $1
         ORDER BY slot_number
         FOR UPDATE`,
        [platform]
      );

      const result = await client.query(
        `SELECT slot_number, job_id, status
         FROM discovery_job_slots
         WHERE platform = $1
           AND status IN ('IDLE', 'COMPLETED', 'FAILED')
         ORDER BY slot_number
         LIMIT 1`,
        [platform]
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const slot = result.rows[0];
      // const jobId = randomUUID();
      const jobId = slot.job_id;

      await client.query(
        // `UPDATE discovery_job_slots
        //  SET job_id = $1,
        //      status = 'RUNNING',
        //      request_data = $2::jsonb,
        //      created_at = NOW(),
        //      started_at = NOW(),
        //      finished_at = NULL,
        //      result_count = NULL,
        //      creator_count = NULL,
        //      error_message = NULL
        //  WHERE platform = $3
        //    AND slot_number = $4`,
        `UPDATE discovery_job_slots
         SET status = 'RUNNING',
             request_data = $1::jsonb,
             created_at = NOW(),
             started_at = NOW(),
             finished_at = NULL,
             result_count = NULL,
             creator_count = NULL,
             error_message = NULL
         WHERE platform = $2
          AND slot_number = $3`,
        [
          // jobId,
          JSON.stringify(requestData),
          platform,
          slot.slot_number,
        ]
      );

      await client.query('COMMIT');

      return {
        jobId,
        platform,
        slotNumber: slot.slot_number,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async completeJob(platform, slotNumber, jobId, result) {
    const updated = await query(
      `UPDATE discovery_job_slots
       SET status = 'COMPLETED',
           finished_at = NOW(),
           result_count = $1,
           creator_count = $2,
           error_message = NULL
       WHERE platform = $3
         AND slot_number = $4
         AND job_id = $5
         AND status = 'RUNNING'`,
      [
        result.resultCount,
        result.creatorCount,
        platform,
        slotNumber,
        jobId,
      ]
    );

    if (updated.rowCount !== 1) {
      throw new Error(`Cannot complete job ${jobId}`);
    }
  }

  async failJob(platform, slotNumber, jobId, error) {
    await query(
      `UPDATE discovery_job_slots
       SET status = 'FAILED',
           finished_at = NOW(),
           error_message = $1
       WHERE platform = $2
         AND slot_number = $3
         AND job_id = $4
         AND status = 'RUNNING'`,
      [
        String(error?.message ?? error).slice(0, 4000),
        platform,
        slotNumber,
        jobId,
      ]
    );
  }
}
