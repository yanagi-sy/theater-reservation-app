import { useParams } from "react-router-dom";
import { useState } from "react";

export default function ReservePage() {
  const { scheduleId } = useParams();

  // 入力値をローカル state で管理（Firestore はまだ使わない）
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [people, setPeople] = useState(1);
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("予約データ:", {
      scheduleId,
      name,
      email,
      people,
      note,
    });

    alert("送信テスト（まだ Firestore には保存されません）");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>予約フォーム</h1>
      <p>対象ステージID：{scheduleId}</p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div>
          <label>氏名：</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label>メール：</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label>人数：</label>
          <input
            type="number"
            value={people}
            min="1"
            onChange={(e) => setPeople(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label>備考：</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="submit" style={{ marginTop: 20 }}>
          予約する（テスト）
        </button>
      </form>
    </div>
  );
}

