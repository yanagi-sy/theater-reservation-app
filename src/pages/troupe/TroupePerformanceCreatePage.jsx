// src/pages/troupe/TroupePerformanceCreatePage.jsx
import { useState } from "react";
import "./TroupePerformanceCreatePage.css";

function TroupePerformanceCreatePage() {
  // ------------------------------
  // 公演の基本情報
  // ------------------------------
  const [title, setTitle] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [overview, setOverview] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [region, setRegion] = useState("");
  const [price, setPrice] = useState(0);

  // ------------------------------
  // ステージ情報（複数）
  // ------------------------------
  const [stages, setStages] = useState([
    { date: "", start: "", end: "", seatLimit: 0 }
  ]);

  const addStage = () => {
    setStages([...stages, { date: "", start: "", end: "", seatLimit: 0 }]);
  };

  const updateStage = (index, key, value) => {
    const updated = [...stages];
    updated[index][key] = value;
    setStages(updated);
  };

  const removeStage = (index) => {
    if (stages.length === 1) return;
    setStages(stages.filter((_, i) => i !== index));
  };

  // ------------------------------
  // キャスト（複数）
  // ------------------------------
  const [cast, setCast] = useState([{ name: "", role: "" }]);

  const addCast = () => setCast([...cast, { name: "", role: "" }]);

  const updateCast = (index, key, value) => {
    const updated = [...cast];
    updated[index][key] = value;
    setCast(updated);
  };

  const removeCast = (index) => {
    if (cast.length === 1) return;
    setCast(cast.filter((_, i) => i !== index));
  };

  // ------------------------------
  // スタッフ（複数）
  // ------------------------------
  const [staff, setStaff] = useState([{ role: "", name: "" }]);

  const addStaff = () => setStaff([...staff, { role: "", name: "" }]);

  const updateStaff = (index, key, value) => {
    const updated = [...staff];
    updated[index][key] = value;
    setStaff(updated);
  };

  const removeStaff = (index) => {
    if (staff.length === 1) return;
    setStaff(staff.filter((_, i) => i !== index));
  };

  // ------------------------------
  // 保存処理
  // ------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      title,
      mainImage,
      overview,
      venue,
      address,
      prefecture,
      region,
      price: Number(price),
      stages,
      cast,
      staff,
    };

    console.log("保存データ：", data);
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
