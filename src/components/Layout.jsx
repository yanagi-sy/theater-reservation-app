/**
 * ============================================
 * Layout.jsx - 観客側ページの共通レイアウト
 * ============================================
 * 
 * 観客側の全ページで使用される共通レイアウトコンポーネントです。
 * 
 * 主な役割：
 * 1. 左右に赤い帯を配置したデザインを提供
 * 2. 中央にページコンテンツを表示
 * 3. Outletで子ルートのコンポーネントを表示
 */

import { Outlet } from "react-router-dom";

/**
 * Layoutコンポーネント
 * 
 * @returns {JSX.Element} 観客側ページの共通レイアウト
 * 
 * レイアウト構造：
 * - 左側：赤い帯（装飾用）
 * - 中央：メインコンテンツエリア（アイボリー色）
 * - 右側：赤い帯（装飾用）
 * 
 * Outletコンポーネント：
 * - React Routerの機能で、子ルートのコンポーネントを表示する場所
 * - App.jsxで定義された子ルート（HomePage、CalendarPageなど）がここに表示されます
 */
export default function Layout() {
  return (
    <div
      style={{
        display: "grid",
        // グリッドレイアウト：左1列、中央3列、右1列の5列構成
        gridTemplateColumns: "1fr 3fr 3fr 3fr 1fr",
        minHeight: "100vh", // 画面の高さいっぱいに表示
      }}
    >
      {/* 左側の赤い帯（装飾用） */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>

      {/* 中央エリア（メインコンテンツ表示エリア） */}
      <div
        style={{
          gridColumn: "2 / span 3", // 2列目から3列分を使用
          backgroundColor: "#f3e9d7", // アイボリー色の背景
          padding: "20px",
        }}
      >
        {/* 
          Outletコンポーネント
          ここに子ルート（App.jsxで定義された各ページ）が表示されます
          例：HomePage、CalendarPage、StageDetailPageなど
        */}
        <Outlet />
      </div>

      {/* 右側の赤い帯（装飾用） */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>
    </div>
  );
}
