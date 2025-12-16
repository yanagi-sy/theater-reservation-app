/**
 * ============================================
 * ProtectedRoute.jsx - 保護されたルートコンポーネント
 * ============================================
 * 
 * ログインが必要なページを保護するためのコンポーネントです。
 * 
 * 主な機能：
 * 1. 認証状態を確認
 * 2. 未ログインの場合はログインページにリダイレクト
 * 3. ログイン済みの場合は子コンポーネントを表示
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRouteコンポーネント
 * 
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - 保護するコンポーネント
 * 
 * @returns {JSX.Element} 認証済みの場合は子コンポーネント、未認証の場合はログインページへリダイレクト
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // 認証状態の読み込み中は何も表示しない（またはローディング表示）
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3e9d7"
      }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未ログインの場合はログインページにリダイレクト
  if (!user) {
    return <Navigate to="/troupe/login" replace />;
  }

  // ログイン済みの場合は子コンポーネントを表示
  return children;
}

