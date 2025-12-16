/**
 * ============================================
 * TroupeLoginPage.jsx - 劇団ログインページ
 * ============================================
 * 
 * 劇団のログイン・新規登録を行うページです。
 * 
 * 主な機能：
 * 1. メールアドレス・パスワードでのログイン
 * 2. 新規登録（メールアドレス・パスワード・劇団名）
 * 3. ログイン成功後のダッシュボードへのリダイレクト
 * 4. エラーメッセージの表示
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./TroupeLoginPage.css";

/**
 * TroupeLoginPageコンポーネント
 * 
 * @returns {JSX.Element} ログイン・新規登録ページのUI
 */
function TroupeLoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 認証状態を取得

  // フォームの状態管理
  const [isLogin, setIsLogin] = useState(true); // ログインモードか新規登録モードか
  const [email, setEmail] = useState("");       // メールアドレス
  const [password, setPassword] = useState("");  // パスワード
  const [troupeName, setTroupeName] = useState(""); // 劇団名（新規登録時のみ）
  const [error, setError] = useState("");       // エラーメッセージ
  const [loading, setLoading] = useState(false); // 送信中の状態

  // 既にログインしている場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (user) {
      navigate("/troupe/dashboard", { replace: true });
    }
  }, [user, navigate]);

  /**
   * フォーム送信処理
   * 
   * @param {Event} e - フォーム送信イベント
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // エラーメッセージをクリア
    setLoading(true);

    try {
      // Firebase初期化チェック
      if (!auth) {
        const error = new Error("Firebase Authenticationが初期化されていません。");
        error.code = "auth/configuration-not-found";
        throw error;
      }

      if (isLogin) {
        // ============================================
        // ログイン処理
        // ============================================
        // Firebase Authenticationでログイン
        await signInWithEmailAndPassword(auth, email, password);

        // ログイン成功：認証状態の更新を待つ（useEffectでリダイレクトされる）
        // ここでは明示的なリダイレクトは不要（useEffectで処理される）
      } else {
        // ============================================
        // 新規登録処理
        // ============================================
        if (!db) {
          const error = new Error("Firestoreが初期化されていません。");
          error.code = "firestore/not-initialized";
          throw error;
        }

        // バリデーション：劇団名が入力されているか確認
        if (!troupeName.trim()) {
          throw new Error("劇団名を入力してください。");
        }

        // Firebase Authenticationで新規ユーザーを作成
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Firestoreに劇団情報を保存
        // ドキュメントIDをuidに設定: troupes/{uid}
        const troupeData = {
          uid: user.uid,                    // Firebase AuthenticationのユーザーID
          email: user.email,                // メールアドレス
          troupeName: troupeName.trim(),    // 劇団名
          createdAt: serverTimestamp(),     // 作成日時
          lastActivityAt: serverTimestamp(), // 最終活動日時（アカウント失効判定用）
        };

        // "troupes"コレクションに、ドキュメントID = uid として保存
        const troupeDocRef = doc(db, "troupes", user.uid);
        await setDoc(troupeDocRef, troupeData);
        
        console.log("劇団データを保存しました。ドキュメントID:", user.uid);
        console.log("保存した劇団名:", troupeName.trim());
        console.log("保存したデータ:", troupeData);

        // 認証状態の更新を待つ（useEffectでリダイレクトされる）
        // ここでは明示的なリダイレクトは不要（useEffectで処理される）
      }
    } catch (error) {
      // エラー処理
      console.error("認証エラー:", error);

      // Firebaseのエラーメッセージを日本語に変換
      let errorMessage = "認証に失敗しました。";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "このメールアドレスは既に使用されています。";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "メールアドレスの形式が正しくありません。";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "パスワードは6文字以上にしてください。";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "このメールアドレスは登録されていません。";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "パスワードが正しくありません。";
      } else if (error.code === "auth/configuration-not-found" || error.message?.includes("Authentication")) {
        errorMessage = "Firebase Authenticationの設定が不完全です。Firebase ConsoleでAuthenticationを有効化してください。";
      } else if (error.code === "firestore/not-initialized") {
        errorMessage = "Firestoreが初期化されていません。Firebase ConsoleでFirestoreを有効化してください。";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "リクエストが多すぎます。しばらく時間をおいてから再度お試しください。";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "この認証方法は有効化されていません。Firebase Consoleで設定を確認してください。";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "このアカウントは無効化されています。";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "メールアドレスまたはパスワードが正しくありません。";
      } else if (error.message) {
        // その他のエラーは、エラーメッセージをそのまま表示
        errorMessage = `エラーが発生しました: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="troupe-login-page">
      <h1>{isLogin ? "劇団ログイン" : "劇団新規登録"}</h1>

      {/* エラーメッセージ表示 */}
      {error && (
        <div className="error-message" style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ef5350"
        }}>
          {error}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        {/* メールアドレス入力 */}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        {/* パスワード入力 */}
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />

        {/* 劇団名入力（新規登録時のみ表示） */}
        {!isLogin && (
          <input
            type="text"
            placeholder="劇団名"
            value={troupeName}
            onChange={(e) => setTroupeName(e.target.value)}
            required={!isLogin}
            disabled={loading}
          />
        )}

        {/* 送信ボタン */}
        <button type="submit" disabled={loading}>
          {loading
            ? "処理中..."
            : isLogin
            ? "ログイン"
            : "新規登録"}
        </button>
      </form>

      {/* ログイン/新規登録の切り替えリンク */}
      <p
        className="toggle-link"
        onClick={() => {
          if (!loading) {
            setIsLogin(!isLogin);
            setError(""); // モード切り替え時にエラーをクリア
          }
        }}
        style={{ cursor: loading ? "not-allowed" : "pointer" }}
      >
        {isLogin ? "新規登録はこちら" : "ログインはこちら"}
      </p>
    </div>
  );
}

export default TroupeLoginPage;

