// src/pages/troupe/TroupePerformanceEditPage.jsx
import { useParams } from "react-router-dom";
import "./TroupePerformanceEditPage.css";

function TroupePerformanceEditPage() {
  const { performanceId } = useParams();

  return (
    <div className="troupe-performance-edit-page">
      <h1>公演編集</h1>
      <p className="performance-id-info">編集する公演ID：{performanceId}</p>

      <form className="performance-edit-form">
        <input type="text" placeholder="公演タイトル" />
        <textarea placeholder="公演説明"></textarea>
        <input type="text" placeholder="会場名" />
        <input type="text" placeholder="住所" />
        <input type="text" placeholder="サムネイル画像 URL" />

        <h3>ステージ日時の編集</h3>

        <button type="submit" className="update-btn">更新する</button>
      </form>
    </div>
  );
}

export default TroupePerformanceEditPage;
