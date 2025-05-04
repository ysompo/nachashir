// Nachashir – YouTube edition

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { getRandomVideo } from "./utils/youtube";

// Firebase
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
const db   = getFirestore(app);

// YouTube
const ytKey = process.env.REACT_APP_YT_KEY;
const defaultQuery = "שירי פופ ישראלי";

export default function App() {
  const [user,       setUser]       = useState(null);
  const [song,       setSong]       = useState(null); // {videoId,title}
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [guess,      setGuess]      = useState("");
  const [result,     setResult]     = useState(null);
  const [players,    setPlayers]    = useState([]);
  const room = "room1";

  // Firestore players
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", room), snap => {
      if (snap.exists()) setPlayers(snap.data().players || []);
    });
    return () => unsub();
  }, []);

  // Google login
  const googleLogin = async () => {
    const prov = new GoogleAuthProvider();
    const res  = await signInWithPopup(auth, prov);
    setUser(res.user);
    await setDoc(doc(db, "rooms", room), {
      players: [
        ...players.filter(p => p.uid !== res.user.uid),
        { uid: res.user.uid, name: res.user.displayName }
      ]
    });
  };

  // Pick random YouTube video
  const chooseSong = async () => {
    const vid = await getRandomVideo(defaultQuery, ytKey);
    if (vid) {
      setSong(vid);
      setIsPlaying(false);
      setGuess("");
      setResult(null);
    }
  };

  // Play first 6 sec
  const handlePlay = () => setIsPlaying(true);

  // Submit guess
  const submit = () => {
    if (!song) return;
    const ok =
      guess.trim().toLowerCase() === song.title.toLowerCase();
    setResult(ok ? "נכון!" : `טעות – התשובה: ${song.title}`);
  };

  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>נחשיר 🎵</h1>

      {!user && <button onClick={googleLogin}>התחבר עם גוגל</button>}
      {user && <div>שלום {user.displayName}</div>}

      {!song && (
        <button style={{ marginTop: "1rem" }} onClick={chooseSong}>
          בחר שיר מיוטיוב
        </button>
      )}

      {song && (
        <>
          <button onClick={handlePlay} disabled={isPlaying} style={{ marginTop: "1rem" }}>
            {isPlaying ? "מנגן…" : "נגן רמז"}
          </button>

          {isPlaying && (
            <iframe
              title="hint"
              width="0"
              height="0"
              src={`https://www.youtube.com/embed/${song.videoId}?autoplay=1&start=0&end=6`}
              allow="autoplay"
              style={{ display: "none" }}
            />
          )}

          <div style={{ marginTop: "1rem" }}>
            <input
              placeholder="מה שם השיר?"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              style={{ padding: "0.5rem", width: "300px" }}
            />
            <button onClick={submit} style={{ marginRight: "1rem" }}>
              שלח
            </button>
          </div>

          {result && (
            <div style={{ fontWeight: "bold", marginTop: "0.5rem" }}>
              {result}
            </div>
          )}
        </>
      )}
    </div>
  );
}
