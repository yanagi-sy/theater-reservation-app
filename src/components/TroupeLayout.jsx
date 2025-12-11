/**
 * ============================================
 * TroupeLayout.jsx - 劇団側ページの共通レイアウト
 * ============================================
 * 
 * 劇団側の全ページで使用される共通レイアウトコンポーネントです。
 * 
 * 主な役割：
 * 1. ナビゲーションメニューを表示
 * 2. 左右に赤い帯を配置したデザインを提供
 * 3. 中央にページコンテンツを表示
 * 4. ログアウト機能を提供
 */

import { Link, Outlet, useNavigate } from "react-router-dom";
import "./TroupeLayout.css";

/**
 * TroupeLayoutコンポーネント
 * 
 * @returns {JSX.Element} 劇団側ページの共通レイアウト
 * 
 * レイアウト構造：
 * - 左側：赤い帯（装飾用）
 * - 中央：ナビゲーションメニュー + メインコンテンツエリア
 * - 右側：赤い帯（装飾用）
 */
export default function TroupeLayout() {
  // useNavigateフック：プログラム的にページ遷移を行うための関数を取得
  const navigate = useNavigate();

  /**
   * ログアウト処理
   * 
   * 現在の実装では、トップページにリダイレクトするだけです。
   * 将来的には、Firebaseの認証状態をクリアする処理を追加する必要があります。
   */
  const handleLogout = () => {
    // TODO: Firebaseの認証状態をクリアする処理を追加
    // 例：await signOut(auth);
    
    // トップページ（/）にリダイレクト
    navigate("/");
  };

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

      {/* 中央エリア */}
      <div
        style={{
          gridColumn: "2 / span 3", // 2列目から3列分を使用
          backgroundColor: "#f3e9d7", // アイボリー色の背景
          padding: "20px",
        }}
      >
        {/* ============================================
            ナビゲーションメニュー
            ============================================
            劇団側の各ページへのリンクを表示
        */}
        <nav className="troupe-nav">
          {/* ダッシュボードへのリンク */}
          <Link to="/troupe/dashboard" className="troupe-nav-link">
            <span className="nav-text">ダッシュボード</span>
          </Link>
          <span className="nav-divider">|</span>

          {/* 公演作成ページへのリンク */}
          <Link to="/troupe/performance/create" className="troupe-nav-link">
            <span className="nav-text">公演作成</span>
          </Link>
          <span className="nav-divider">|</span>

          {/* 公演一覧ページへのリンク */}
          <Link to="/troupe/performances" className="troupe-nav-link">
            <span className="nav-text">公演一覧</span>
          </Link>
          <span className="nav-divider">|</span>

          {/* プロフィール編集ページへのリンク */}
          <Link to="/troupe/profile/edit" className="troupe-nav-link">
            <span className="nav-text">プロフィール編集</span>
          </Link>
          <span className="nav-divider">|</span>

          {/* 公開プロフィールページへのリンク */}
          <Link to="/troupe/profile/public/sample" className="troupe-nav-link">
            <span className="nav-text">プロフィール</span>
          </Link>
          <span className="nav-divider">|</span>

          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            className="troupe-nav-button"
          >
            <span className="nav-text">ログアウト</span>
          </button>
        </nav>

        {/* ============================================
            ページ本体（子ルートのコンポーネントが表示される）
            ============================================
            Outletコンポーネント：
            - App.jsxで定義された子ルート（TroupeDashboardPage、TroupePerformanceCreatePageなど）がここに表示されます
        */}
        <Outlet />
      </div>

      {/* 右側の赤い帯（装飾用） */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>
    </div>
  );
}
