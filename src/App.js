// נחשיר - אפליקציה מרובת משתתפים לניחוש שירים בעברית עם אינטגרציה לספוטיפיי
// Force Vercel redeploy to apply correct Spotify redirect URI

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

// Firebase config – replace with your actual Firebase settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Spotify settings
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
  const [room, setRoom] = useState("room1");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const token = new URLSearchParams(hash.substring(1)).get("access_token");
      setSpotifyToken(token);
      window.location.hash = "";
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

  const loginWithSpotify = () => {
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = url;
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

