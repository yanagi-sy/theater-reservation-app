/**
 * ============================================
 * TroupeReservationsPage.jsx - 予約表ページ
 * ============================================
 * 
 * 劇団が自分の公演に対する予約情報を一覧で確認するページです。
 * 
 * 主な機能：
 * 1. Firestoreから予約データを取得
 * 2. 劇団の公演に関連する予約のみを表示
 * 3. 予約情報の一覧表示（テーブル形式）
 * 4. 予約データのフィルタリング・ソート
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import "./TroupeReservationsPage.css";

/**
 * TroupeReservationsPageコンポーネント
 * 
 * @returns {JSX.Element} 予約表ページのUI
 */
function TroupeReservationsPage() {
  const { user } = useAuth();
  const [troupeName, setTroupeName] = useState(""); // 劇団名
  const [reservations, setReservations] = useState([]); // 予約データの配列
  const [loading, setLoading] = useState(true); // データ読み込み中かどうか
  const [error, setError] = useState(""); // エラーメッセージ

  /**
   * Firestoreから劇団名を取得し、予約データを読み込む
   */
  useEffect(() => {
    const loadReservations = async () => {
      if (!user || !db) {
        setLoading(false);
        return;
      }

      try {
        // 1. まず劇団データを取得して劇団名を取得
        const troupeQuery = query(
          collection(db, "troupes"),
          where("uid", "==", user.uid)
        );
        const troupeSnapshot = await getDocs(troupeQuery);

        if (troupeSnapshot.empty) {
          setError("劇団プロフィールが見つかりませんでした。");
          setLoading(false);
          return;
        }

        const troupeData = troupeSnapshot.docs[0].data();
        const name = troupeData.troupeName || "";
        setTroupeName(name);

        if (!name) {
          setError("劇団名が設定されていません。");
          setLoading(false);
          return;
        }

        // 2. 劇団名で予約データを検索
        const reservationsQuery = query(
          collection(db, "reservations"),
          where("troupe", "==", name),
          orderBy("createdAt", "desc") // 作成日時の降順でソート
        );
        const reservationsSnapshot = await getDocs(reservationsQuery);

        const reservationsData = [];
        reservationsSnapshot.forEach((doc) => {
          const data = doc.data();
          reservationsData.push({
            id: doc.id,
            ...data,
            // createdAtがTimestampオブジェクトの場合はDateに変換
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          });
        });

        setReservations(reservationsData);
        console.log(`予約データを読み込みました: ${reservationsData.length}件`);
      } catch (error) {
        console.error("予約データ読み込みエラー:", error);
        setError(`予約データの読み込みに失敗しました: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [user]);

  /**
   * 日付をフォーマットする関数
   * 
   * @param {Date|null} date - フォーマットする日付
   * @returns {string} フォーマットされた日付文字列
   */
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const d = date instanceof Date ? date : date.toDate();
      return d.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  // データ読み込み中の表示
  if (loading) {
    return (
      <div className="troupe-reservations-page">
        <h1>予約表</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="troupe-reservations-page">
      <h1>予約表</h1>

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

      {/* 予約件数表示 */}
      {!error && (
        <div style={{ marginBottom: "20px", color: "#666" }}>
          <p>
            <strong>劇団名:</strong> {troupeName || "未設定"}
          </p>
          <p>
            <strong>予約件数:</strong> {reservations.length}件
          </p>
        </div>
      )}

      {/* 予約データがない場合 */}
      {!error && reservations.length === 0 && (
        <div style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          color: "#666"
        }}>
          <p>予約データがありません。</p>
        </div>
      )}

      {/* 予約テーブル */}
      {!error && reservations.length > 0 && (
        <div className="reservations-table-container">
          <table className="reservations-table">
            <thead>
              <tr>
                <th>予約日時</th>
                <th>公演名</th>
                <th>公演日時</th>
                <th>会場</th>
                <th>予約者名</th>
                <th>メールアドレス</th>
                <th>人数</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{formatDate(reservation.createdAt)}</td>
                  <td>{reservation.eventTitle || "-"}</td>
                  <td>
                    {reservation.date && reservation.time
                      ? `${reservation.date} ${reservation.time}`
                      : "-"}
                  </td>
                  <td>{reservation.venue || "-"}</td>
                  <td>{reservation.name || "-"}</td>
                  <td>{reservation.email || "-"}</td>
                  <td>{reservation.people || 0}名</td>
                  <td>{reservation.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TroupeReservationsPage;

