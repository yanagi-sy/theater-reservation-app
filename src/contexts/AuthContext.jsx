/**
 * ============================================
 * AuthContext.jsx - 認証状態管理コンテキスト
 * ============================================
 * 
 * Firebase Authenticationの認証状態を管理するContextです。
 * 
 * 主な機能：
 * 1. 認証状態（ログイン中かどうか）の管理
 * 2. 現在のユーザー情報の管理
 * 3. 認証状態の変更を監視
 */

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * AuthContext
 * 
 * 認証状態とユーザー情報を提供するコンテキスト
 */
const AuthContext = createContext(null);

/**
 * useAuthフック
 * 
 * AuthContextを使用するためのカスタムフック
 * 
 * @returns {Object} 認証状態とユーザー情報
 *   - user: 現在ログインしているユーザー（未ログインの場合はnull）
 *   - loading: 認証状態の読み込み中かどうか
 *   - signOut: ログアウト関数
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * AuthProviderコンポーネント
 * 
 * 認証状態を管理し、子コンポーネントに提供します。
 * 
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // 現在のユーザー（未ログインの場合はnull）
  const [loading, setLoading] = useState(true); // 認証状態の読み込み中かどうか

  /**
   * 認証状態の変更を監視
   * 
   * onAuthStateChanged: Firebase Authenticationの認証状態が変更されたときに呼ばれる
   * 例：ログイン、ログアウト、トークンの更新など
   */
  useEffect(() => {
    // 認証状態の変更を監視するリスナーを設定
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);      // ユーザー情報を更新
      setLoading(false);          // 読み込み完了
    });

    // コンポーネントのアンマウント時にリスナーを解除
    return () => unsubscribe();
  }, []);

  /**
   * ログアウト関数
   * 
   * Firebase Authenticationからログアウトします。
   */
  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
      throw error;
    }
  };

  // 認証状態とログアウト関数をコンテキストに提供
  const value = {
    user,      // 現在のユーザー
    loading,   // 読み込み中かどうか
    signOut,   // ログアウト関数
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

