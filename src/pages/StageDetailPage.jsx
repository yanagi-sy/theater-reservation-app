import { useParams, Link } from "react-router-dom";

export default function StageDetailPage() {
  const { id } = useParams(); // ← URL の :id を取得（例 /stages/1）

  // 仮の公演データ（本来は Firestore から取得）
  const sampleStage = {
    id: id,
    title: "サンプル公演A",
    troupe: "劇団ねこ",
    venue: "新宿シアターモグラ",
    address: "東京都新宿区○○",
    schedules: [
      { id: "s1", datetime: "2025-02-10 19:00" },
      { id: "s2", datetime: "2025-02-11 14:00" },
    ],
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{sampleStage.title}</h1>
      <p>劇団：{sampleStage.troupe}</p>
      <p>会場：{sampleStage.venue}</p>
      <p>住所：{sampleStage.address}</p>

      <h2 style={{ marginTop: 30 }}>ステージ一覧</h2>
      {sampleStage.schedules.map((s) => (
        <div key={s.id} style={{ marginBottom: 15 }}>
          <p>🕒 {s.datetime}</p>
          <Link to={`/reserve/${s.id}`}>
            <button>予約する</button>
          </Link>
        </div>
      ))}
    </div>
  );
}
