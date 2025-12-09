import { Link } from "react-router-dom";
import "./HomePage.css"; // ← CSS を読み込みます

export default function HomePage() {
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1
        style={{
          fontSize: "36px",
          marginBottom: "50px",
          color: "#4b1818",
          fontWeight: "600",
        }}
      >
        演劇公演予約アプリ
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "60px",
        }}
      >
        <Link to="/calendar">
          <button className="theater-button">演劇を観る</button>
        </Link>

        <Link to="/login">
          <button className="theater-button">演劇を作る（劇団の方）</button>
        </Link>
      </div>
    </div>
  );
}
