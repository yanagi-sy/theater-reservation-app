// src/components/TroupeLayout.jsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./TroupeLayout.css";

export default function TroupeLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // ログアウト処理（必要に応じてFirebaseの認証状態をクリア）
    // トップページにリダイレクト
    navigate("/");
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 3fr 3fr 1fr",
        minHeight: "100vh",
      }}
    >
      {/* 左の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>

      {/* 中央エリア */}
      <div
        style={{
          gridColumn: "2 / span 3",
          backgroundColor: "#f3e9d7",
          padding: "20px",
        }}
      >
        {/* ▼ 劇団メニュー（ナビゲーション） */}
        <nav className="troupe-nav">
          <Link to="/troupe/dashboard" className="troupe-nav-link">
            <span className="nav-text">ダッシュボード</span>
          </Link>
          <span className="nav-divider">|</span>
          <Link to="/troupe/performance/create" className="troupe-nav-link">
            <span className="nav-text">公演作成</span>
          </Link>
          <span className="nav-divider">|</span>
          <Link to="/troupe/performances" className="troupe-nav-link">
            <span className="nav-text">公演一覧</span>
          </Link>
          <span className="nav-divider">|</span>
          <Link to="/troupe/profile/edit" className="troupe-nav-link">
            <span className="nav-text">プロフィール編集</span>
          </Link>
          <span className="nav-divider">|</span>
          <button
            onClick={handleLogout}
            className="troupe-nav-button"
          >
            <span className="nav-text">ログアウト</span>
          </button>
        </nav>

        {/* ▼ ページ本体 */}
        <Outlet />
      </div>

      {/* 右の赤帯 */}
      <div style={{ backgroundColor: "#4a0e0e" }}></div>
    </div>
  );
}
