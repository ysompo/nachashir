import React from "react";

const clientId = "37a01755aa874ed68a44428e9db92d26";
const redirectUri = "https://nachashir.vercel.app/";
const scopes = "user-read-private user-read-email streaming user-library-read user-read-playback-state";
const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
      <h1>🔑 Spotify Redirect Test</h1>
      <a
        href={spotifyUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#1DB954",
          color: "white",
          padding: "1rem 2rem",
          fontSize: "1.2rem",
          borderRadius: "5px",
          textDecoration: "none"
        }}
      >
        Login with Spotify
      </a>
    </div>
  );
}
