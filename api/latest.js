import { db, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'GET required'
    });
  }

  const client = await db().connect();

  try {
    const gameResult = await client.query(`
      select
        g.id,
        g.game_number,
        g.game_date,
        g.game_time,
        g.court,
        g.division,
        g.grade,
        g.format,
        g.period,
        g.status,
        g.home_team,
        g.away_team,
        g.home_score,
        g.away_score,
        g.home_fouls,
        g.away_fouls,
        g.published_at,
        e.name as event_name,
        e.slug as event_slug
      from ftg_games g
      join ftg_events e on e.id = g.event_id
      where coalesce(e.is_published, true) = true
      order by g.published_at desc nulls last, g.updated_at desc
      limit 1
    `);

    if (!gameResult.rows.length) {
      return res.status(404).json({
        ok: false,
        error: 'No published games found'
      });
    }

    const game = gameResult.rows[0];

    const playersResult = await client.query(`
      select
        side,
        player_number,
        player_name,
        pts,
        reb,
        ast,
        stl,
        blk,
        turnovers,
        fouls,
        ftm,
        ftx
      from ftg_game_players
      where game_id = $1
      order by pts desc, player_name asc
    `, [game.id]);

    return res.status(200).json({
      ok: true,
      game,
      players: playersResult.rows
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: 'FTG Hub latest game unavailable'
    });
  } finally {
    client.release();
  }
}
