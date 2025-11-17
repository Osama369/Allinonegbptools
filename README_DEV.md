Local development setup for OAuth and API endpoints

This project uses Google OAuth and a server-side token exchange. For local development you should set up local redirect URIs and point the client to the local API server.

1) Add the following files (example values):

# server/.env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT=http://localhost:5173/OauthCall
PORT=5000
MONGO_URI=mongodb://localhost:27017/localseo

# client/.env (Vite - must start with VITE_)
VITE_API_BASE=http://localhost:5000
VITE_CLIENT_ID=your-google-client-id
VITE_OAUTH_REDIRECT=http://localhost:5173/OauthCall

2) Google Cloud Console
- In your OAuth 2.0 Client IDs configuration add both redirect URIs:
  - https://allinonegbptools.com/OauthCall
  - http://localhost:5173/OauthCall

3) Start servers
- Server: from project root or server folder:
  npm install
  node server/index.js

- Client (Vite): from client/ folder:
  npm install
  npm run dev

4) Test the flow
- Open the app in the browser (http://localhost:5173)
- Click Login -> follow Google consent -> you should be redirected to http://localhost:5173/OauthCall
- The client will POST the code to http://localhost:5000/auth/google which will exchange it with Google using redirect_uri=http://localhost:5173/OauthCall

Notes
- If you keep encountering 500 errors, check server logs for the token-exchange response from Google. Common causes:
  - REDIRECT_URI mismatch between the authorization request, the token exchange, and what's registered in Google Console.
  - Incorrect GOOGLE_CLIENT_ID/SECRET.
  - Using a production API URL from the client when testing locally.

If you want, I can add a small dev-only endpoint to print recent OAuth codes for debugging; let me know.