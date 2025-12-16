/**
 * ============================================
 * TroupePerformanceCreatePage.jsx - 公演作成ページ
 * ============================================
 * 
 * 劇団が新しい公演を作成するためのフォームページです。
 * 
 * 主な機能：
 * 1. 公演の基本情報入力（タイトル、画像、説明、会場、料金など）
 * 2. ステージ情報の追加・編集・削除（複数の公演日時を設定可能）
 * 3. キャスト情報の追加・編集・削除（複数のキャストを登録可能）
 * 4. スタッフ情報の追加・編集・削除（複数のスタッフを登録可能）
 * 5. 公演データの保存
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./TroupePerformanceCreatePage.css";

/**
 * TroupePerformanceCreatePageコンポーネント
 * 
 * @returns {JSX.Element} 公演作成フォームページのUI
 */
function TroupePerformanceCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 認証状態を取得

  // ============================================
  // UI状態管理
  // ============================================
  const [saving, setSaving] = useState(false);      // 保存処理中かどうか
  const [error, setError] = useState("");          // エラーメッセージ
  const [success, setSuccess] = useState("");      // 成功メッセージ

  // ============================================
  // 公演の基本情報（単一の値）
  // ============================================
  // useState: コンポーネントの状態を管理するReactフック
  // [値, 値を更新する関数] = useState(初期値)
  
  const [title, setTitle] = useState("");           // 公演タイトル
  const [mainImage, setMainImage] = useState("");   // メイン画像URL
  const [overview, setOverview] = useState("");      // 公演説明
  const [venue, setVenue] = useState("");           // 会場名
  const [address, setAddress] = useState("");       // 住所
  const [prefecture, setPrefecture] = useState(""); // 都道府県
  const [region, setRegion] = useState("");         // 地域（例：関東）
  const [price, setPrice] = useState(0);            // 料金（0なら無料）

  // ============================================
  // ステージ情報（配列：複数の公演日時を管理）
  // ============================================
  // 1つの公演に複数のステージ（公演日時）を設定できます
  // 例：同じ公演を3日間開催する場合、3つのステージを追加
  
  const [stages, setStages] = useState([
    { date: "", start: "", end: "", seatLimit: 0 }  // 初期値：1つのステージ
  ]);

  /**
   * ステージを追加する関数
   * 
   * スプレッド演算子（...）を使用して、既存の配列に新しい要素を追加
   */
  const addStage = () => {
    setStages([...stages, { date: "", start: "", end: "", seatLimit: 0 }]);
  };

  /**
   * ステージ情報を更新する関数
   * 
   * @param {number} index - 更新するステージのインデックス
   * @param {string} key - 更新するフィールド名（date, start, end, seatLimit）
   * @param {string|number} value - 新しい値
   */
  const updateStage = (index, key, value) => {
    const updated = [...stages];  // 配列のコピーを作成（直接変更を避ける）
    updated[index][key] = value;  // 指定されたインデックスのフィールドを更新
    setStages(updated);           // 更新された配列でstateを更新
  };

  /**
   * ステージを削除する関数
   * 
   * @param {number} index - 削除するステージのインデックス
   * 
   * 注意：最後の1つは削除できない（最低1つのステージが必要）
   */
  const removeStage = (index) => {
    if (stages.length === 1) return;  // 最後の1つは削除不可
    setStages(stages.filter((_, i) => i !== index));  // 指定されたインデックスの要素を除外
  };

  // ============================================
  // キャスト情報（配列：複数のキャストを管理）
  // ============================================
  // 1つの公演に複数のキャスト（出演者）を登録できます
  
  const [cast, setCast] = useState([{ name: "", role: "" }]);  // 初期値：1人のキャスト

  /**
   * キャストを追加する関数
   */
  const addCast = () => setCast([...cast, { name: "", role: "" }]);

  /**
   * キャスト情報を更新する関数
   * 
   * @param {number} index - 更新するキャストのインデックス
   * @param {string} key - 更新するフィールド名（name, role）
   * @param {string} value - 新しい値
   */
  const updateCast = (index, key, value) => {
    const updated = [...cast];
    updated[index][key] = value;
    setCast(updated);
  };

  /**
   * キャストを削除する関数
   * 
   * @param {number} index - 削除するキャストのインデックス
   */
  const removeCast = (index) => {
    if (cast.length === 1) return;  // 最後の1人は削除不可
    setCast(cast.filter((_, i) => i !== index));
  };

  // ============================================
  // スタッフ情報（配列：複数のスタッフを管理）
  // ============================================
  // 1つの公演に複数のスタッフ（制作スタッフなど）を登録できます
  
  const [staff, setStaff] = useState([{ role: "", name: "" }]);  // 初期値：1人のスタッフ

  /**
   * スタッフを追加する関数
   */
  const addStaff = () => setStaff([...staff, { role: "", name: "" }]);

  /**
   * スタッフ情報を更新する関数
   * 
   * @param {number} index - 更新するスタッフのインデックス
   * @param {string} key - 更新するフィールド名（role, name）
   * @param {string} value - 新しい値
   */
  const updateStaff = (index, key, value) => {
    const updated = [...staff];
    updated[index][key] = value;
    setStaff(updated);
  };

  /**
   * スタッフを削除する関数
   * 
   * @param {number} index - 削除するスタッフのインデックス
   */
  const removeStaff = (index) => {
    if (staff.length === 1) return;  // 最後の1人は削除不可
    setStaff(staff.filter((_, i) => i !== index));
  };

  // ============================================
  // フォーム送信処理
  // ============================================
  
  /**
   * フォーム送信時の処理
   * 
   * @param {Event} e - フォーム送信イベント
   */
  const handleSubmit = async (e) => {
    // フォームのデフォルト動作（ページリロード）を防止
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    // 認証チェック
    if (!user || !user.uid) {
      setError("ログインが必要です。");
      setSaving(false);
      return;
    }

    // Firestore初期化チェック
    if (!db) {
      setError("Firestoreが初期化されていません。");
      setSaving(false);
      return;
    }

    try {
      // バリデーション：必須項目の確認
      if (!title.trim()) {
        throw new Error("公演タイトルを入力してください。");
      }
      if (!venue.trim()) {
        throw new Error("会場名を入力してください。");
      }
      if (stages.length === 0 || !stages[0].date || !stages[0].start || !stages[0].end) {
        throw new Error("最低1つのステージ情報（公演日、開始時間、終了時間）を入力してください。");
      }

      // Firestoreに保存するデータを準備
      const performanceData = {
        troupeId: user.uid,                    // 劇団ID（uid）
        title: title.trim(),                    // 公演タイトル
        mainImage: mainImage.trim(),            // メイン画像URL
        overview: overview.trim(),              // 公演説明
        venue: venue.trim(),                    // 会場名
        address: address.trim(),                // 住所
        prefecture: prefecture.trim(),          // 都道府県
        region: region.trim(),                  // 地域
        price: Number(price) || 0,              // 料金（数値に変換）
        stages: stages.map(stage => ({          // ステージ情報
          date: stage.date,
          start: stage.start,
          end: stage.end,
          seatLimit: Number(stage.seatLimit) || 0,
        })),
        cast: cast.filter(c => c.name.trim() && c.role.trim()), // 空のキャストを除外
        staff: staff.filter(s => s.name.trim() && s.role.trim()), // 空のスタッフを除外
        createdAt: serverTimestamp(),            // 作成日時
        updatedAt: serverTimestamp(),          // 更新日時
      };

      // Firestoreの"performances"コレクションに保存
      const docRef = await addDoc(collection(db, "performances"), performanceData);
      
      console.log("公演データを保存しました。ドキュメントID:", docRef.id);
      console.log("保存したデータ:", performanceData);

      setSuccess("公演を作成しました。");
      
      // 保存成功後、公演一覧ページにリダイレクト（またはダッシュボード）
      setTimeout(() => {
        navigate("/troupe/performances");
      }, 1500);
    } catch (error) {
      console.error("公演保存エラー:", error);
      setError(`公演の保存に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="troupe-performance-create-page">
      <h1>公演作成</h1>

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

      <form className="performance-form" onSubmit={handleSubmit}>
        
        {/* 基本情報 */}
        <h2>基本情報</h2>

        {/* 公演タイトル（必須） */}
        <div className="form-field">
          <label className="form-label">
            公演タイトル <span className="required-badge">必須</span>
          </label>
          <input 
            type="text" 
            placeholder="公演タイトルを入力してください" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* メイン画像URL（任意） */}
        <div className="form-field">
          <label className="form-label">
            メイン画像URL <span className="optional-badge">任意</span>
          </label>
          <input 
            type="text" 
            placeholder="https://..." 
            value={mainImage}
            onChange={(e) => setMainImage(e.target.value)}
          />
        </div>

        {/* 公演説明（任意） */}
        <div className="form-field">
          <label className="form-label">
            公演説明 <span className="optional-badge">任意</span>
          </label>
          <textarea 
            placeholder="公演の説明を入力してください"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
          />
        </div>

        {/* 会場名（必須） */}
        <div className="form-field">
          <label className="form-label">
            会場名 <span className="required-badge">必須</span>
          </label>
          <input 
            type="text" 
            placeholder="会場名を入力してください" 
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
          />
        </div>

        {/* 住所（任意） */}
        <div className="form-field">
          <label className="form-label">
            住所 <span className="optional-badge">任意</span>
          </label>
          <input 
            type="text" 
            placeholder="住所を入力してください"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* 都道府県（任意） */}
        <div className="form-field">
          <label className="form-label">
            都道府県 <span className="optional-badge">任意</span>
          </label>
          <input 
            type="text" 
            placeholder="都道府県を入力してください"
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
          />
        </div>

        {/* 地域（任意） */}
        <div className="form-field">
          <label className="form-label">
            地域 <span className="optional-badge">任意</span>
          </label>
          <input 
            type="text" 
            placeholder="地域（例：関東）"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        {/* 料金（任意） */}
        <div className="form-field">
          <label className="form-label">
            料金 <span className="optional-badge">任意</span>
          </label>
          <input 
            type="number" 
            placeholder="料金（0なら無料）"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
          />
        </div>

        {/* ステージ */}
        <h2>ステージ日時（複数可）</h2>
        <p className="section-description">
          公演の日時を設定します。最低1つのステージ情報が必要です。
        </p>

        {stages.map((st, i) => (
          <div key={i} className="stage-item">
            <div className="form-field">
              <label className="form-label">
                公演日 <span className="required-badge">必須</span>
              </label>
              <input
                type="date"
                value={st.date}
                onChange={(e) => updateStage(i, "date", e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                開始時間 <span className="required-badge">必須</span>
              </label>
              <input
                type="time"
                value={st.start}
                onChange={(e) => updateStage(i, "start", e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                終了時間 <span className="required-badge">必須</span>
              </label>
              <input
                type="time"
                value={st.end}
                onChange={(e) => updateStage(i, "end", e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                席数上限 <span className="optional-badge">任意</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="席数上限（例：120）"
                value={st.seatLimit}
                onChange={(e) => updateStage(i, "seatLimit", Number(e.target.value))}
              />
            </div>

            {stages.length > 1 && (
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeStage(i)}
              >
                削除
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addStage}>
          ＋ ステージ追加
        </button>

        {/* キャスト */}
        <h2>キャスト</h2>
        <p className="section-description">
          出演者情報を登録します。最低1人のキャスト情報が必要です。
        </p>

        {cast.map((c, i) => (
          <div key={i} className="cast-item">
            <div className="form-field">
              <label className="form-label">
                名前 <span className="required-badge">必須</span>
              </label>
              <input 
                type="text"
                placeholder="キャスト名を入力してください"
                value={c.name}
                onChange={(e) => updateCast(i, "name", e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                役 <span className="required-badge">必須</span>
              </label>
              <input 
                type="text"
                placeholder="役名を入力してください"
                value={c.role}
                onChange={(e) => updateCast(i, "role", e.target.value)}
                required
              />
            </div>

            {cast.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeCast(i)}>削除</button>
            )}
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addCast}>＋ キャスト追加</button>

        {/* スタッフ */}
        <h2>スタッフ</h2>
        <p className="section-description">
          制作スタッフ情報を登録します（任意項目です）。
        </p>

        {staff.map((s, i) => (
          <div key={i} className="staff-item">
            <div className="form-field">
              <label className="form-label">
                役割 <span className="optional-badge">任意</span>
              </label>
              <input 
                type="text"
                placeholder="役割（例：演出）"
                value={s.role}
                onChange={(e) => updateStaff(i, "role", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                名前 <span className="optional-badge">任意</span>
              </label>
              <input 
                type="text"
                placeholder="スタッフ名を入力してください"
                value={s.name}
                onChange={(e) => updateStaff(i, "name", e.target.value)}
              />
            </div>

            {staff.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeStaff(i)}>削除</button>
            )}
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addStaff}>＋ スタッフ追加</button>

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>

      </form>
    </div>
  );
}

export default TroupePerformanceCreatePage;
