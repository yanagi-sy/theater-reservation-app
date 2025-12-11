// ==============================
// App.jsx（観客側 + 劇団側ルート 完全版）
// ==============================
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import TroupeLayout from "./components/TroupeLayout";

// ▼ 観客側
import HomePage from "./pages/audience/HomePage";
import CalendarPage from "./pages/audience/CalendarPage";
import StageListPage from "./pages/audience/StageListPage";
import StageDetailPage from "./pages/audience/StageDetailPage";
import ReservePage from "./pages/audience/ReservePage";
import ReserveCompletePage from "./pages/audience/ReserveCompletePage";
import TroupeHomePage from "./pages/audience/TroupeHomePage";

// ▼ 劇団側
import TroupeLoginPage from "./pages/troupe/TroupeLoginPage";
import TroupeDashboardPage from "./pages/troupe/TroupeDashboardPage";
import TroupeProfileEditPage from "./pages/troupe/TroupeProfileEditPage";
import TroupeProfilePublicPage from "./pages/troupe/TroupeProfilePublicPage";
import TroupePerformancesPage from "./pages/troupe/TroupePerformancesPage";
import TroupePerformanceCreatePage from "./pages/troupe/TroupePerformanceCreatePage";
import TroupePerformanceEditPage from "./pages/troupe/TroupePerformanceEditPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================
           観客側 UI（全ページ共通 Layout）
        ======================= */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="stage-list" element={<StageListPage />} />
          <Route path="stage/:stageId" element={<StageDetailPage />} />
          <Route path="reserve/:stageId" element={<ReservePage />} />
          <Route path="reserve-complete" element={<ReserveCompletePage />} />
          <Route path="troupe-home/:troupeId" element={<TroupeHomePage />} />
        </Route>

        {/* ======================
           ▼ 劇団側 UI（TroupeLayout を使用）
        ======================= */}
        <Route path="/troupe/login" element={<TroupeLoginPage />} />
        
        <Route path="/troupe" element={<TroupeLayout />}>
          <Route path="dashboard" element={<TroupeDashboardPage />} />
          <Route path="performance/create" element={<TroupePerformanceCreatePage />} />
          <Route path="performance/:performanceId/edit" element={<TroupePerformanceEditPage />} />
          <Route path="performances" element={<TroupePerformancesPage />} />
          <Route path="profile/edit" element={<TroupeProfileEditPage />} />
          <Route path="profile/public/:troupeId" element={<TroupeProfilePublicPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
