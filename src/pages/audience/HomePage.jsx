/**
 * ============================================
 * HomePage.jsx - トップページ（ホーム画面）
 * ============================================
 * 
 * アプリケーションのトップページです。
 * ユーザーはここから「演劇を観る」または「演劇を作る」を選択します。
 * 
 * 主な機能：
 * 1. 観客向け：カレンダーページへのリンク
 * 2. 劇団向け：ログインページへのリンク
 */

import { Link } from "react-router-dom";
import "./HomePage.css";

/**
 * HomePageコンポーネント
 * 
 * @returns {JSX.Element} トップページのUI
 * 
 * レイアウト：
 * - タイトル：「演劇公演予約アプリ」
 * - 2つのカード（横並び）：
 *   1. 「演劇を観る」カード → カレンダーページへ
 *   2. 「演劇を作る」カード → 劇団ログインページへ
 */
export default function HomePage() {
  return (
    <div className="home-page">
      {/* ページタイトル */}
      <h1 className="home-title">演劇公演予約アプリ</h1>

      {/* カードコンテナ（2つのカードを横並びで表示） */}
      <div className="home-card-container">
        {/* 「演劇を観る」カード - 観客向け */}
        <Link to="/calendar" className="home-card">
          <div className="home-card-header">
            <h2 className="home-card-title">演劇を観る</h2>
          </div>
          <p className="home-card-description">
            カレンダーから公演を選んで予約できます
          </p>
        </Link>

        {/* 「演劇を作る」カード - 劇団向け */}
        <Link to="/troupe/login" className="home-card">
          <div className="home-card-header">
            <h2 className="home-card-title">演劇を作る</h2>
          </div>
          <p className="home-card-description">
            劇団の方：公演を登録・管理できます
          </p>
        </Link>
      </div>
    </div>
  );
}
