// src/pages/troupe/TroupeProfileEditPage.jsx

function TroupeProfileEditPage() {
    return (
      <div style={{ padding: "20px" }}>
        <h1>劇団プロフィール編集</h1>
  
        <form className="profile-form">
          <input type="text" placeholder="劇団名" />
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
  