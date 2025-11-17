const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const toolRoutes = require("./Routes/ToolRoute");
const citationRoutes = require("./Routes/citationRoutes");
const logger = require("./Middleware/logger");
const ApiLimiter = require("./Middleware/ApiLimiter");
require("dotenv").config();
const cors = require("cors");
const app = express();
connectDB();
const Oauth = require("./Models/OauthSchema");
const axios = require("axios");

//middleware
app.use(cors());
app.use(express.json());
app.use(logger);
app.use(ApiLimiter);

//Routes
app.use("/users", userRoutes);
app.use("/tools", toolRoutes);
app.use("/tools/citation", citationRoutes);

const { OAuth2Client } = require("google-auth-library");

app.post("/auth/google", async (req, res) => {
  const { code, token, redirect_uri: redirectUriFromClient } = req.body;

  if (!code && !token) {
    console.error('No authorization code or id_token provided in /auth/google request');
    return res.status(400).json({ error: 'Missing authorization code or id_token' });
  }

  // Sanitize env values: strip surrounding quotes and trim
  const rawClientId = process.env.GOOGLE_CLIENT_ID || '';
  const rawClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const clientId = rawClientId.replace(/^['"]|['"]$/g, '').trim();
  const clientSecret = rawClientSecret.replace(/^['"]|['"]$/g, '').trim();

  // Allow the client to pass the redirect_uri it used when opening the
  // consent screen. Prefer the client's value, otherwise use the server env.
  const redirect_uri =
    redirectUriFromClient || process.env.GOOGLE_OAUTH_REDIRECT ||
    "https://allinonegbptools.com/OauthCall";

  try {
    // If client sent an ID token (token), verify it and return the profile directly
    if (token) {
      try {
        const oauthClient = new OAuth2Client(clientId || undefined);
        const ticket = await oauthClient.verifyIdToken({
          idToken: token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        console.log('Verified id_token for', payload?.email);
        return res.json({
          success: true,
          access_token: token,
          profile: payload,
        });
      } catch (verifyErr) {
        console.error('ID token verification failed:', verifyErr?.message || verifyErr);
        return res.status(400).json({ error: 'Invalid ID token' });
      }
    }

    console.log('OAuth token exchange using redirect_uri:', redirect_uri);
    console.log('OAuth token exchange using client_id:', clientId ? (clientId.slice(0, 8) + '...' + clientId.slice(-8)) : '<missing>');

    // Google expects the token request as application/x-www-form-urlencoded
    // in the request body (not query params). Build URLSearchParams and send
    // with the proper header.
    const bodyParams = new URLSearchParams();
    bodyParams.append('client_id', clientId);
    bodyParams.append('client_secret', clientSecret);
    bodyParams.append('code', code);
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('redirect_uri', redirect_uri);

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      bodyParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenRes.data;

    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );

    res.json({
      access_token,
      profile: userInfo.data,
    });
  } catch (err) {
    console.error("Token exchange failed:", err.response?.data || err.message);
    res.status(400).json({ error: "OAuth exchange failed", details: err.response?.data });
  }
});

const PORT = process.env.PORT || 5000;

// Convenience route: handle OAuth provider redirects directly to the server.
// This is a small HTML shim that extracts the `code` param and POSTs it back to
// the server's token-exchange endpoint (/auth/google). This helps when the
// frontend app is not being served from the same host (or static hosting) and
// avoids a 500 on the OAuth redirect endpoint. Safe to keep; it only posts the
// authorization code to the same origin.
app.get('/OauthCall', (req, res) => {
  const html = `<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>OAuth Redirect</title></head>
    <body>
      <p>Processing OAuth response...</p>
      <script>
        (function(){
          try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (!code) {
              document.body.innerText = 'No code returned from provider.';
              return;
            }
            // POST the code to server's token exchange endpoint
            fetch('/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            }).then(r => r.json()).then(j => {
              // try to store in localStorage and redirect to home
              try { localStorage.setItem('oauth_result', JSON.stringify(j)); } catch(e){}
              // redirect to root so SPA can pick up stored tokens if needed
              window.location.href = '/';
            }).catch(err => {
              console.error(err);
              document.body.innerText = 'OAuth exchange failed. See console for details.';
            });
          } catch (e) {
            document.body.innerText = 'OAuth redirect handling error.';
          }
        })();
      </script>
    </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
