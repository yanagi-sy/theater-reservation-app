// ============================================
// TroupeHomePage.jsx（劇団のHP - 観客向け）
// ============================================

import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { mockEvents } from "../../mock/MockEvents";
import "./TroupeHomePage.css";

export default function TroupeHomePage() {
  const { troupeId } = useParams();
  const [troupeData, setTroupeData] = useState(null);
  const [troupePerformances, setTroupePerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTroupeData = async () => {
      try {
        // Firebaseから劇団データを取得
        // 暫定的にmockEventsから劇団名で検索
        const troupeName = troupeId; // 実際にはIDから劇団名を取得する必要がある
        
        // モックデータから劇団情報を取得
        const troupeFromMock = mockEvents.find((e) => e.troupe === troupeName);
        
        if (troupeFromMock) {
          setTroupeData({
            name: troupeFromMock.troupe,
            iconUrl: troupeFromMock.iconImage || "",
            bannerUrl: "",
            description: `${troupeFromMock.troupe}の紹介文がここに入ります。`,
            sns: {
              twitter: "",
              instagram: "",
              youtube: "",
            },
          });

          // 同じ劇団の公演を取得
          const performances = mockEvents.filter((e) => e.troupe === troupeFromMock.troupe);
          setTroupePerformances(performances);
        }

        // 実際のFirebase実装例（コメントアウト）
        // const troupeDoc = await getDoc(doc(db, "troupes", troupeId));
        // if (troupeDoc.exists()) {
        //   setTroupeData(troupeDoc.data());
        // }
      } catch (error) {
        console.error("劇団データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTroupeData();
  }, [troupeId]);

  if (loading) {
    return <div className="troupe-home-page">読み込み中...</div>;
  }

  if (!troupeData) {
    return (
      <div className="troupe-home-page">
        <h1>劇団が見つかりませんでした</h1>
        <Link to="/stage-list">公演一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="troupe-home-page">
      {/* バナーエリア */}
      <div className="troupe-banner">
        {troupeData.bannerUrl ? (
          <img src={troupeData.bannerUrl} alt="バナー" className="banner-image" />
        ) : (
          <div className="banner-placeholder">バナー画像</div>
        )}
      </div>

      {/* プロフィールコンテンツ */}
      <div className="troupe-content">
        <div className="troupe-header">
          <img
            src={troupeData.iconUrl || "https://via.placeholder.com/120"}
            alt={troupeData.name}
            className="troupe-icon"
          />
          <div className="troupe-info">
            <h1 className="troupe-name">{troupeData.name}</h1>
            <p className="troupe-description">{troupeData.description}</p>
          </div>
        </div>

        {/* SNSセクション */}
        {(troupeData.sns.twitter || troupeData.sns.instagram || troupeData.sns.youtube) && (
          <div className="troupe-sns-section">
            <h3>SNS</h3>
            <ul className="troupe-sns-list">
              {troupeData.sns.twitter && (
                <li>
                  <a
                    href={troupeData.sns.twitter}
                    className="troupe-sns-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X(Twitter)
                  </a>
                </li>
              )}
              {troupeData.sns.instagram && (
                <li>
                  <a
                    href={troupeData.sns.instagram}
                    className="troupe-sns-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {troupeData.sns.youtube && (
                <li>
                  <a
                    href={troupeData.sns.youtube}
                    className="troupe-sns-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* 公演一覧セクション */}
        <div className="troupe-performances-section">
          <h2>公演一覧</h2>
          {troupePerformances.length === 0 ? (
            <p className="no-performances">現在公演予定はありません</p>
          ) : (
            <div className="troupe-performance-list">
              {troupePerformances.map((performance) => (
                <Link
                  key={performance.id}
                  to={`/stage/${performance.id}`}
                  className="troupe-performance-card"
                >
                  <div className="performance-card-header">
                    <h3 className="performance-card-title">{performance.title}</h3>
                    <span
                      className={`performance-price-badge ${
                        performance.price === 0 ? "badge-free" : "badge-paid"
                      }`}
                    >
                      {performance.price === 0 ? "無料" : "有料"}
                    </span>
                  </div>
                  <p className="performance-card-info">
                    📅 {performance.date} {performance.time}
                  </p>
                  <p className="performance-card-info">📍 {performance.venue}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

