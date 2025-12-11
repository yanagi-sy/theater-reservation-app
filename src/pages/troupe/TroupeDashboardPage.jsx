// src/pages/troupe/TroupeDashboardPage.jsx
import { Link } from "react-router-dom";
import "./TroupeDashboardPage.css";

function TroupeDashboardPage() {
  return (
    <div className="troupe-dashboard-page">
      <h1>劇団ダッシュボード</h1>

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
    </div>
  );
}

export default TroupeDashboardPage;
