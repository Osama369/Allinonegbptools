# LocalSeo (All-in-one GPT Tools) — Features

This document summarizes the features, pages, components, API endpoints, authentication flow, environment variables, and developer notes for the LocalSeo project (client + server).

## Table of contents
- Project overview
- Client (SPA) features
  - Key pages
  - Components
  - Tools (freemium) and integrations
  - Routing and layouts
  - Auth & cookies
- Server (API) features
  - Endpoints
  - Controllers
  - Models (high-level)
  - Middleware
- Environment variables
- How to run (dev)
- Notes & next steps


## Project overview

LocalSeo is a React + Vite single-page application (client) with a Node/Express server. The app provides a set of SEO and copywriting related tools (some calling external APIs like OpenAI, SerpAPI, Sapling) and user authentication (register/login). The UI uses TailwindCSS and React Router. The server provides tool endpoints and user auth.


## Client (SPA) features

- Frameworks & libs: React 19, Vite, React Router, TailwindCSS, Framer Motion, react-select, react-toastify, react-icons.
- Lazy-loaded main pages with a `MainLayout` (public) and `AuthLayout` for login/register.
- Modal context for global modal usage.
- Several freemium tools wired to external APIs and to server endpoints.


### Key pages

- `/` — Home: contains hero, info sections, tools carousel, testimonials, FAQ, CTA and modal. Uses `Modal` and `ModalContext` to show onboarding / registration prompt.
- `/Features` — Features page.
- `/Price` — Pricing page.
- `/Blog` and `/BlogPost/:id` — Blog listing and article.
- `/ToolPage` — Generic input/query tool page (entry for tools).
- `/ReviewToolPage` — Review tool UI: sends text to the Review Reply tool (OpenAI) via client controller.
- `/SerpToolPage` — SERP / keyword suggestion tool UI: fetches suggestions via server endpoint `/api/tools/serp-suggestion`.
- `/SaplingToolPage` — Sapling rewrite tool UI.
- `/RankingPage` — Google domain ranking checker UI: calls server `/api/tools/serp-ranking`.
- `/contact`, `/about`, `/Privacy`, `/Terms`, `/OauthCall`, `/PlanPage`, `/check`, and `/ToolComingSoon` — Additional pages.


### Components

- `Navbar.jsx`, `Footer.jsx` — Site chrome.
- `Hero.jsx`, `CTA.jsx`, `InfoSection.jsx`, `SimpleInfoSec.jsx`, `LocalbusinessSec.jsx` — Marketing sections for Home.
- `Toolscarsoul.jsx` — Carousel of available tools.
- `Modal.jsx` — Global modal used on Home.
- `PrivateRoute.jsx` / `AuthRedirect.jsx` — Auth helpers to gate access or redirect logged-in users.
- `Table.jsx`, `Testimonials.jsx`, `FAQ.jsx` — Informational components.


### Tools (freemium) & integrations

Client-side tool registry (in `client/src/Controllers/Freemium.tools.Controller.js`) exposes these tools:

- Review Reply (OpenAI GPT-4)
  - Calls OpenAI Chat Completions with model `gpt-4` using the env var `VITE_REVIEW_API`.
  - Used by `/ReviewToolPage` to generate review replies.
- Google Search (keyword suggestions)
  - Calls server endpoint `https://allinonegbptools.com/api/tools/serp-suggestion?q=...` (which maps to `/tools/serp-suggestion` on the server).
  - Server uses SerpAPI to fetch autocomplete suggestions.
- Google Domain Ranking
  - Calls server endpoint `https://allinonegbptools.com/api/tools/serp-ranking?q=...&domain=...` (server: `/tools/serp-ranking`).
  - Server uses SerpAPI to fetch organic results and locate the requested domain's position (top 100)
- Sapling Rewrite
  - Calls Sapling API `https://api.sapling.ai/api/v1/rephrase` using env var `VITE_SAP_API_KEY`.
- AI Post Generator (placeholder/unimplemented)


### Client-side routing & layout

- Routing is defined in `client/src/routes/AppRoutes.jsx`.
- `MainLayout` wraps public pages and includes navbar + footer.
- `AuthLayout` wraps login/register pages and uses `AuthRedirect` to prevent logged-in users from seeing auth pages.
- Lazy-loading is used for performance on `Home`, `About`, and `Login`.


### Auth & cookies

- Registration and login are handled by server endpoints `/users/register` and `/users/login`.
- On successful login, server responds with a JWT (`Token`) and `Plan`. Client helper `cookieHolder` stores token+plan in a `user` cookie (1 day expiry) using `js-cookie`.
- Some client utilities check localStorage or cookies for auth. `PrivateRoute.jsx` and `AuthRedirect.jsx` are used to guard routes and redirect appropriately.


## Server (API) features

