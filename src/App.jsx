// ==============================
// App.jsx（全ルート定義）
// ==============================
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import StageListPage from "./pages/StageListPage";       // ← 追加
import StageDetailPage from "./pages/StageDetailPage";   // ← 追加
import ReservePage from "./pages/ReservePage";           // ← 追加

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* すべて Layout 内で表示 */}
        <Route path="/" element={<Layout />}>
          
          {/* ホーム */}
          <Route index element={<HomePage />} />

          {/* カレンダー */}
          <Route path="calendar" element={<CalendarPage />} />

          {/* ステージ一覧（カレンダーから来るページ） */}
          {/* 例： /stage-list?date=2025-12-03 */}
          <Route path="stage-list" element={<StageListPage />} />

          {/* ステージ詳細 */}
          {/* 例： /stage/abc123 */}
          <Route path="stage/:stageId" element={<StageDetailPage />} />

          {/* 予約ページ */}
          {/* 例： /reserve/abc123 */}
          <Route path="reserve/:stageId" element={<ReservePage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
