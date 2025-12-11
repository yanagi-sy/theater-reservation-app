/**
 * ============================================
 * StageDetailPage.jsx - 公演詳細ページ
 * ============================================
 * 
 * 公演の詳細情報を表示するページです。
 * 
 * 主な機能：
 * 1. 公演の基本情報表示（タイトル、劇団、日時、会場、料金）
 * 2. あらすじ、キャスト、スタッフ情報の表示
 * 3. 予約ボタンの表示（公演が終了している場合は非表示）
 * 4. 公演終了判定と終了メッセージの表示
 */

import { useParams, Link } from "react-router-dom";
import { mockEvents } from "../../mock/MockEvents";
import "./StageDetailPage.css";

/**
 * StageDetailPageコンポーネント
 * 
 * @returns {JSX.Element} 公演詳細ページのUI
 */
export default function StageDetailPage() {
  // URLパラメータから公演IDを取得
  // 例：/stage/1 → stageId = "1"
  const { stageId } = useParams();

  // モックデータから該当する公演情報を検索
  const event = mockEvents.find((ev) => ev.id === Number(stageId));

  // 公演が見つからない場合のエラー表示
  if (!event) {
    return (
      <div className="detail-error">
        <h2>公演が見つかりませんでした</h2>
        <Link to="/stage-list" className="back-link">
          ← 公演一覧に戻る
        </Link>
      </div>
    );
  }

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

        {/* 予約ボタン（上部）- 公演が終了している場合は非表示 */}
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

      {/* 予約ボタン（下部にも配置）- 公演が終了している場合は非表示 */}
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
