// ============================================
// ReservePage.jsx（予約フォーム）
// ============================================

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { mockEvents } from "../../mock/MockEvents";
import "./ReservePage.css";

export default function ReservePage() {
  const { stageId } = useParams();
  const navigate = useNavigate();

  const event = mockEvents.find((ev) => ev.id === Number(stageId));

  // 入力値
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [people, setPeople] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Firebaseに予約データを保存
      const reservationData = {
        stageId: stageId,
        eventTitle: event?.title || "",
        troupe: event?.troupe || "",
        date: event?.date || "",
        time: event?.time || "",
        venue: event?.venue || "",
        price: event?.price || 0,
        name: name,
        email: email,
        people: Number(people),
        note: note || "",
        createdAt: serverTimestamp(),
      };

      // Firestoreのreservationsコレクションに追加
      await addDoc(collection(db, "reservations"), reservationData);

      // 予約完了ページへ遷移
      navigate("/reserve-complete", {
        state: {
          reservationData: {
            stageId,
            name,
            email,
            people,
            note,
          },
        },
      });
    } catch (error) {
      console.error("予約の保存に失敗しました:", error);
      alert("予約の保存に失敗しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reserve-page">
      <h1 className="reserve-title">予約フォーム</h1>

      {event && (
        <div className="reserve-event-card">
          <h2 className="reserve-event-title">{event.title}</h2>
          <p className="reserve-event-text">劇団：{event.troupe}</p>
          <p className="reserve-event-text">
            日時：{event.date} {event.time}
          </p>
          <p className="reserve-event-text">会場：{event.venue}</p>
          <p className="reserve-event-text">
            料金：{event.price === 0 ? "無料" : `${event.price} 円`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="reserve-form">
        <div className="reserve-field">
          <label className="reserve-label">氏名</label>
          <input
            className="reserve-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="reserve-field">
          <label className="reserve-label">メールアドレス</label>
          <input
            className="reserve-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="reserve-field">
          <label className="reserve-label">人数</label>
          <input
            className="reserve-input"
            type="number"
            min="1"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            required
          />
        </div>

        <div className="reserve-field">
          <label className="reserve-label">備考（任意）</label>
          <textarea
            className="reserve-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className="reserve-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "予約処理中..." : "この公演を予約する"}
        </button>
      </form>
    </div>
  );
}
