FTG HUB v2 — CLEAN REBUILD

Important correction:
The old Hub and scorer were never successfully tested end-to-end. This rebuild is designed to test that connection cleanly.

Included:
- Simple Hub page
- Mascot placeholder at top
- Sponsor button
- Latest score + player stats
- /api/health
- /api/publish
- /api/event
- /api/latest
- Neon/Postgres support via DATABASE_URL
- CORS support for a local scorer file

Next:
1. Put these files in the new ftghubbackend GitHub repo.
2. Import that repo into Vercel as a new project.
3. Add DATABASE_URL in Vercel.
4. Test /api/health.
5. Test Hub home page.
6. Point scorer FTG_HUB_PUBLISH_URL to the NEW /api/publish URL.
7. Run one tiny game and verify it appears.

Roster:
Roster import is intentionally the next phase after scorer -> Hub publishing is proven.
