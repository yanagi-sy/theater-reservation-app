/**
 * ============================================
 * App.jsx - アプリケーションのルーティング設定
 * ============================================
 * 
 * このファイルは、React Routerを使用してアプリケーション全体の
 * ページ遷移（ルーティング）を管理しています。
 * 
 * 主な役割：
 * 1. 観客側と劇団側の2つのUIを分離して管理
 * 2. 各ページへのURLパスを定義
 * 3. 共通レイアウト（Layout/TroupeLayout）を適用
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

// 共通レイアウトコンポーネント（観客側と劇団側で異なるレイアウトを使用）
import Layout from "./components/Layout";
import TroupeLayout from "./components/TroupeLayout";

// ============================================
// 観客側ページのインポート
// ============================================
import HomePage from "./pages/audience/HomePage";
import CalendarPage from "./pages/audience/CalendarPage";
import StageListPage from "./pages/audience/StageListPage";
import StageDetailPage from "./pages/audience/StageDetailPage";
import ReservePage from "./pages/audience/ReservePage";
import ReserveCompletePage from "./pages/audience/ReserveCompletePage";
import TroupeHomePage from "./pages/audience/TroupeHomePage";

// ============================================
// 劇団側ページのインポート
// ============================================
import TroupeLoginPage from "./pages/troupe/TroupeLoginPage";
import TroupeDashboardPage from "./pages/troupe/TroupeDashboardPage";
import TroupeProfileEditPage from "./pages/troupe/TroupeProfileEditPage";
import TroupeProfilePublicPage from "./pages/troupe/TroupeProfilePublicPage";
import TroupePerformancesPage from "./pages/troupe/TroupePerformancesPage";
import TroupePerformanceCreatePage from "./pages/troupe/TroupePerformanceCreatePage";
import TroupePerformanceEditPage from "./pages/troupe/TroupePerformanceEditPage";

/**
 * Appコンポーネント
 * 
 * BrowserRouter: ブラウザのURLと連動してルーティングを管理
 * Routes: 複数のRouteをグループ化
 * Route: 各URLパスと表示するコンポーネントを紐付け
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            観客側 UI（全ページ共通 Layout）
            ============================================
            観客が公演を予約するためのページ群
            Layoutコンポーネントでラップされ、統一されたデザインが適用されます
        */}
        <Route path="/" element={<Layout />}>
          {/* トップページ（/） */}
          <Route index element={<HomePage />} />
          
          {/* カレンダーページ（/calendar） */}
          <Route path="calendar" element={<CalendarPage />} />
          
          {/* 公演一覧ページ（/stage-list） */}
          <Route path="stage-list" element={<StageListPage />} />
          
          {/* 公演詳細ページ（/stage/:stageId）
              :stageIdは動的なパラメータ（例：/stage/1） */}
          <Route path="stage/:stageId" element={<StageDetailPage />} />
          
          {/* 予約ページ（/reserve/:stageId） */}
          <Route path="reserve/:stageId" element={<ReservePage />} />
          
          {/* 予約完了ページ（/reserve-complete） */}
          <Route path="reserve-complete" element={<ReserveCompletePage />} />
          
          {/* 劇団ホームページ（/troupe-home/:troupeId） */}
          <Route path="troupe-home/:troupeId" element={<TroupeHomePage />} />
        </Route>

        {/* ============================================
            劇団側 UI（TroupeLayout を使用）
            ============================================
            劇団が公演を管理するためのページ群
            TroupeLayoutコンポーネントでラップされ、ナビゲーションメニューが表示されます
        */}
        
        {/* ログインページ（/troupe/login）
            レイアウトなしで表示される独立したページ */}
        <Route path="/troupe/login" element={<TroupeLoginPage />} />
        
        {/* 劇団管理ページ群（/troupe/*）
            TroupeLayoutでラップされ、ナビゲーションメニューが表示されます */}
        <Route path="/troupe" element={<TroupeLayout />}>
          {/* ダッシュボード（/troupe/dashboard） */}
          <Route path="dashboard" element={<TroupeDashboardPage />} />
          
          {/* 公演作成ページ（/troupe/performance/create） */}
          <Route path="performance/create" element={<TroupePerformanceCreatePage />} />
          
          {/* 公演編集ページ（/troupe/performance/:performanceId/edit） */}
          <Route path="performance/:performanceId/edit" element={<TroupePerformanceEditPage />} />
          
          {/* 公演一覧ページ（/troupe/performances） */}
          <Route path="performances" element={<TroupePerformancesPage />} />
          
          {/* プロフィール編集ページ（/troupe/profile/edit） */}
          <Route path="profile/edit" element={<TroupeProfileEditPage />} />
          
          {/* 公開プロフィールページ（/troupe/profile/public/:troupeId） */}
          <Route path="profile/public/:troupeId" element={<TroupeProfilePublicPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
