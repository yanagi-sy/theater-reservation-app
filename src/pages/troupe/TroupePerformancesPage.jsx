// src/pages/troupe/TroupePerformancesPage.jsx
import { Link } from "react-router-dom";
import "./TroupePerformancesPage.css";

function TroupePerformancesPage() {
  const mockPerformances = [
    { id: "1", title: "サンプル公演 1" },
    { id: "2", title: "サンプル公演 2" },
  ];

  return (
    <div className="troupe-performances-page">
      <h1>公演一覧（管理用）</h1>

      <Link to="/troupe/performance/create" className="create-performance-link">
        ＋ 新しい公演を作成
      </Link>

      <div className="performance-list">
        {mockPerformances.map((p) => (
          <div key={p.id} className="performance-item">
            <div className="performance-title">{p.title}</div>
            <Link to={`/troupe/performance/${p.id}/edit`} className="performance-edit-link">
              編集
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TroupePerformancesPage;
