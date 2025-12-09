import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div style={{ padding: 20,backgroundColor: "red" }}>
      <h1>演劇公演予約アプリ</h1>

      <div style={{ marginTop: 40 }}>
        <h2>あなたはどちらですか？</h2>

        <div style={{ marginTop: 20 }}>
          <Link to="/calendar">
            <button>演劇を観る</button>
          </Link>
        </div>

        <div style={{ marginTop: 20 }}>
          {/* 劇団側の導線。中身は Day2 以降で実装 */}
          <Link to="/login">
            <button>演劇を作る（劇団の方）</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
