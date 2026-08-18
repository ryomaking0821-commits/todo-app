// これはFirebaseの「公開用」設定オブジェクトです。OpenAIのAPIキーのような秘密情報ではなく、
// 実際のデータ保護はFirestoreのセキュリティルール(users/{uid}を本人のみ読み書き可)で行います。
// このファイルの値は Firebaseコンソール > プロジェクトの設定 > マイアプリ から取得した値に置き換えてください。
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyABzfg535nVRCF3aoTeU1u8kVH76A3DsW4",
  authDomain: "ryoma-kashiwabara.firebaseapp.com",
  projectId: "ryoma-kashiwabara",
  storageBucket: "ryoma-kashiwabara.firebasestorage.app",
  messagingSenderId: "312018542363",
  appId: "1:312018542363:web:a4fdecda74bf2450803dbe",
  measurementId: "G-BPSEW7TLQR",
};

const app = initializeApp(firebaseConfig);

window.Firebase = {
  auth: getAuth(app),
  db: getFirestore(app),
  googleProvider: new GoogleAuthProvider(),
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
};
