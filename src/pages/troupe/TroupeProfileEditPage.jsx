/**
 * ============================================
 * TroupeProfileEditPage.jsx - 劇団プロフィール編集ページ
 * ============================================
 * 
 * 劇団が自分のプロフィール情報を編集するためのページです。
 * 
 * 主な機能：
 * 1. Firestoreから劇団プロフィール情報を読み込み
 * 2. 劇団名の入力・編集
 * 3. 紹介文の入力・編集
 * 4. アイコン画像URLの設定
 * 5. バナー画像URLの設定
 * 6. SNSリンクの設定（X/Twitter、Instagram、YouTube）
 * 7. プロフィール情報の保存
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./TroupeProfileEditPage.css";

/**
 * TroupeProfileEditPageコンポーネント
 * 
 * @returns {JSX.Element} プロフィール編集フォームページのUI
 */
function TroupeProfileEditPage() {
  const { user } = useAuth(); // 現在ログインしているユーザー情報を取得

  // フォームの状態管理
  const [troupeName, setTroupeName] = useState("");        // 劇団名
  const [description, setDescription] = useState("");      // 紹介文
  const [iconUrl, setIconUrl] = useState("");               // アイコン画像URL
  const [bannerUrl, setBannerUrl] = useState("");          // バナー画像URL
  const [twitterUrl, setTwitterUrl] = useState("");        // X/Twitter URL
  const [instagramUrl, setInstagramUrl] = useState("");   // Instagram URL
  const [youtubeUrl, setYoutubeUrl] = useState("");        // YouTube URL

  // UI状態管理
  const [loading, setLoading] = useState(true);            // データ読み込み中かどうか
  const [saving, setSaving] = useState(false);           // 保存処理中かどうか
  const [error, setError] = useState("");                 // エラーメッセージ
  const [success, setSuccess] = useState("");             // 成功メッセージ
  const [troupeDocId, setTroupeDocId] = useState(null);   // FirestoreのドキュメントID

  /**
   * Firestoreから劇団プロフィール情報を読み込む
   * 新規登録直後の場合、複数回再試行を行う
   */
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 2; // 最大2回再試行（5回から削減）
    const retryDelay = 500; // 0.5秒ごとに再試行（1秒から短縮）

    const loadTroupeProfile = async (isRetry = false) => {
      try {
        const startTime = performance.now(); // パフォーマンス測定開始
        
        // タイムアウトを設定（10秒）
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("タイムアウト: Firestoreへの接続がタイムアウトしました。")), 10000);
        });
        
        // "troupes"コレクションから、現在のユーザーのUIDに一致するドキュメントを検索
        const q = query(collection(db, "troupes"), where("uid", "==", user.uid));
        
        // タイムアウトとクエリの競合
        const querySnapshot = await Promise.race([
          getDocs(q),
          timeoutPromise
        ]);

        const loadTime = performance.now() - startTime; // 読み込み時間を測定
        console.log(`プロフィール読み込み${isRetry ? ` (再試行${retryCount}回目)` : ""}: UID =`, user.uid);
        console.log(`プロフィール読み込み${isRetry ? ` (再試行${retryCount}回目)` : ""}: 検索結果数 =`, querySnapshot.size);
        console.log(`読み込み時間: ${loadTime.toFixed(2)}ms`);

        if (!querySnapshot.empty) {
          // ドキュメントが見つかった場合、最初のドキュメントを取得
          const troupeDoc = querySnapshot.docs[0];
          const troupeData = troupeDoc.data();
          
          console.log("プロフィール読み込み: 取得したデータ =", troupeData);
          console.log("プロフィール読み込み: 劇団名 =", troupeData.troupeName);
          
          // ドキュメントIDを保存（更新時に使用）
          setTroupeDocId(troupeDoc.id);

          // フォームにデータを設定
          const loadedTroupeName = troupeData.troupeName || "";
          setTroupeName(loadedTroupeName);
          setDescription(troupeData.description || "");
          setIconUrl(troupeData.iconUrl || "");
          setBannerUrl(troupeData.bannerUrl || "");
          setTwitterUrl(troupeData.twitterUrl || "");
          setInstagramUrl(troupeData.instagramUrl || "");
          setYoutubeUrl(troupeData.youtubeUrl || "");

          console.log("劇団プロフィールを読み込みました:", troupeData);
          console.log("フォームに設定した劇団名:", loadedTroupeName);
          
          // 劇団名が空の場合は警告
          if (!loadedTroupeName) {
            console.warn("警告: 劇団名が空です。データ:", troupeData);
          }

          setError("");
          setLoading(false);
        } else {
          // データが見つからない場合、再試行（新規登録直後の可能性を考慮）
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`劇団プロフィールが見つかりませんでした。${retryDelay}ms後に再試行します... (${retryCount}/${maxRetries})`);
            
            setTimeout(() => {
              loadTroupeProfile(true);
            }, retryDelay);
          } else {
            // 最大再試行回数に達した場合
            console.error("劇団プロフィールが見つかりませんでした。最大再試行回数に達しました。");
            console.error("デバッグ情報:");
            console.error("- UID:", user.uid);
            console.error("- Firestore接続:", db ? "接続済み" : "未接続");
            setError("劇団プロフィールが見つかりませんでした。新規登録を完了してください。");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("プロフィール読み込みエラー:", error);
        console.error("エラーコード:", error.code);
        console.error("エラーメッセージ:", error.message);
        
        // エラーの種類に応じた処理
        const isNetworkError = error.code === "unavailable" || 
                                error.message?.includes("network") || 
                                error.message?.includes("タイムアウト");
        const isPermissionError = error.code === "permission-denied";
        
        // ネットワークエラーの場合のみ再試行
        if (retryCount < maxRetries && isNetworkError && !isPermissionError) {
          retryCount++;
          console.warn(`ネットワークエラーが発生しました。${retryDelay}ms後に再試行します... (${retryCount}/${maxRetries})`);
          
          setTimeout(() => {
            loadTroupeProfile(true);
          }, retryDelay);
        } else {
          // 権限エラーやタイムアウト、最大再試行回数に達した場合
          let errorMessage = "プロフィール情報の読み込みに失敗しました。";
          
          if (error.message?.includes("タイムアウト")) {
            errorMessage = "読み込みがタイムアウトしました。ネットワーク接続を確認してください。";
          } else if (isPermissionError) {
            errorMessage = "Firestoreの読み取り権限がありません。セキュリティルールを確認してください。";
          } else if (error.code === "unauthenticated") {
            errorMessage = "認証が必要です。再度ログインしてください。";
          } else {
            errorMessage = `エラーが発生しました: ${error.message || error.code || "不明なエラー"}`;
          }
          
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    loadTroupeProfile();
  }, [user, db]);

  /**
   * フォーム送信処理（プロフィール保存）
   * 
   * @param {Event} e - フォーム送信イベント
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!user || !db) {
      setError("認証情報が取得できませんでした。");
      setSaving(false);
      return;
    }

    if (!troupeDocId) {
      setError("劇団プロフィールが見つかりませんでした。新規登録を完了してください。");
      setSaving(false);
      return;
    }

    try {
      // バリデーション：劇団名が入力されているか確認
      if (!troupeName.trim()) {
        throw new Error("劇団名を入力してください。");
      }

      // Firestoreのドキュメントを更新
      const troupeRef = doc(db, "troupes", troupeDocId);
      await updateDoc(troupeRef, {
        troupeName: troupeName.trim(),
        description: description.trim(),
        iconUrl: iconUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(), // 最終活動日時を更新
      });

      setSuccess("プロフィールを保存しました。");
      console.log("プロフィールを保存しました。ドキュメントID:", troupeDocId);
    } catch (error) {
      console.error("プロフィール保存エラー:", error);
      setError(`プロフィールの保存に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // データ読み込み中の表示
  if (loading) {
    return (
      <div className="troupe-profile-edit-page">
        <h1>劇団プロフィール編集</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="troupe-profile-edit-page">
      {/* ページタイトル */}
      <h1>劇団プロフィール編集</h1>

      {/* エラーメッセージ表示 */}
      {error && (
        <div className="error-message" style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ef5350"
        }}>
          {error}
        </div>
      )}

      {/* 成功メッセージ表示 */}
      {success && (
        <div className="success-message" style={{
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #4caf50"
        }}>
          {success}
        </div>
      )}

      {/* プロフィール編集フォーム */}
      <form className="profile-form" onSubmit={handleSubmit}>
        {/* 劇団名入力フィールド */}
        <label className="form-label">劇団名 *</label>
        <input
          type="text"
          placeholder="劇団名"
          value={troupeName}
          onChange={(e) => setTroupeName(e.target.value)}
          required
          disabled={saving}
        />

        {/* 紹介文入力フィールド */}
        <label className="form-label">紹介文</label>
        <textarea
          placeholder="紹介文"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          rows={5}
        />

        {/* アイコン画像URL入力フィールド */}
        <h3>アイコン画像URL</h3>
        <input
          type="url"
          placeholder="https://..."
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          disabled={saving}
        />

        {/* バナー画像URL入力フィールド */}
        <h3>バナー画像URL</h3>
        <input
          type="url"
          placeholder="https://..."
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          disabled={saving}
        />

        {/* SNSリンク入力フィールド */}
        <h3>SNS リンク</h3>
        <input
          type="url"
          placeholder="X (Twitter)"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          disabled={saving}
        />
        <input
          type="url"
          placeholder="Instagram"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          disabled={saving}
        />
        <input
          type="url"
          placeholder="YouTube"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          disabled={saving}
        />

        {/* 保存ボタン */}
        <button type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}

export default TroupeProfileEditPage;
