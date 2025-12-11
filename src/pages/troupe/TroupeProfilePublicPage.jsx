// src/pages/troupe/TroupeProfilePublicPage.jsx
import "./TroupeProfilePublicPage.css";

function TroupeProfilePublicPage() {
    // 仮データ（後で Firestore と接続）
    const mockTroupe = {
      name: "サンプル劇団",
      bannerUrl: "",
      iconUrl: "",
      description: "ここに劇団の紹介文が入ります。",
      sns: {
        twitter: "https://twitter.com/",
        instagram: "https://instagram.com/",
        youtube: "https://youtube.com/",
      },
    };
  
    return (
      <div className="troupe-profile-public-page">
        <div className="profile-banner">
          {mockTroupe.bannerUrl ? (
            <img src={mockTroupe.bannerUrl} alt="バナー" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>バナー画像</span>
          )}
        </div>
  
        <div className="profile-content">
          <div className="profile-header">
            <img
              src={mockTroupe.iconUrl || "https://via.placeholder.com/120"}
              alt={mockTroupe.name}
              className="profile-icon"
            />
            <div className="profile-info">
              <h1 className="profile-name">{mockTroupe.name}</h1>
              <p className="profile-description">{mockTroupe.description}</p>
            </div>
          </div>
  
          <div className="sns-section">
            <h3>SNS</h3>
            <ul className="sns-list">
              <li><a href={mockTroupe.sns.twitter} className="sns-link" target="_blank" rel="noopener noreferrer">X(Twitter)</a></li>
              <li><a href={mockTroupe.sns.instagram} className="sns-link" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={mockTroupe.sns.youtube} className="sns-link" target="_blank" rel="noopener noreferrer">YouTube</a></li>
            </ul>
          </div>
  
          <div className="performances-section">
            <h2>公演一覧</h2>
            <div className="performances-placeholder">
              （ここに劇団の公演カードが並ぶ）
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default TroupeProfilePublicPage;
  