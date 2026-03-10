You are integrating the frontend of a football scouting platform called SoccerMind with a real backend API.

Project context:
SoccerMind is a football scouting and recruitment analysis platform for clubs, scouts and analysts.

The backend is already deployed and working.

Base API URL:
https://scout-engine-production.up.railway.app

OpenAPI URL:
https://scout-engine-production.up.railway.app/api/docs/openapi.json

Important:
Use the OpenAPI schema as the source of truth for request and response formats.
Do not invent new backend routes if existing ones already solve the UI needs.
Do not rely on mock data if the API is available.
Preserve the current frontend structure as much as possible, and only adapt components when necessary to match the backend contract.

--------------------------------------------------
GOAL
--------------------------------------------------

Connect the existing SoccerMind frontend to the real backend API so the MVP becomes fully functional.

The frontend must consume real API data for:
- player listing
- player search
- player profile
- similar players
- player projection
- player comparison
- watchlist
- alerts
- explainability reports
- transfer simulation
- team analysis

Do not redesign the platform.
Focus on integration, data mapping, and API consumption.

--------------------------------------------------
API ENDPOINTS TO USE
--------------------------------------------------

Health:
GET /api/health

Players:
GET /api/players?page=1&limit=20
GET /api/players/search
GET /api/player/{id}
GET /api/player/{id}/projection
GET /api/player/{id}/similar
GET /api/player/{id}/notes
POST /api/player/{id}/notes

Comparison:
GET /api/compare/{idA}/{idB}
GET /api/compare/by-name/{nameA}/{nameB}

Simulation:
POST /api/simulation/transfer

Team Analysis:
GET /api/team/analysis

Watchlist:
GET /api/watchlist
POST /api/watchlist
DELETE /api/watchlist/{id}

Alerts:
GET /api/alerts

Reports:
GET /api/reports/{id}/explainability

Validation:
POST /api/validation/model

Docs:
GET /api/docs/openapi.json

--------------------------------------------------
EXPECTED PLAYER CONTRACT
--------------------------------------------------

Use this player structure in the frontend whenever possible:

{
  "id": string,
  "name": string,
  "position": string | null,
  "positions": string[],
  "team": string | null,
  "league": string | null,
  "nationality": string,
  "age": number,
  "overall": number | null,
  "potential": number | null,
  "marketValue": number | null,
  "image": string | null,
  "attributes": object
}

Important mapping rules:
- Use "image" as the public image field
- Use "position" as the primary display position
- Use "positions" for tags, filters or secondary display
- Use "marketValue" as the financial field
- Do not expect imagePath in the frontend
- Do not invent different field names if the API already exposes the correct contract

--------------------------------------------------
RESPONSE ENVELOPE
--------------------------------------------------

The backend uses a standard API response envelope:

{
  "success": true,
  "data": ...,
  "error": null,
  "meta": {}
}

Always read data from:
response.data

For paginated endpoints, read pagination from:
response.meta

Expected pagination meta format:
{
  "page": number,
  "limit": number,
  "total": number,
  "totalPages": number
}

--------------------------------------------------
FRONTEND INTEGRATION RULES
--------------------------------------------------

1. Replace mock data with real API calls where backend endpoints already exist.
2. Keep the same screen structure and UX where possible.
3. If the UI currently expects slightly different field names, create a mapping/adaptation layer instead of changing the backend contract.
4. Handle loading, empty state and API error state gracefully.
5. Do not spam the backend with repeated automatic requests.
6. Use pagination for player listing.
7. Use search endpoint for advanced player filtering if available.
8. Keep the MVP stable and functional before adding enhancements.

--------------------------------------------------
SCREENS TO INTEGRATE
--------------------------------------------------

1) Dashboard
Use backend data where available for:
- alerts
- top players
- scouting summary
- key metrics

If some dashboard widgets do not yet have a perfect backend match, keep them visually intact and populate only the sections already supported by real endpoints.

2) Players List
Use:
GET /api/players?page=1&limit=20

Display:
- image
- name
- team
- position
- overall
- potential
- nationality
- age

Add support for:
- pagination
- filters
- search

3) Player Search
Use:
GET /api/players/search

Allow filters such as:
- position
- team
- league
- age range
- overall range

4) Player Profile
Use:
GET /api/player/{id}

Display:
- image
- name
- team
- league
- nationality
- age
- position
- positions
- overall
- potential
- marketValue
- attributes

Use:
GET /api/player/{id}/projection
GET /api/player/{id}/similar
GET /api/player/{id}/notes

5) Similar Players
Use:
GET /api/player/{id}/similar

Display a list of related players with:
- image
- name
- team
- position
- overall

6) Player Projection
Use:
GET /api/player/{id}/projection

Show:
- growth or projection data
- future-oriented metrics
- development information if returned by the backend

7) Player Comparison
Use:
GET /api/compare/{idA}/{idB}
or
GET /api/compare/by-name/{nameA}/{nameB}

Display side-by-side comparison for:
- overall
- attributes
- risk metrics
- financial metrics
- scouting metrics

8) Watchlist
Use:
GET /api/watchlist
POST /api/watchlist
DELETE /api/watchlist/{id}

Allow the user to:
- view watched players
- add a player
- remove a player

9) Alerts
Use:
GET /api/alerts

Display:
- market opportunities
- risk alerts
- noteworthy player alerts

10) Reports / Explainability
Use:
GET /api/reports/{id}/explainability

Display:
- AI explanation
- narrative summary
- explainability blocks
- scouting reasoning

11) Transfer Simulation
Use:
POST /api/simulation/transfer

Build a form that sends the correct payload expected by the backend.
Render:
- impact
- fit
- recommendation
- risk

12) Team Analysis
Use:
GET /api/team/analysis

If the backend response is partial, render only the fields actually returned and preserve the rest of the layout as placeholder until later phases.

--------------------------------------------------
IMPLEMENTATION STRATEGY
--------------------------------------------------

Create a frontend API service layer.

Recommended structure:
- api client
- endpoint functions
- response mappers
- page-level data loaders

Use a mapper/adaptation layer so UI components receive normalized frontend-friendly objects.

Example:
- mapApiPlayerToCard()
- mapApiPlayerToProfile()
- mapApiComparisonToViewModel()

Do not tightly couple raw backend responses directly to UI components if a thin mapping layer improves stability.

--------------------------------------------------
ERROR HANDLING
--------------------------------------------------

For all API calls:
- handle loading
- handle empty response
- handle backend error
- handle null fields safely

Do not crash if:
- image is null
- marketValue is null
- overall is null
- potential is null
- team is missing
- league is missing

Use sensible fallbacks in the UI.

--------------------------------------------------
MVP CONSTRAINTS
--------------------------------------------------

This phase is MVP integration only.

Do NOT:
- redesign the backend
- invent a new overall model
- create new advanced analytics not already exposed
- block progress waiting for perfect data

Do:
- connect the frontend to the real backend
- preserve the current user flows
- make all supported screens functional
- keep the app stable

--------------------------------------------------
FINAL OBJECTIVE
--------------------------------------------------

Turn the SoccerMind frontend from mock-based MVP into a real API-connected MVP, using the backend as the source of truth and preserving the current design and navigation.