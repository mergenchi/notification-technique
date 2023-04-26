import { Pool } from 'pg';

const pool = new Pool({
  host: '10.118.5.5',
  database: 'qp_kg',
  password: '4gioujhn2tg8o7yh',
  user: 'qp_kg_user',
  port: 5432,
});

interface Apparats {
  apparat_id: number;
  apparat_name?: string;
  id_technika?: string;
  last_trans_date: string;
  avg_p_day: number;
}

export async function queryDatabase(): Promise<Apparats[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT a.id AS apparat_id,
      a.name AS apparat_name,
      a.serial_number AS id_technika,
      MAX(pay_l.time) AS last_trans_date,
      trunc(SUM(total) / EXTRACT(day FROM (date_trunc('MONTH', CURRENT_DATE) - INTERVAL '1 MONTH' - INTERVAL '1 day'))) as avg_p_day
      FROM regions r
      JOIN apparats a ON a.id_region = r.id
      JOIN payments_log pay_l ON a.id = pay_l.id_apparat
      WHERE r.name LIKE '%QP%'
      AND a.name NOT LIKE '%Склад%'
      AND r.blocked = 0
      AND payments_run = 1
      AND id_bserver NOT IN (1008, 601)
      AND id_service <> 3315
      AND pay_l.time >= (CURRENT_DATE - INTERVAL '1 months')
      GROUP BY 1, 2, 3 Order by last_trans_date limit 10;
    `);
    return res.rows;
  } finally {
    client.release();
  }
}
