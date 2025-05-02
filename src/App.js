// Nachashir - Full App.js with PKCE Spotify Login and Firebase

import React, { useState, useEffect } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "./utils/pkce";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAQSJGtftUC39JgKBh-nJ8PVJZNyp5a2t8",
  authDomain: "nacheshir.firebaseapp.com",
  projectId: "nacheshir",
  storageBucket: "nacheshir.appspot.com",
  messagingSenderId: "563068582138",
  appId: "1:563068582138:web:a4b04d1bacf1207a39f143"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const clientId = "37a01755aa874ed68a44428e9db92d26";
const redirectUri = "https://nachashir.vercel.app/";
const scopes = "user-read-private user-read-email streaming user-library-read user-read-playback-state";

export default function App() {
  const [user, setUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [room] = useState("room1");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log("Spotify code:", code);

    if (code && !spotifyToken) {
      const verifier = localStorage.getItem("verifier");
      if (verifier) {
        exchangeCodeForToken(code, verifier);
      }
    } else {
      const storedToken = localStorage.getItem("spotify_token");
      if (storedToken) setSpotifyToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", room), (docSnap) => {
      if (docSnap.exists()) setPlayers(docSnap.data().players || []);
    });
    return () => unsub();
  }, [room]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
    await setDoc(doc(db, "rooms", room), {
      players: [...players.filter(p => p.uid !== result.user.uid), {
        uid: result.user.uid,
        name: result.user.displayName
      }]
    });
  };

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

  const exchangeCodeForToken = async (code, verifier) => {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        setSpotifyToken(data.access_token);
        window.history.replaceState({}, document.title, "/");
      } else {
        console.error("Spotify token error:", data);
      }
    } catch (err) {
      console.error("Token request error", err);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>נחשיר 🎵</h1>

      {!user && <button onClick={handleLogin}>התחבר עם גוגל</button>}
      {user && <div>שלום, {user.displayName}</div>}

      {!spotifyToken && <button onClick={loginWithSpotify}>התחבר לספוטיפיי</button>}
      {spotifyToken && <div style={{ marginTop: "1rem" }}>✅ מחובר לספוטיפיי</div>}
    </div>
  );
}
