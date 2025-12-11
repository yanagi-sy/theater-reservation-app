/**
 * ============================================
 * firebase.js - Firebase初期化設定
 * ============================================
 * 
 * Firebase（認証・データベース）の初期化を行うファイルです。
 * 
 * 主な役割：
 * 1. Firebaseアプリの初期化
 * 2. 認証サービス（Auth）の初期化
 * 3. データベースサービス（Firestore）の初期化
 * 4. 他のコンポーネントで使用できるようにエクスポート
 * 
 * 環境変数の設定：
 * .envファイルに以下の変数を設定してください：
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase設定オブジェクト
 * 
 * 環境変数（.envファイル）から読み込みます。
 * 未設定の場合は空文字列になります。
 * 
 * import.meta.env：
 * - Viteで使用される環境変数の読み込み方法
 * - VITE_で始まる変数のみクライアント側で使用可能
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Firebaseサービスの変数宣言（初期化後に値が代入されます）
let app;      // Firebaseアプリインスタンス
let auth;     // 認証サービスインスタンス
let db;       // Firestoreデータベースインスタンス

/**
 * Firebase初期化処理
 * 
 * エラーハンドリング：
 * - 設定が不完全な場合は初期化をスキップ
 * - エラーが発生した場合はコンソールにエラーを出力
 */
try {
  // 必須設定（apiKeyとprojectId）が揃っている場合のみ初期化
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    // Firebaseアプリを初期化
    app = initializeApp(firebaseConfig);
    
    // 認証サービスを初期化
    auth = getAuth(app);
    
    // Firestoreデータベースを初期化
    db = getFirestore(app);
  } else {
    // 設定が不完全な場合の警告
    console.warn("Firebase設定が不完全です。環境変数を設定してください。");
  }
} catch (error) {
  // 初期化エラーが発生した場合の処理
  console.error("Firebase初期化エラー:", error);
}

/**
 * エクスポート
 * 
 * 他のコンポーネントで使用できるように、必要なサービスをエクスポートします。
 * 
 * 使用例：
 * - import { db } from "./firebase";  // Firestoreを使用する場合
 * - import { auth } from "./firebase"; // 認証を使用する場合
 */
export { auth, db };
export default app;
