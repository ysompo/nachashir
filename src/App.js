import React, { useState, useEffect } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "./utils/pkce";
import { generateCodeVerifier, generateCodeChallenge } from "./utils/pkce";

// Spotify config
const clientId = "37a01755aa874ed68a44428e9db92d26";
const redirectUri = "https://nachashir.vercel.app/";
const scopes = "user-read-private user-read-email streaming user-library-read user-read-playback-state";

export default function App() {
  const [spotifyToken, setSpotifyToken] = useState(null);

  // Step 1: Check for Spotify code on redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !spotifyToken) {
      const verifier = localStorage.getItem("verifier");
      if (verifier) {
        exchangeCodeForToken(code, verifier);
      }
    } else {
      const storedToken = localStorage.getItem("spotify_token");
      if (storedToken) {
        setSpotifyToken(storedToken);
      }
    }
  }, []);

  // Step 2: Start Spotify login with PKCE
  const loginWithSpotify = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("verifier", verifier);

    const url = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${challenge}`;

    window.location.href = url;
  };

  // Step 3: Exchange code for token
  const exchangeCodeForToken = async (code, verifier) => {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      });

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        setSpotifyToken(data.access_token);
        window.history.replaceState({}, document.title, "/");
      } else {
        console.error("Token exchange failed", data);
      }
    } catch (error) {
      console.error("Token request error", error);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>נחשיר 🎵</h1>

      {!spotifyToken && (
        <button onClick={loginWithSpotify}>התחבר לספוטיפיי</button>
      )}
      {spotifyToken && (
        <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
          ✅ מחובר לספוטיפיי
        </div>
      )}
    </div>
  );
}
