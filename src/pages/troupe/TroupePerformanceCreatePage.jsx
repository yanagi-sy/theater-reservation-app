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
import "./TroupePerformanceCreatePage.css";

/**
 * TroupePerformanceCreatePageコンポーネント
 * 
 * @returns {JSX.Element} 公演作成フォームページのUI
 */
function TroupePerformanceCreatePage() {
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
   * 
   * 現在の実装：
   * - 入力されたデータをコンソールに出力
   * - アラートで通知
   * 
   * TODO: 将来的にはFirebaseに保存する処理を追加
   */
  const handleSubmit = (e) => {
    // フォームのデフォルト動作（ページリロード）を防止
    e.preventDefault();

    // すべての入力データを1つのオブジェクトにまとめる
    const data = {
      title,
      mainImage,
      overview,
      venue,
      address,
      prefecture,
      region,
      price: Number(price),  // 文字列を数値に変換
      stages,
      cast,
      staff,
    };

    // デバッグ用：コンソールにデータを出力
    console.log("保存データ：", data);
    
    // ユーザーに通知（実際のアプリでは、Firebaseへの保存処理を実行）
    alert("コンソールに保存データを出力しました！");
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="troupe-performance-create-page">
      <h1>公演作成（完全版）</h1>

      <form className="performance-form" onSubmit={handleSubmit}>
        
        {/* 基本情報 */}
        <h2>基本情報</h2>

        <input 
          type="text" 
          placeholder="公演タイトル" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input 
          type="text" 
          placeholder="メイン画像URL" 
          value={mainImage}
          onChange={(e) => setMainImage(e.target.value)}
        />

        <textarea 
          placeholder="公演説明"
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
        />

        <input 
          type="text" 
          placeholder="会場名" 
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />

        <input 
          type="text" 
          placeholder="住所"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <input 
          type="text" 
          placeholder="都道府県"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
        />

        <input 
          type="text" 
          placeholder="地域（例：関東）"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />

        <input 
          type="number" 
          placeholder="料金（0なら無料）"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {/* ステージ */}
        <h2>ステージ日時（複数可）</h2>

        {stages.map((st, i) => (
          <div key={i} className="stage-item">
            <input
              type="date"
              value={st.date}
              onChange={(e) => updateStage(i, "date", e.target.value)}
            />

            <input
              type="time"
              value={st.start}
              onChange={(e) => updateStage(i, "start", e.target.value)}
            />

            <input
              type="time"
              value={st.end}
              onChange={(e) => updateStage(i, "end", e.target.value)}
            />

            <input
              type="number"
              min="0"
              placeholder="席数上限（例：120）"
              value={st.seatLimit}
              onChange={(e) => updateStage(i, "seatLimit", Number(e.target.value))}
            />

            <button 
              type="button" 
              className="remove-btn"
              onClick={() => removeStage(i)}
            >
              削除
            </button>
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addStage}>
          ＋ ステージ追加
        </button>

        {/* キャスト */}
        <h2>キャスト</h2>

        {cast.map((c, i) => (
          <div key={i} className="cast-item">
            <input 
              type="text"
              placeholder="名前"
              value={c.name}
              onChange={(e) => updateCast(i, "name", e.target.value)}
            />

            <input 
              type="text"
              placeholder="役"
              value={c.role}
              onChange={(e) => updateCast(i, "role", e.target.value)}
            />

            <button type="button" className="remove-btn" onClick={() => removeCast(i)}>削除</button>
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addCast}>＋ キャスト追加</button>

        {/* スタッフ */}
        <h2>スタッフ</h2>

        {staff.map((s, i) => (
          <div key={i} className="staff-item">
            <input 
              type="text"
              placeholder="役割（例：演出）"
              value={s.role}
              onChange={(e) => updateStaff(i, "role", e.target.value)}
            />

            <input 
              type="text"
              placeholder="名前"
              value={s.name}
              onChange={(e) => updateStaff(i, "name", e.target.value)}
            />

            <button type="button" className="remove-btn" onClick={() => removeStaff(i)}>削除</button>
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addStaff}>＋ スタッフ追加</button>

        <button type="submit" className="submit-btn">保存</button>

      </form>
    </div>
  );
}

export default TroupePerformanceCreatePage;
