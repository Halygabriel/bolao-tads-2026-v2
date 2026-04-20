import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7YAKAH4wFtiMkE8x3bm5j2et00IDeC7w",
  authDomain: "bolaotads.firebaseapp.com",
  projectId: "bolaotads",
  storageBucket: "bolaotads.firebasestorage.app",
  messagingSenderId: "225852821811",
  appId: "1:225852821811:web:2d1294de7e79dad3deee46",
  measurementId: "G-B98FXR0VB1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };