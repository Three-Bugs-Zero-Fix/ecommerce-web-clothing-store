
const firebaseConfig = {
  apiKey: "AIzaSyAtAs2GFlrdlWjsu3fHmaaAyJPYh22RtSI",
  authDomain: "clothing-brand-b30ae.firebaseapp.com",
  projectId: "clothing-brand-b30ae",
  storageBucket: "clothing-brand-b30ae.firebasestorage.app",
  messagingSenderId: "999101880627",
  appId: "1:999101880627:web:5c1fb79415de9ff5b28646"
};

// Initialize Firebase (compat SDK — no build tool / bundler required)
firebase.initializeApp(firebaseConfig);

// Shared handles other scripts on the page can use
const auth = firebase.auth();
const db = firebase.firestore();