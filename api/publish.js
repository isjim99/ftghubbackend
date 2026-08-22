let games = [];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "POST required"
    });
  }

  try {
    const game = req.body;

    if (!game) {
      return res.status(400).json({
        ok: false,
        error: "No game data received"
      });
    }

    const savedGame = {
      ...game,
      receivedAt: new Date().toISOString()
    };

    games.push(savedGame);

    return res.status(200).json({
      ok: true,
      message: "Game received by FTG Hub",
      game: savedGame
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Could not publish game"
    });
  }
}
