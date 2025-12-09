import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 3fr 3fr 1fr",
        minHeight: "100vh",
        backgroundColor: "#4a0e0e",
      }}
    >
      {/* 左の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>

      {/* 中央（アイボリー）3列 */}
      <div
        style={{
          gridColumn: "2 / 5",
          backgroundColor: "#f7f2e8",
          padding: "40px",
        }}
      >
        <Outlet /> {/* ← ここに各ページが入る！ */}
      </div>

      {/* 右の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>
    </div>
  );
}

  