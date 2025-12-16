/**
 * ============================================
 * CancelReservationPage.jsx - 予約キャンセルページ
 * ============================================
 * 
 * 観客が予約をキャンセルするためのページです。
 * 
 * 主な機能：
 * 1. URLパラメータからcancelTokenを取得
 * 2. cancelTokenでFirestoreから予約を検索
 * 3. 予約情報を表示
 * 4. キャンセルボタンで予約をキャンセル（status: "cancelled"）
 * 5. 既にキャンセル済みの場合は「キャンセル済み」と表示
 */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./CancelReservationPage.css";

export default function CancelReservationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [reservation, setReservation] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  /**
   * cancelTokenで予約を取得
   * 
   * なぜこの処理が必要か：
   * - URLパラメータのtokenを使って、該当する予約を検索するため
   * - 予約が見つかったら、公演情報も取得して表示するため
   */
  useEffect(() => {
    const loadReservation = async () => {
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("キャンセルトークンが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // cancelTokenで予約を検索
        const reservationsRef = collection(db, "reservations");
        const q = query(
          reservationsRef,
          where("cancelToken", "==", token)
        );
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("予約が見つかりませんでした。トークンが無効か、既に削除された可能性があります。");
          setLoading(false);
          return;
        }

        // 予約データを取得（通常は1件のはず）
        const reservationDoc = querySnapshot.docs[0];
        const reservationData = {
          id: reservationDoc.id,
          ...reservationDoc.data(),
        };

        // 既にキャンセル済みかチェック
        if (reservationData.status === "cancelled") {
          setReservation(reservationData);
          setCancelled(true);
          setLoading(false);
          return;
        }

        setReservation(reservationData);

        // 公演情報を取得（表示用）
        if (reservationData.performanceId) {
          try {
            const performanceDocRef = doc(db, "performances", reservationData.performanceId);
            const performanceDocSnap = await getDoc(performanceDocRef);
            
            if (performanceDocSnap.exists()) {
              setPerformance(performanceDocSnap.data());
            }
          } catch (perfError) {
            console.warn("公演情報の取得に失敗しました:", perfError);
            // 公演情報が取得できなくても予約は表示する
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("予約データの取得エラー:", error);
        setError(`予約データの取得に失敗しました: ${error.message}`);
        setLoading(false);
      }
    };

    loadReservation();
  }, [token]);

  /**
   * キャンセル処理
   * 
   * なぜこの処理が必要か：
   * - ユーザーが「キャンセルする」ボタンを押したときに、予約をキャンセル状態にするため
   * - statusを"cancelled"に更新し、cancelledAtを記録するため
   */
  const handleCancel = async () => {
    if (!reservation || !db) {
      return;
    }

    // 既にキャンセル済みの場合は処理しない
    if (reservation.status === "cancelled") {
      return;
    }

    setCancelling(true);
    setError("");

    try {
      const reservationRef = doc(db, "reservations", reservation.id);
      await updateDoc(reservationRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });

      setCancelled(true);
      console.log("予約をキャンセルしました。予約ID:", reservation.id);
    } catch (error) {
      console.error("キャンセル処理エラー:", error);
      setError(`キャンセル処理に失敗しました: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="cancel-reservation-page">
        <h1 className="cancel-title">予約キャンセル</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error && !reservation) {
    return (
      <div className="cancel-reservation-page">
        <h1 className="cancel-title">予約キャンセル</h1>
        <div style={{
          padding: "20px",
          backgroundColor: "#ffebee",
          color: "#c62828",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          {error}
        </div>
        <Link to="/" className="cancel-home-btn">
          トップページに戻る
        </Link>
      </div>
    );
  }

  // 予約情報の表示
  if (!reservation) {
    return (
      <div className="cancel-reservation-page">
        <h1 className="cancel-title">予約キャンセル</h1>
        <p>予約情報が見つかりませんでした。</p>
        <Link to="/" className="cancel-home-btn">
          トップページに戻る
        </Link>
      </div>
    );
  }

  // ステージ情報を取得
  const stageInfo = performance?.stages && reservation.stageId !== undefined
    ? performance.stages[reservation.stageId]
    : null;

  return (
    <div className="cancel-reservation-page">
      <h1 className="cancel-title">予約キャンセル</h1>

      {/* エラーメッセージ表示 */}
      {error && (
        <div style={{
          padding: "12px",
          backgroundColor: "#ffebee",
          color: "#c62828",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ef5350"
        }}>
          {error}
        </div>
      )}

      {/* キャンセル済みの場合 */}
      {cancelled && (
        <div style={{
          padding: "20px",
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #4caf50",
          textAlign: "center"
        }}>
          <h2 style={{ marginTop: 0 }}>キャンセル済み</h2>
          <p style={{ margin: 0 }}>
            この予約は既にキャンセルされています。
          </p>
        </div>
      )}

      {/* 予約情報の表示 */}
      <div className="cancel-reservation-box">
        <h2 style={{ marginTop: 0 }}>予約内容</h2>
        
        <p><strong>公演名：</strong>{reservation.performanceTitle || performance?.title || "タイトル未設定"}</p>
        
        {stageInfo && (
          <>
            <p><strong>日時：</strong>{stageInfo.date || reservation.stageDate || ""} {stageInfo.start || reservation.stageStart || ""}</p>
            {stageInfo.end && <p><strong>終了時間：</strong>{stageInfo.end || reservation.stageEnd || ""}</p>}
          </>
        )}
        
        {reservation.venue && <p><strong>会場：</strong>{reservation.venue}</p>}
        <p><strong>予約者名：</strong>{reservation.name || "-"}</p>
        <p><strong>メールアドレス：</strong>{reservation.email || "-"}</p>
        <p><strong>人数：</strong>{reservation.people || 0}名</p>
        {reservation.note && <p><strong>備考：</strong>{reservation.note}</p>}
      </div>

      {/* キャンセルボタン（キャンセル済みでない場合のみ表示） */}
      {!cancelled && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 600,
              backgroundColor: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: cancelling ? "not-allowed" : "pointer",
              opacity: cancelling ? 0.6 : 1
            }}
          >
            {cancelling ? "キャンセル処理中..." : "キャンセルする"}
          </button>
        </div>
      )}

      {/* キャンセル完了メッセージ */}
      {cancelled && (
        <div style={{
          marginTop: "24px",
          padding: "20px",
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          borderRadius: "8px",
          textAlign: "center",
          border: "1px solid #4caf50"
        }}>
          <p style={{ margin: 0, fontSize: "1.1em", fontWeight: 500 }}>
            キャンセルを受け付けました。ご連絡ありがとうございました。
          </p>
        </div>
      )}

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link to="/" className="cancel-home-btn">
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}

