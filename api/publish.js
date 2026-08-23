import { db, cors } from './_db.js';

function cleanInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'POST required'
    });
  }

  const payload = req.body || {};
  const eventSlug = String(payload.event_slug || 'ftg-demo-event').trim();
  const game = payload.game || {};
  const players = Array.isArray(payload.players) ? payload.players : [];

  if (!game.game_number) {
    return res.status(400).json({
      ok: false,
      error: 'Missing game.game_number'
    });
  }

  const client = await db().connect();

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      `insert into ftg_events (slug, name, is_published, updated_at)
       values ($1, $2, true, now())
       on conflict (slug) do update
       set is_published = true,
           updated_at = now()
       returning id, slug, name`,
      [eventSlug, payload.event_name || 'FTG Event']
    );

    const event = eventResult.rows[0];

    const gameResult = await client.query(
      `insert into ftg_games (
         event_id,
         external_game_id,
         game_number,
         game_date,
         game_time,
         court,
         division,
         grade,
         format,
         period,
         status,
         home_team,
         away_team,
         home_score,
         away_score,
         home_fouls,
         away_fouls,
         published_at,
         updated_at
       )
       values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'final',
         $11,$12,$13,$14,$15,$16,now(),now()
       )
       on conflict (event_id, game_number) do update set
         external_game_id = excluded.external_game_id,
         game_date = excluded.game_date,
         game_time = excluded.game_time,
         court = excluded.court,
         division = excluded.division,
         grade = excluded.grade,
         format = excluded.format,
         period = excluded.period,
         status = 'final',
         home_team = excluded.home_team,
         away_team = excluded.away_team,
         home_score = excluded.home_score,
         away_score = excluded.away_score,
         home_fouls = excluded.home_fouls,
         away_fouls = excluded.away_fouls,
         published_at = now(),
         updated_at = now()
       returning
         id,
         game_number,
         home_team,
         away_team,
         home_score,
         away_score,
         status`,
      [
        event.id,
        String(game.external_game_id || ''),
        String(game.game_number || '1'),
        game.game_date || null,
        game.game_time || null,
        game.court || null,
        game.division || null,
        game.grade || null,
        game.format || 'classic',
        game.period || 'FINAL',
        game.home_team || 'HOME TEAM',
        game.away_team || 'AWAY TEAM',
        cleanInt(game.home_score),
        cleanInt(game.away_score),
        cleanInt(game.home_fouls),
        cleanInt(game.away_fouls)
      ]
    );

    const savedGame = gameResult.rows[0];

    await client.query(
      'delete from ftg_game_players where game_id = $1',
      [savedGame.id]
    );

    for (const p of players) {
      if (!String(p.player_name || '').trim()) continue;

      await client.query(
        `insert into ftg_game_players (
           game_id,
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
         )
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          savedGame.id,
          p.side === 'away' ? 'away' : 'home',
          String(p.player_number || ''),
          String(p.player_name || ''),
          cleanInt(p.pts),
          cleanInt(p.reb),
          cleanInt(p.ast),
          cleanInt(p.stl),
          cleanInt(p.blk),
          cleanInt(p.turnovers),
          cleanInt(p.fouls),
          cleanInt(p.ftm),
          cleanInt(p.ftx)
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      ok: true,
      message: 'Game published to FTG Hub',
      event,
      game: savedGame,
      playerCount: players.filter(
        p => String(p.player_name || '').trim()
      ).length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: 'FTG Hub publish failed'
    });

  } finally {
    client.release();
  }
}
