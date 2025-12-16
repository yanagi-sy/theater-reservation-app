/**
 * ============================================
 * TroupeAccountDeletePage.jsx - アカウント削除ページ
 * ============================================
 * 
 * 劇団が自分のアカウントを削除するためのページです。
 * 
 * 主な機能：
 * 1. アカウント削除の確認
 * 2. Firebase Authenticationのアカウント削除
 * 3. Firestoreの劇団データ削除
 * 4. 関連する予約データの処理
 * 5. 削除後のログアウト・トップページへのリダイレクト
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, db } from "../../firebase";
import { deleteUser } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./TroupeAccountDeletePage.css";

/**
 * TroupeAccountDeletePageコンポーネント
 * 
 * @returns {JSX.Element} アカウント削除ページのUI
 */
function TroupeAccountDeletePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // UI状態管理
  const [isDeleting, setIsDeleting] = useState(false); // 削除処理中かどうか
  const [error, setError] = useState(""); // エラーメッセージ

  /**
   * アカウント削除処理
   */
  const handleDeleteAccount = async () => {
    // ポップアップで最終確認（はい/いいえ）
    const confirmMessage = "本当にアカウントを削除しますか？";
    
    if (!window.confirm(confirmMessage)) {
      return; // ユーザーが「いいえ」を選択した場合、処理を中断
    }

    if (!user || !auth || !db) {
      setError("認証情報が取得できませんでした。");
      return;
    }

    setIsDeleting(true);
    setError("");

    // 変数をtryブロックの外で宣言（catchブロックでも使用するため）
    let troupeDocId = null;
    let troupeName = "";

    try {
      // 1. Firestoreから劇団データを取得（削除前に取得）
      const troupeQuery = query(
        collection(db, "troupes"),
        where("uid", "==", user.uid)
      );
      const troupeSnapshot = await getDocs(troupeQuery);

      if (!troupeSnapshot.empty) {
        const troupeDoc = troupeSnapshot.docs[0];
        troupeDocId = troupeDoc.id;
        troupeName = troupeDoc.data().troupeName || "";
      }

      // 2. 関連する予約データを取得（劇団名で検索）
      // 注意：予約データにtroupeUidが含まれていない場合、劇団名で検索します
      let reservationsSnapshot = null;
      if (troupeName) {
        try {
          const reservationsQuery = query(
            collection(db, "reservations"),
            where("troupe", "==", troupeName)
          );
          reservationsSnapshot = await getDocs(reservationsQuery);
        } catch (reservationError) {
          console.warn("予約データの取得に失敗しました（無視して続行）:", reservationError);
        }
      }

      // 3. まずFirebase Authenticationのアカウントを削除
      // 重要：Firestoreのデータを削除する前に、認証アカウントを削除することで
      // 確実にアカウントが削除され、同じメールアドレスで再登録できるようになります
      console.log("Firebase Authenticationのアカウントを削除中...");
      await deleteUser(user);
      console.log("Firebase Authenticationのアカウントを削除しました。");

      // 4. Firestoreのデータを削除（バックグラウンドで実行）
      // 注意：削除処理は非同期で実行し、完了を待たずにリダイレクトします
      const deletePromises = [];
      
      // 予約データを削除
      if (reservationsSnapshot) {
        reservationsSnapshot.forEach((reservationDoc) => {
          deletePromises.push(deleteDoc(doc(db, "reservations", reservationDoc.id)));
        });
      }

      // 劇団データを削除
      if (troupeDocId) {
        deletePromises.push(deleteDoc(doc(db, "troupes", troupeDocId)));
      }

      // Firestoreの削除処理を開始（完了を待たない）
      if (deletePromises.length > 0) {
        Promise.all(deletePromises).then(() => {
          console.log("Firestoreデータを削除しました。");
        }).catch((error) => {
          console.error("Firestoreデータの削除エラー:", error);
        });
      }

      // 5. ログアウト（念のため、エラーは無視）
      signOut().catch((signOutError) => {
        // ログアウトエラーは無視（アカウントは既に削除されているため）
        console.warn("ログアウトエラー（無視）:", signOutError);
      });

      // 6. すぐにトップページにリダイレクト（alertや待機時間なし）
      navigate("/", { replace: true });
    } catch (error) {
      console.error("アカウント削除エラー:", error);
      console.error("エラーコード:", error.code);
      console.error("エラーメッセージ:", error.message);

      let errorMessage = "アカウントの削除に失敗しました。";

      if (error.code === "auth/requires-recent-login") {
        errorMessage = "セキュリティのため、再度ログインしてから削除してください。";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "ユーザーが見つかりませんでした。既に削除されている可能性があります。";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "リクエストが多すぎます。しばらく時間をおいてから再度お試しください。";
      } else if (error.message) {
        errorMessage = `エラーが発生しました: ${error.message} (コード: ${error.code || "不明"})`;
      }

      setError(errorMessage);
      
      // エラーが発生した場合でも、Firestoreのデータは削除を試みる
      // （認証アカウントの削除に失敗した場合でも、データは削除しておく）
      try {
        if (troupeDocId) {
          await deleteDoc(doc(db, "troupes", troupeDocId));
          console.log("Firestoreの劇団データを削除しました（エラー後の処理）。");
        }
      } catch (firestoreError) {
        console.error("Firestoreデータの削除に失敗しました:", firestoreError);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="troupe-account-delete-page">
      <h1>アカウント削除</h1>

      {/* 警告メッセージ */}
      <div className="delete-warning" style={{
        backgroundColor: "#ffebee",
        border: "2px solid #f44336",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px"
      }}>
        <h2 style={{ color: "#c62828", marginTop: 0 }}>⚠️ 警告</h2>
        <p style={{ color: "#c62828", marginBottom: "10px" }}>
          アカウントを削除すると、以下のデータがすべて削除され、復元できません：
        </p>
        <ul style={{ color: "#c62828", marginBottom: "10px" }}>
          <li>劇団プロフィール情報</li>
          <li>作成した公演情報</li>
          <li>関連する予約情報</li>
        </ul>
        <p style={{ color: "#c62828", margin: 0, fontWeight: "bold" }}>
          この操作は取り消せません。本当に削除しますか？
        </p>
      </div>

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

      {/* 削除ボタン */}
      <div className="delete-confirm-form" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.5 : 1,
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isDeleting ? "削除中..." : "アカウントを削除する"}
          </button>

          <button
            onClick={() => navigate("/troupe/dashboard")}
            disabled={isDeleting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#757575",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontSize: "16px"
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export default TroupeAccountDeletePage;

