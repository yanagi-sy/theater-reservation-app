// ============================================
// StageDetailPage.jsx（映画チケット風 完全版）
// 公演詳細ページ：画像 / 概要 / キャスト / スタッフ / 予約導線
// ============================================

import { useParams, Link } from "react-router-dom";
import { mockEvents } from "../../mock/MockEvents";
import "./StageDetailPage.css"; // ← この後作成します

export default function StageDetailPage() {
  // URL の :stageId を取得
  const { stageId } = useParams();

  // id に一致する公演情報を取得
  const event = mockEvents.find((ev) => ev.id === Number(stageId));

  // 万が一該当なし
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

  return (
    <div className="detail-container">
      
      {/* ▼ 公演ヘッダー画像（メインビジュアル） */}
      <div className="detail-header">
        <img src={event.mainImage} alt={event.title} className="detail-main-image" />
      </div>

      {/* ▼ タイトル・劇団名・日時・会場（映画チケット風） */}
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
        </p>
        <p className="detail-subinfo">📍 {event.venue}</p>

        {/* ▼ チケット情報 */}
        <p className="detail-price">
          🎫 {event.price === 0 ? "無料" : `有料：${event.price}円`}
        </p>

        {/* ▼ 予約ボタン（上部） */}
        <Link to={`/reserve/${event.id}`} className="detail-reserve-btn top-btn">
          この公演を予約する
        </Link>
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

      {/* ▼ 予約ボタン（下部にも配置） */}
      <div className="detail-bottom-reserve">
        <Link to={`/reserve/${event.id}`} className="detail-reserve-btn">
          この公演を予約する
        </Link>
      </div>

      {/* ▼ 公演一覧へ戻る */}
      <div className="detail-back">
        <Link to="/stage-list" className="back-link">
          ← 公演一覧に戻る
        </Link>
      </div>
    </div>
  );
}
