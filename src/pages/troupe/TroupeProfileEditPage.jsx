// src/pages/troupe/TroupeProfileEditPage.jsx
import "./TroupeProfileEditPage.css";

function TroupeProfileEditPage() {
  return (
    <div className="troupe-profile-edit-page">
      <h1>劇団プロフィール編集</h1>

      <form className="profile-form">
        <label className="form-label">劇団名</label>
        <input type="text" placeholder="劇団名" />

        <label className="form-label">紹介文</label>
        <textarea placeholder="紹介文"></textarea>

        <h3>アイコン画像URL</h3>
        <input type="text" placeholder="https://..." />

        <h3>バナー画像URL</h3>
        <input type="text" placeholder="https://..." />

        <h3>SNS リンク</h3>
        <input type="text" placeholder="X (Twitter)" />
        <input type="text" placeholder="Instagram" />
        <input type="text" placeholder="YouTube" />

        <button type="submit">保存</button>
      </form>
    </div>
  );
}

export default TroupeProfileEditPage;
