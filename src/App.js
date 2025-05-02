import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  generateCodeVerifier,
  generateCodeChallenge
} from "./utils/pkce";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAQSJGtftUC39JgKBh-nJ8PVJZNyp5a2t8",
  authDomain: "nacheshir.firebaseapp.com",
  projectId: "nacheshir",
  storageBucket: "nacheshir.appspot.com",
  messagingSenderId: "563068582138",
  appId: "1:563068582138:web:a4b04d1bacf1207a39f143",
  measurementId: "G-VLHNYGWK6N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Spotify config
const clientId = "37a01755aa874ed68a44428e9db92d26";
const redirectUri = "https://nachashir.vercel.app/";
const scopes = "user-read-private user-read-email streaming user-library-read user-read-playback-state";

export default function App() {
  const [user, setUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [song, setSong] = useState(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [players, setPlayers] = useState([]);
  const room = "room1";

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", room), (docSnap) => {
      if (docSnap.exists()) {
        setPlayers(docSnap.data().players || []);
      }
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

    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}` +
                `&response_type=code` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${encodeURIComponent(scopes)}` +
                `&code_challenge_method=S256&code_challenge=${challenge}`;
    window.location.href = url;
  };

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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  const fetchSpotifySong = async () => {
    if (!spotifyToken) return;
    const res = await fetch("https://api.spotify.com/v1/recommendations?seed_genres=pop&limit=1", {
      headers: { Authorization: `Bearer ${spotifyToken}` }
    });
    const data = await res.json();
    if (data.tracks && data.tracks.length > 0) {
      const track = data.tracks[0];
      setSong({
        title: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        preview_url: track.preview_url
      });
    }
  };

  const handlePlay = () => {
    if (!song?.preview_url) return;
    const audio = new Audio(song.preview_url);
    audio.play();
    setIsPlaying(true);
    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, 5000);
  };

  const handleSubmit = () => {
    const isCorrect = guess.trim().toLowerCase() === song.title.toLowerCase();
    setResult(isCorrect ? "נכון!" : `טעות - התשובה הנכונה: ${song.title}`);
  };

  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>נחשיר 🎵</h1>

      {!user && <button onClick={handleLogin}>התחבר עם גוגל</button>}
      {user && <div>שלום, {user.displayName}</div>}

      {!spotifyToken && <button onClick={loginWithSpotify}>התחבר לספוטיפיי</button>}
      {spotifyToken && <button onClick={fetchSpotifySong}>בחר שיר מספוטיפיי</button>}

      {song && (
        <div style={{ marginTop: "2rem" }}>
          <button onClick={handlePlay} disabled={isPlaying || !song.preview_url}>
            {isPlaying ? "מנגן..." : "נגן רמז"}
          </button>
          <br /><br />
          <input
            placeholder="מה שם השיר?"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            style={{ padding: "0.5rem", width: "300px" }}
          />
          <br /><br />
          <button onClick={handleSubmit}>שלח ניחוש</button>
          {result && <div style={{ marginTop: "1rem", fontWeight: "bold" }}>{result}</div>}
        </div>
      )}
    </div>
  );
}
