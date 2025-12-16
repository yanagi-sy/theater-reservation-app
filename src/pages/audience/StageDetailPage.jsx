/**
 * ============================================
 * StageDetailPage.jsx - 公演詳細ページ
 * ============================================
 * 
 * 公演の詳細情報を表示するページです。
 * 
 * 主な機能：
 * 1. Firestoreから公演データを取得
 * 2. 公演の基本情報表示（タイトル、劇団、日時、会場、料金）
 * 3. あらすじ、キャスト、スタッフ情報の表示
 * 4. 予約ボタンの表示（公演が終了している場合は非表示）
 * 5. 公演終了判定と終了メッセージの表示
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { 
  getTotalReservedPeople, 
  getTotalSeatLimit, 
  getReservationStatus 
} from "../troupe/TroupePerformancesPage";
import "./StageDetailPage.css";

/**
 * StageDetailPageコンポーネント
 * 
 * @returns {JSX.Element} 公演詳細ページのUI
 */
export default function StageDetailPage() {
  // URLパラメータから公演ID（ドキュメントID）を取得
  // 例：/stage/abc123 → stageId = "abc123"
  const { stageId } = useParams();

  // 状態管理
  const [performance, setPerformance] = useState(null);  // 公演データ
  const [troupeInfo, setTroupeInfo] = useState(null);   // 劇団情報
  const [loading, setLoading] = useState(true);         // 読み込み中
  const [error, setError] = useState("");               // エラーメッセージ
  const [reservationStatus, setReservationStatus] = useState(null); // 予約状況（"available" | "few" | "full"）

  // Firestoreから公演データと劇団情報を取得
  useEffect(() => {
    const loadPerformance = async () => {
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      if (!stageId) {
        setError("公演IDが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Firestoreから公演データを取得
        const performanceDocRef = doc(db, "performances", stageId);
        const performanceDocSnap = await getDoc(performanceDocRef);

        if (!performanceDocSnap.exists()) {
          setError("公演が見つかりませんでした。");
          setLoading(false);
          return;
        }

        const performanceData = {
          id: performanceDocSnap.id,
          ...performanceDocSnap.data(),
        };

        // 劇団情報を取得
        if (performanceData.troupeId) {
          try {
            const troupeDocRef = doc(db, "troupes", performanceData.troupeId);
            const troupeDocSnap = await getDoc(troupeDocRef);
            
            if (troupeDocSnap.exists()) {
              setTroupeInfo(troupeDocSnap.data());
            } else {
              setTroupeInfo({ troupeName: "劇団名未設定", iconUrl: "", contactInfo: "" });
            }
          } catch (troupeError) {
            console.warn("劇団情報の取得に失敗しました:", troupeError);
            setTroupeInfo({ troupeName: "劇団名未設定", iconUrl: "", contactInfo: "" });
          }
        }

        setPerformance(performanceData);

        // ============================================
        // 予約状況の取得と判定
        // ============================================
        // Firestoreから予約データを取得して予約状況を判定
        try {
          // 1. 予約データを取得（performanceIdでフィルタ）
          const reservationsQuery = query(
            collection(db, "reservations"),
            where("performanceId", "==", performanceData.id)
          );
          const reservationsSnapshot = await getDocs(reservationsQuery);

          // 予約データを配列形式に変換
          const reservations = [];
          reservationsSnapshot.forEach((doc) => {
            reservations.push(doc.data());
          });

          // 2. 予約人数と席数上限を集計
          const totalReservedPeople = getTotalReservedPeople(reservations);
          const totalSeatLimit = getTotalSeatLimit(performanceData.stages || []);

          // 3. 予約状況を判定
          const status = getReservationStatus(totalReservedPeople, totalSeatLimit);
          setReservationStatus(status);

          // 4. Firestore連携確認のためのconsole.log
          console.log("=== 予約状況データ ===");
          console.log("reservations:", reservations);
          console.log("stages:", performanceData.stages);
          console.log("totalReservedPeople:", totalReservedPeople);
          console.log("totalSeatLimit:", totalSeatLimit);
          console.log("reservationStatus:", status);
          console.log("====================");
        } catch (reservationError) {
          console.warn("予約データの取得に失敗しました:", reservationError);
          // エラーが発生しても公演データは表示するため、予約状況はnullのまま
        }

        console.log("公演データを読み込みました:", performanceData);
      } catch (error) {
        console.error("公演データ読み込みエラー:", error);
        setError(`公演データの読み込みに失敗しました: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [stageId]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="detail-container">
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error || !performance) {
    return (
      <div className="detail-error">
        <h2>{error || "公演が見つかりませんでした"}</h2>
        <Link to="/stage-list" className="back-link">
          ← 公演一覧に戻る
        </Link>
      </div>
    );
  }

  // 表示用データに変換
  const firstStage = performance.stages && performance.stages.length > 0 
    ? performance.stages[0] 
    : null;
  
  const lastStage = performance.stages && performance.stages.length > 0
    ? performance.stages[performance.stages.length - 1]
    : null;

  const event = {
    id: performance.id,
    title: performance.title || "タイトル未設定",
    troupe: troupeInfo?.troupeName || "劇団名未設定",
    iconImage: troupeInfo?.iconUrl || "",
    mainImage: performance.mainImage || "",
    date: firstStage?.date || "",
    time: firstStage?.start || "",
    endDate: lastStage?.date && lastStage.date !== firstStage?.date ? lastStage.date : null,
    venue: performance.venue || "",
    prefecture: performance.prefecture || "",
    region: performance.region || "",
    price: performance.price || 0,
    overview: performance.overview || "",
    cast: performance.cast || [],
    staff: performance.staff || [],
  };

  /**
   * 公演が終了しているかどうかを判定
   * 
   * 判定ロジック：
   * - 公演の最終日（endDate）が設定されている場合：最終日と現在日を比較
   * - endDateが設定されていない場合：公演日（date）を最終日として扱う
   * 
   * @returns {boolean} 公演が終了している場合true
   */
  const isEventEnded = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻を00:00:00にリセット

    // 公演の最終日を取得（endDateがあればそれを使用、なければdateを使用）
    const endDateString = event.endDate || event.date;
    const endDate = new Date(endDateString);
    endDate.setHours(0, 0, 0, 0);

    // 最終日が今日より前の場合、公演は終了している
    return endDate < today;
  };

  const eventEnded = isEventEnded();

  return (
    <div className="detail-container">
      {/* 公演終了メッセージ（公演が終了している場合のみ表示） */}
      {eventEnded && (
        <div className="event-ended-notice" style={{
          backgroundColor: "#ffebee",
          border: "2px solid #f44336",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#d32f2f", margin: "0 0 10px 0" }}>
            ⚠️ この公演は終了しました
          </h2>
          <p style={{ color: "#666", margin: 0 }}>
            公演の最終日が過ぎているため、予約はできません。
          </p>
        </div>
      )}

      {/* 公演ヘッダー画像（メインビジュアル） */}
      <div className="detail-header">
        <img src={event.mainImage} alt={event.title} className="detail-main-image" />
      </div>

      {/* タイトル・劇団名・日時・会場（映画チケット風） */}
      <div className="detail-basic-info">
        <div className="detail-troupe-box">
          <Link to={`/troupe-home/${encodeURIComponent(event.troupe)}`} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={event.iconImage} alt={event.troupe} className="detail-troupe-icon" />
            <span className="detail-troupe-name">{event.troupe}</span>
          </Link>
        </div>

        <h1 className="detail-title">{event.title}</h1>

        <p className="detail-subinfo">
          📅 {event.date}（{event.time}）
          {/* 最終日が設定されている場合は表示 */}
          {event.endDate && event.endDate !== event.date && (
            <span> 〜 {event.endDate}</span>
          )}
        </p>
        <p className="detail-subinfo">📍 {event.venue}</p>

        {/* チケット情報 */}
        <p className="detail-price">
          🎫 {event.price === 0 ? "無料" : `有料：${event.price}円`}
        </p>

        {/* 予約状況表示（観客側UI専用） */}
        {reservationStatus && (
          <div className="reservation-status" style={{
            marginTop: "12px",
            marginBottom: "12px",
            fontSize: "1em",
            fontWeight: 500
          }}>
            {reservationStatus === "available" && "予約受付中"}
            {reservationStatus === "few" && "残りわずか"}
            {reservationStatus === "full" && "満席"}
          </div>
        )}

        {/* 予約ボタン（上部）- 公演が終了している場合は非表示 */}
        {/* event.idは公演ID（performanceId）で、予約ページのURLパラメータとして渡されます */}
        {!eventEnded && (
          <Link to={`/reserve/${event.id}`} className="detail-reserve-btn top-btn">
            この公演を予約する
          </Link>
        )}
      </div>

      {/* ▼ あらすじ */}
      <div className="detail-section">
        <h2 className="section-title">あらすじ</h2>
        <p className="section-text">{event.overview}</p>
      </div>

      {/* ▼ キャスト一覧 */}
      <div className="detail-section">
        <h2 className="section-title">キャスト</h2>
        <ul className="cast-list">
          {event.cast.map((c, i) => (
            <li key={i} className="cast-item">
              <span className="cast-name">{c.name}</span>
              <span className="cast-role">（{c.role}）</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ▼ スタッフ一覧 */}
      <div className="detail-section">
        <h2 className="section-title">スタッフ</h2>
        <ul className="staff-list">
          {event.staff.map((s, i) => (
            <li key={i} className="staff-item">
              <span className="staff-role">{s.role}：</span>
              <span className="staff-name">{s.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ▼ 問い合わせ先 */}
      {troupeInfo?.contactInfo && (
        <div className="detail-section">
          <h2 className="section-title">問い合わせ先</h2>
          <p className="section-text">{troupeInfo.contactInfo}</p>
        </div>
      )}

      {/* 予約状況表示（下部）- 観客側UI専用 */}
      {reservationStatus && (
        <div className="reservation-status-bottom" style={{
          textAlign: "center",
          marginTop: "20px",
          marginBottom: "20px",
          fontSize: "1em",
          fontWeight: 500
        }}>
          {reservationStatus === "available" && "予約受付中"}
          {reservationStatus === "few" && "残りわずか"}
          {reservationStatus === "full" && "満席"}
        </div>
      )}

      {/* 予約ボタン（下部にも配置）- 公演が終了している場合は非表示 */}
      {/* event.idは公演ID（performanceId）で、予約ページのURLパラメータとして渡されます */}
      {!eventEnded && (
        <div className="detail-bottom-reserve">
          <Link to={`/reserve/${event.id}`} className="detail-reserve-btn">
            この公演を予約する
          </Link>
        </div>
      )}

      {/* ▼ 公演一覧へ戻る */}
      <div className="detail-back">
        <Link to="/stage-list" className="back-link">
          ← 公演一覧に戻る
        </Link>
      </div>
    </div>
  );
}
