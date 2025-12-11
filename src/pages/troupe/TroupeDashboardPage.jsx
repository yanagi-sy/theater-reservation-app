/**
 * ============================================
 * TroupeDashboardPage.jsx - 劇団ダッシュボード
 * ============================================
 * 
 * 劇団側の管理画面のトップページです。
 * 
 * 主な機能：
 * 1. 各種管理ページへのナビゲーション
 * 2. アカウント失効に関する注意書きの表示
 */

import { Link } from "react-router-dom";
import "./TroupeDashboardPage.css";

/**
 * TroupeDashboardPageコンポーネント
 * 
 * @returns {JSX.Element} ダッシュボードページのUI
 */
function TroupeDashboardPage() {
  return (
    <div className="troupe-dashboard-page">
      <h1>劇団ダッシュボード</h1>

      {/* 管理機能カード一覧 */}
      <div className="dashboard-card-list">
        <Link to="/troupe/profile/edit" className="dashboard-card">
          <div className="dashboard-card-title">プロフィール編集</div>
          <div className="dashboard-card-description">劇団の情報を編集します</div>
        </Link>
        <Link to="/troupe/performances" className="dashboard-card">
          <div className="dashboard-card-title">公演一覧</div>
          <div className="dashboard-card-description">作成した公演を管理します</div>
        </Link>
        <Link to="/troupe/performance/create" className="dashboard-card">
          <div className="dashboard-card-title">公演を作成</div>
          <div className="dashboard-card-description">新しい公演を登録します</div>
        </Link>
        <Link to="/troupe/profile/public/sample" className="dashboard-card">
          <div className="dashboard-card-title">公開プロフィールを見る</div>
          <div className="dashboard-card-description">公開されているプロフィールを確認します</div>
        </Link>
      </div>

      {/* アカウント失効に関する注意書き */}
      <div className="dashboard-notice" style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#fff3cd",
        border: "1px solid #ffc107",
        borderRadius: "8px",
        fontSize: "14px",
        lineHeight: "1.6"
      }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#856404" }}>
          ⚠️ アカウント失効について
        </p>
        <p style={{ margin: 0, color: "#856404" }}>
          ストレージの圧迫を防ぐため、2年以上活動がない劇団アカウントは強制失効となります。
          定期的に公演を作成するか、プロフィールを更新することでアカウントを維持できます。
        </p>
      </div>
    </div>
  );
}

export default TroupeDashboardPage;
