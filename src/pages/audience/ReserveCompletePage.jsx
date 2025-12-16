// ============================================
// ReserveCompletePage.jsx（予約完了ページ）
// ============================================

import { useLocation, Link } from "react-router-dom";
import { mockEvents } from "../../mock/MockEvents";
import "./ReserveCompletePage.css";

export default function ReserveCompletePage() {
  const location = useLocation();
  const reservationData = location.state?.reservationData;

  // 予約データがない場合はトップページにリダイレクト
  if (!reservationData) {
    return (
      <div className="reserve-complete-page">
        <h1 className="complete-title">予約情報が見つかりません</h1>
        <Link to="/" className="complete-home-btn">
          トップページに戻る
        </Link>
      </div>
    );
  }

  const { stageId, name, email, people, note } = reservationData;
  const event = mockEvents.find((ev) => ev.id === Number(stageId));

  return (
    <div className="reserve-complete-page">
      <div className="check-icon">✓</div>
      <h1 className="complete-title">予約が完了しました！</h1>
      <p className="complete-message">
        ご予約ありがとうございます。予約内容を確認してください。
      </p>
      
      {/* メール送信についての案内 */}
      <div style={{
        marginTop: "20px",
        marginBottom: "20px",
        padding: "16px",
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        border: "1px solid #90caf9"
      }}>
        <p style={{ margin: 0, lineHeight: "1.6", color: "#1565c0" }}>
          入力したメールアドレス宛に予約内容をお送りします。<br />
          キャンセルをご希望の場合は、メール内のキャンセルリンクからお手続きください。
        </p>
      </div>

      {event && (
        <div className="complete-summary-box">
          <p><strong>公演名：</strong>{event.title}</p>
          <p><strong>劇団：</strong>{event.troupe}</p>
          <p><strong>日時：</strong>{event.date} {event.time}</p>
          <p><strong>会場：</strong>{event.venue}</p>
          <p><strong>料金：</strong>{event.price === 0 ? "無料" : `${event.price} 円`}</p>
          <p><strong>予約者名：</strong>{name}</p>
          <p><strong>メールアドレス：</strong>{email}</p>
          <p><strong>人数：</strong>{people}名</p>
          {note && <p><strong>備考：</strong>{note}</p>}
        </div>
      )}

      <Link to="/" className="complete-home-btn">
        トップページに戻る
      </Link>
      <Link to="/calendar" className="complete-calendar-btn">
        カレンダーを見る
      </Link>
    </div>
  );
}
