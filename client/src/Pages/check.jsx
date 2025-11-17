import React from "react";

export default function check() {
  const redirect = encodeURIComponent(import.meta.env.VITE_OAUTH_REDIRECT || 'http://localhost:5173/OauthCall');
  const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=https://www.googleapis.com/auth/business.manage openid email profile&access_type=offline&prompt=consent`;
  return (
    // pages/Login.tsx (React)

    <button onClick={() => (window.location.href = GOOGLE_AUTH_URL)}>
      Login with Google
    </button>
  );
}
