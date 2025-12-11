import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 3fr 3fr 1fr", // 両サイド赤、中央3カラムアイボリー
        minHeight: "100vh",
      }}
    >
      {/* 左の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>

      {/* 中央エリア（画面のメイン部分） */}
      <div
        style={{
          gridColumn: "2 / span 3",
          backgroundColor: "#f3e9d7",
          padding: "20px",
        }}
      >
        {/* ここがページを切り替える場所！ */}
        <Outlet />
      </div>

      {/* 右の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>
    </div>
  );
}