- Built with Express, uses Mongoose for MongoDB, dotenv for config, and express-rate-limit (API limiter). The server also exposes a small OAuth token exchange endpoint at `/auth/google` used in Oauth flows.


### Main server file

- `server/index.js`
  - Connects to MongoDB (`./config/db`), mounts middleware (CORS, express.json, custom logger, ApiLimiter), and registers routes:
    - `/users` -> `server/Routes/userRoutes.js`
    - `/tools` -> `server/Routes/ToolRoute.js`
  - OAuth token exchange endpoint: POST `/auth/google` expects a `code` and exchanges it with Google for tokens then returns profile + access token.


### API endpoints (from server routes/controllers)

- User auth:
  - POST `/users/register` — registers user (username, email, country, password). Returns success or error.
  - POST `/users/login` — login with email and password. Returns `{ Token, Plan }` on success (JWT signed with `JWT_SECRET`).

- Tools:
  - GET `/tools/serp-suggestion?q=...` — returns an array of keyword suggestion strings (uses SerpAPI engine=google_autocomplete).
  - GET `/tools/serp-ranking?q=...&domain=...` — returns JSON { keyword, domain, rank } where rank is position in top 100 or "Not in top 100".

- OAuth:
  - POST `/auth/google` — exchanges an OAuth `code` with Google for access token, refresh token, id_token and returns profile + access_token. The redirect URI in server is hard-coded to `https://allinonegbptools.com/OauthCall` (note: update for local dev).


### Controllers

- `ToolsController.js` — contains `SerpSuggestionTool` and `SerpRankingTool`. Uses SerpAPI with an API key embedded in the controller (consider moving it to env variables).
- `userController.js` — `registerUser` and `loginUser` using Mongoose models, bcryptjs for password hashing, and jsonwebtoken for issuing JWT.


### Models (high-level)

- `UserModel.js` — stores username, email, country, hashed password, plan, and other user fields.
- `OauthSchema.js` — stores OAuth-related data when used.


### Middleware

- `ApiLimiter.js` — rate limiting for incoming requests.
- `logger.js` — request logging middleware.
- `verifyTokenMiddleware.js` — token verification helper (present in middleware directory but not wired into all routes).


## Environment variables (client & server)

- Client (`client/.env` - Vite):
  - VITE_REVIEW_API — OpenAI API key for Review Reply tool.
  - VITE_SAP_API_KEY — Sapling API key.
  - Other VITE_* variables used for keys/URLs.

- Server (`server/.env`):
  - MONGODB_URI — MongoDB connection string (used by `./config/db.js`).
  - JWT_SECRET — secret used to sign JWT tokens.
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET — for OAuth flows.
  - PORT — optional server port.


## How to run (development)

1. Server

   - cd into `server` and install dependencies (npm).
     - Scripts: `dev` runs `nodemon index.js`.

   - Make sure `.env` contains `MONGODB_URI`, `JWT_SECRET`, Google client secrets if using OAuth, and any other keys.

2. Client

   - cd into `client` and install dependencies (npm).
     - Scripts: `dev` runs `vite`.

   - Create `.env` (Vite) and add `VITE_REVIEW_API`, `VITE_SAP_API_KEY`, and other VITE_* keys.

3. Local testing notes

   - Server's OAuth redirect URI is currently set to `https://allinonegbptools.com/OauthCall` — update this to `http://localhost:3000/OauthCall` (or your client dev host) in both Google Console and `server/index.js` when testing locally.
   - SerpAPI key is hard-coded inside `ToolsController.js` — consider moving to `process.env.SERPAPI_KEY`.


## Notes & next steps

- Security:
  - Move all hard-coded API keys (SerpAPI key found in `ToolsController.js`) to `.env`.
  - Ensure CORS origin restrictions are set appropriately for production.

- Reliability:
  - Add input validation on server endpoints.
  - Add better error handling and consistent response shapes for the tools API.

- Features & UX:
  - Implement missing AI Post Generator tool.
  - Add UI for user plan management, and server checks to gate tool access by plan.


## Files of interest (quick map)

- client/
  - `src/routes/AppRoutes.jsx` — routing
  - `src/Controllers/Freemium.tools.Controller.js` — client tool registry
  - `src/Contexts/ModelContext.jsx` — modal context
  - `src/Pages/*` — page implementations (Home, ReviewToolPage, SerpPage, RankingPage, etc.)

- server/
  - `index.js` — server startup, OAuth token exchange
  - `Controllers/ToolsController.js` — SerpAPI integration
  - `Controllers/userController.js` — auth
  - `Routes/ToolRoute.js`, `Routes/userRoutes.js` — router mounting
  - `Models/UserModel.js`, `Models/OauthSchema.js` — data models


---

If you want, I can:
- Generate a tidy README.md with setup steps tailored to your environment.
- Move hard-coded keys into `.env` and wire them where needed.
- Add a short CONTRIBUTING.md and developer runbook.
