/**
 * ============================================
 * TroupeProfilePublicPage.jsx - 劇団公開プロフィールページ
 * ============================================
 * 
 * 劇団の公開プロフィールを表示するページです。
 * 
 * 主な機能：
 * 1. Firestoreから劇団プロフィール情報を読み込み
 * 2. 劇団名、紹介文、画像、SNSリンクの表示
 * 3. 公演一覧の表示（将来的に実装）
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./TroupeProfilePublicPage.css";

function TroupeProfilePublicPage() {
  const { troupeId } = useParams();
    const { user } = useAuth();
    
    // 状態管理
    const [troupeData, setTroupeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /**
     * Firestoreから劇団プロフィール情報を読み込む
     */
    useEffect(() => {
        const loadTroupeProfile = async () => {
            if (!db) {
                setError("Firestoreが初期化されていません。");
                setLoading(false);
                return;
            }

            try {
                // 現在ログインしているユーザーのUIDで検索
                if (!user?.uid) {
                    setError("ログインが必要です。");
                    setLoading(false);
                    return;
                }

                const startTime = performance.now(); // パフォーマンス測定開始
                
                // Firestoreから劇団データを直接取得（ドキュメントID = uid）
                // 注意: Promise.race によるタイムアウトは削除
                // Firestore SDK は独自のタイムアウトメカニズムを持っており、
                // クライアント側で強制的にタイムアウトを設定すると、実際のエラーを隠してしまいます
                const troupeDocRef = doc(db, "troupes", user.uid);
                const troupeDocSnap = await getDoc(troupeDocRef);
                
                const loadTime = performance.now() - startTime; // 読み込み時間を測定

                console.log("公開プロフィール読み込み: UID =", user.uid);
                console.log(`読み込み時間: ${loadTime.toFixed(2)}ms`);

                // ドキュメントの存在を確認
                if (troupeDocSnap.exists()) {
                    const data = troupeDocSnap.data();
                    
                    console.log("公開プロフィール読み込み: 取得したデータ =", data);
                    console.log("公開プロフィール読み込み: ドキュメントID =", troupeDocSnap.id);
                    console.log("公開プロフィール読み込み: 劇団名 =", data.troupeName);
                    
                    setTroupeData({
                        id: troupeDocSnap.id,
                        name: data.troupeName || "劇団名未設定",
                        bannerUrl: data.bannerUrl || "",
                        iconUrl: data.iconUrl || "",
                        description: data.description || "",
                        contactInfo: data.contactInfo || "",
                        sns: {
                            twitter: data.twitterUrl || "",
                            instagram: data.instagramUrl || "",
                            youtube: data.youtubeUrl || "",
                        },
                    });
                } else {
                    // ドキュメントが存在しない場合
                    console.warn("劇団プロフィールが見つかりませんでした。ドキュメントが存在しません。");
                    console.warn("デバッグ情報:");
                    console.warn("- 検索UID:", user.uid);
                    console.warn("- Firestore接続:", db ? "接続済み" : "未接続");
                    console.warn("- ドキュメントパス: troupes/" + user.uid);
                    
                    setError("劇団プロフィールが見つかりませんでした。新規登録を完了してください。");
                }
            } catch (error) {
                console.error("プロフィール読み込みエラー:", error);
                console.error("エラーコード:", error.code);
                console.error("エラーメッセージ:", error.message);
                
                let errorMessage = "プロフィール情報の読み込みに失敗しました。";
                
                // エラーの種類に応じたメッセージを設定
                if (error.code === "permission-denied") {
                    errorMessage = "Firestoreの読み取り権限がありません。セキュリティルールを確認してください。";
                } else if (error.code === "unavailable" || error.message?.includes("network")) {
                    errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
                } else if (error.code === "unauthenticated") {
                    errorMessage = "認証が必要です。再度ログインしてください。";
                } else {
                    errorMessage = `エラーが発生しました: ${error.message || error.code || "不明なエラー"}`;
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadTroupeProfile();
    }, [troupeId, user]);

    // ローディング中の表示
    if (loading) {
        return (
            <div className="troupe-profile-public-page">
                <p>読み込み中...</p>
            </div>
        );
    }

    // エラー表示
    if (error) {
        return (
            <div className="troupe-profile-public-page">
                <p style={{ color: "#c62828", padding: "20px" }}>{error}</p>
            </div>
        );
    }

    // データがない場合
    if (!troupeData) {
        return (
            <div className="troupe-profile-public-page">
                <p>劇団プロフィールが見つかりませんでした。</p>
            </div>
        );
    }

    return (
        <div className="troupe-profile-public-page">
            <div className="profile-banner">
                {troupeData.bannerUrl ? (
                    <img src={troupeData.bannerUrl} alt="バナー" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span>バナー画像</span>
                )}
            </div>

            <div className="profile-content">
                <div className="profile-header">
                    {troupeData.iconUrl ? (
                        <img
                            src={troupeData.iconUrl}
                            alt={troupeData.name}
                            className="profile-icon"
                        />
                    ) : (
                        <div className="profile-icon-placeholder">
                            {troupeData.name.charAt(0)}
                        </div>
                    )}
                    <div className="profile-info">
                        <h1 className="profile-name">{troupeData.name}</h1>
                        <p className="profile-description">{troupeData.description || "紹介文が設定されていません。"}</p>
                    </div>
                </div>

                {/* SNSセクション（SNSリンクがある場合のみ表示） */}
                {(troupeData.sns.twitter || troupeData.sns.instagram || troupeData.sns.youtube) && (
                    <div className="sns-section">
                        <h3>SNS</h3>
                        <ul className="sns-list">
                            {troupeData.sns.twitter && (
                                <li>
                                    <a href={troupeData.sns.twitter} className="sns-link" target="_blank" rel="noopener noreferrer">
                                        X(Twitter)
                                    </a>
                                </li>
                            )}
                            {troupeData.sns.instagram && (
                                <li>
                                    <a href={troupeData.sns.instagram} className="sns-link" target="_blank" rel="noopener noreferrer">
                                        Instagram
                                    </a>
                                </li>
                            )}
                            {troupeData.sns.youtube && (
                                <li>
                                    <a href={troupeData.sns.youtube} className="sns-link" target="_blank" rel="noopener noreferrer">
                                        YouTube
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* 問い合わせ先セクション（連絡先がある場合のみ表示） */}
                {troupeData.contactInfo && (
                    <div className="contact-section">
                        <h3>問い合わせ先</h3>
                        <p>{troupeData.contactInfo}</p>
                    </div>
                )}

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
  