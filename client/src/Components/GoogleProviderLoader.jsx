import React, { useEffect, useState } from "react";

// Dynamically import @react-oauth/google to avoid build-time failures
// If the package is unavailable or fails to load, this component
// will render its children without the provider (graceful fallback).
export default function GoogleProviderLoader({ clientId, children }) {
  const [Provider, setProvider] = useState(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("@react-oauth/google");
        // module may export named GoogleOAuthProvider
        if (mounted && mod && mod.GoogleOAuthProvider) {
          setProvider(() => mod.GoogleOAuthProvider);
        }
        setTried(true);
      } catch (err) {
        // If import fails (package not installed or ESM/CJS mismatch), log and continue
        // so the app can load without OAuth support.
        // eslint-disable-next-line no-console
        console.warn("@react-oauth/google failed to load:", err.message || err);
        setTried(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // While we're attempting to load the provider, avoid rendering children
  // because they may call hooks (useGoogleLogin) that require the provider.
  if (!tried) return null;

  if (Provider) {
    const P = Provider;
    return <P clientId={clientId}>{children}</P>;
  }

  // If we've tried and failed to load the library, render children anyway
  // so the app remains functional (OAuth features will not work). This
  // situation usually indicates the package is missing or incompatible.
  return <>{children}</>;
}
