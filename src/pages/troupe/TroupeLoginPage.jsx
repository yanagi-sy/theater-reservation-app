// src/pages/troupe/TroupeLoginPage.jsx
import { useState } from "react";
import "./TroupeLoginPage.css";

function TroupeLoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="troupe-login-page">
      <h1>{isLogin ? "劇団ログイン" : "劇団新規登録"}</h1>

      <form className="login-form">
        <input type="email" placeholder="メールアドレス" />
        <input type="password" placeholder="パスワード" />

        {!isLogin && <input type="text" placeholder="劇団名" />}

        <button type="submit">
          {isLogin ? "ログイン" : "新規登録"}
        </button>
      </form>

      <p
        className="toggle-link"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "新規登録はこちら" : "ログインはこちら"}
      </p>
    </div>
  );
}

export default TroupeLoginPage;
