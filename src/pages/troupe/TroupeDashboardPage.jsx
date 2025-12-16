/**
 * ============================================
 * TroupeDashboardPage.jsx - 劇団ダッシュボード
 * ============================================
 * 
 * 劇団側の管理画面のトップページです。
 * 
 * 主な機能：
 * 1. 各種管理ページへのナビゲーション
 * 2. アカウント失効に関する注意書きの表示
 * 3. Firestoreに保存されているアカウント情報の確認（デバッグ用）
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./TroupeDashboardPage.css";

/**
 * TroupeDashboardPageコンポーネント
 * 
 * @returns {JSX.Element} ダッシュボードページのUI
 */
function TroupeDashboardPage() {
  const { user } = useAuth();
  const [troupeData, setTroupeData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Firestoreから劇団データを読み込む
  useEffect(() => {
    const loadTroupeData = async () => {
      if (!user) {
        console.warn("ユーザー情報が取得できませんでした。");
        setLoadingData(false);
        return;
      }

      if (!db) {
        console.error("Firestoreが初期化されていません。Firebaseの設定を確認してください。");
        setLoadingData(false);
        return;
      }

      try {
        console.log("劇団データ読み込み開始: UID =", user.uid);
        const q = query(collection(db, "troupes"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        console.log("検索結果数:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const troupeDoc = querySnapshot.docs[0];
          const data = troupeDoc.data();
          console.log("劇団データを取得しました:", data);
          setTroupeData({
            id: troupeDoc.id,
            ...data,
          });
        } else {
          console.warn("劇団データが見つかりませんでした。UID:", user.uid);
          console.warn("新規登録が完了していない可能性があります。");
        }
      } catch (error) {
        console.error("データ読み込みエラー:", error);
        console.error("エラーコード:", error.code);
        console.error("エラーメッセージ:", error.message);
        
        // ネットワークエラーの場合の詳細情報
        if (error.code === "unavailable" || error.message?.includes("network")) {
          console.error("Firebaseへの接続に失敗しました。インターネット接続を確認してください。");
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadTroupeData();
  }, [user, db]);

  return (
    <div className="troupe-dashboard-page">
      <h1>劇団ダッシュボード</h1>

      {/* デバッグ情報セクション */}
      <div style={{
        marginBottom: "30px",
        padding: "15px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        border: "1px solid #ddd"
      }}>
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {showDebugInfo ? "デバッグ情報を非表示" : "Firestoreアカウント情報を確認"}
        </button>

        {showDebugInfo && (
          <div style={{ marginTop: "15px", fontSize: "14px" }}>
            <h3 style={{ marginTop: 0, fontSize: "16px" }}>Firestoreアカウント情報</h3>
            {loadingData ? (
              <p>読み込み中...</p>
            ) : troupeData ? (
              <div style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
                overflowX: "auto"
              }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(troupeData, null, 2)}
                </pre>
              </div>
            ) : (
              <p style={{ color: "#d32f2f" }}>
                アカウント情報が見つかりませんでした。新規登録を完了してください。
              </p>
            )}
            <div style={{ marginTop: "15px", fontSize: "12px", color: "#666" }}>
              <p><strong>認証情報:</strong></p>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                <li>UID: {user?.uid || "未取得"}</li>
                <li>Email: {user?.email || "未取得"}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 管理機能カード一覧 */}
      <div className="dashboard-card-list">
        <Link to="/troupe/profile/edit" className="dashboard-card">
          <div className="dashboard-card-title">プロフィール編集</div>
          <div className="dashboard-card-description">劇団の情報を編集します</div>
        </Link>
        <Link to="/troupe/performances" className="dashboard-card">
          <div className="dashboard-card-title">公演一覧</div>
          <div className="dashboard-card-description">作成した公演を管理します</div>
        </Link>
        <Link to="/troupe/performance/create" className="dashboard-card">
          <div className="dashboard-card-title">公演を作成</div>
          <div className="dashboard-card-description">新しい公演を登録します</div>
        </Link>
        <Link to="/troupe/profile/public/sample" className="dashboard-card">
          <div className="dashboard-card-title">公開プロフィールを見る</div>
          <div className="dashboard-card-description">公開されているプロフィールを確認します</div>
        </Link>
        <Link to="/troupe/account/delete" className="dashboard-card" style={{
          backgroundColor: "#ffebee",
          border: "2px solid #f44336"
        }}>
          <div className="dashboard-card-title" style={{ color: "#c62828" }}>アカウント削除</div>
          <div className="dashboard-card-description" style={{ color: "#c62828" }}>
            アカウントを削除します（取り消し不可）
          </div>
        </Link>
      </div>

      {/* アカウント失効に関する注意書き */}
      <div className="dashboard-notice" style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#fff3cd",
        border: "1px solid #ffc107",
        borderRadius: "8px",
        fontSize: "14px",
        lineHeight: "1.6"
      }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#856404" }}>
          ⚠️ アカウント失効について
        </p>
        <p style={{ margin: 0, color: "#856404" }}>
          ストレージの圧迫を防ぐため、2年以上活動がない劇団アカウントは強制失効となります。
          定期的に公演を作成するか、プロフィールを更新することでアカウントを維持できます。
        </p>
      </div>
    </div>
  );
}

export default TroupeDashboardPage;
