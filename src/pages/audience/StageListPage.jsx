// ============================================
// StageListPage.jsx（完全版）
// 公演一覧ページ：検索・フィルター・並べ替え・地域対応
// Firestore から公演データを読み込みます
// ============================================

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./StageListPage.css";

export default function StageListPage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const selectedDate = urlParams.get("date"); // カレンダーから遷移してきた日付

  // --------------------------------------------
  // 状態管理
  // --------------------------------------------
  const [keyword, setKeyword] = useState("");
  const [filterPrice, setFilterPrice] = useState("all");       // free / paid
  const [filterRegion, setFilterRegion] = useState("all");     // 地方
  const [filterPrefecture, setFilterPrefecture] = useState("all"); // 都道府県
  const [sortKey, setSortKey] = useState("time-asc");          // 並べ替え
  const [displayList, setDisplayList] = useState([]);
  
  // Firestore読み取り用の状態
  const [performances, setPerformances] = useState([]);        // Firestoreから取得した生データ
  const [troupeMap, setTroupeMap] = useState({});             // troupeId -> 劇団情報のマップ
  const [loading, setLoading] = useState(true);                // 読み込み中
  const [error, setError] = useState("");                      // エラーメッセージ

  // --------------------------------------------
  // 都道府県一覧（Firestoreデータから自動生成）
  // --------------------------------------------
  const prefectureList = Array.from(
    new Set(performances.map((e) => e.prefecture).filter(Boolean))
  );

  // --------------------------------------------
  // Firestoreから公演データと劇団情報を読み込む
  // --------------------------------------------
  useEffect(() => {
    const loadPerformances = async () => {
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Firestoreの"performances"コレクションから全データを取得
        const performancesRef = collection(db, "performances");
        const q = query(performancesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const performancesData = [];
        const troupeIds = new Set(); // 重複を避けるためSetを使用

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          performancesData.push({
            id: doc.id, // ドキュメントID
            ...data,
          });
          
          // 劇団IDを収集
          if (data.troupeId) {
            troupeIds.add(data.troupeId);
          }
        });

        console.log("公演データを読み込みました:", performancesData.length, "件");

        // 劇団情報をバッチで取得
        const troupeDataMap = {};
        const troupePromises = Array.from(troupeIds).map(async (troupeId) => {
          try {
            const troupeDocRef = doc(db, "troupes", troupeId);
            const troupeDocSnap = await getDoc(troupeDocRef);
            if (troupeDocSnap.exists()) {
              troupeDataMap[troupeId] = troupeDocSnap.data();
            } else {
              troupeDataMap[troupeId] = { troupeName: "劇団名未設定" };
            }
          } catch (err) {
            console.warn(`劇団情報の取得に失敗しました (troupeId: ${troupeId}):`, err);
            troupeDataMap[troupeId] = { troupeName: "劇団名未設定" };
          }
        });

        await Promise.all(troupePromises);
        console.log("劇団情報を読み込みました:", Object.keys(troupeDataMap).length, "件");

        setPerformances(performancesData);
        setTroupeMap(troupeDataMap);
      } catch (error) {
        console.error("公演データ読み込みエラー:", error);
        setError(`公演データの読み込みに失敗しました: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPerformances();
  }, []);

  // --------------------------------------------
  // Firestoreデータを表示用データ構造に変換する関数
  // --------------------------------------------
  const convertToDisplayFormat = (performance) => {
    // stages配列から最初のステージ情報を取得
    const firstStage = performance.stages && performance.stages.length > 0 
      ? performance.stages[0] 
      : null;

    // 劇団情報を取得
    const troupeInfo = troupeMap[performance.troupeId] || {};
    const troupeName = troupeInfo.troupeName || "劇団名未設定";
    const iconImage = troupeInfo.iconUrl || "";

    return {
      id: performance.id,
      title: performance.title || "タイトル未設定",
      troupe: troupeName,
      troupeId: performance.troupeId,
      iconImage: iconImage,
      mainImage: performance.mainImage || "",
      date: firstStage?.date || "",
      time: firstStage?.start || "",
      endDate: performance.stages && performance.stages.length > 0
        ? performance.stages[performance.stages.length - 1]?.date
        : null,
      venue: performance.venue || "",
      prefecture: performance.prefecture || "",
      region: performance.region || "",
      price: performance.price || 0,
      overview: performance.overview || "",
      cast: performance.cast || [],
      staff: performance.staff || [],
      stages: performance.stages || [],
    };
  };

  // --------------------------------------------
  // 絞り込み / 並べ替え処理
  // --------------------------------------------
  useEffect(() => {
    // Firestoreデータを表示用データ構造に変換
    let list = performances.map(convertToDisplayFormat);

    // ▼ カレンダー遷移の日付フィルター
    if (selectedDate) {
      list = list.filter((ev) => {
        // stages配列内のいずれかのステージが選択日付と一致するか確認
        return ev.stages.some((stage) => stage.date === selectedDate) || ev.date === selectedDate;
      });
    }

    // ▼ 地方フィルター
    if (filterRegion !== "all") {
      list = list.filter((ev) => ev.region === filterRegion);
    }

    // ▼ 都道府県フィルター
    if (filterPrefecture !== "all") {
      list = list.filter((ev) => ev.prefecture === filterPrefecture);
    }

    // ▼ 無料 / 有料フィルター
    if (filterPrice === "free") {
      list = list.filter((ev) => ev.price === 0);
    } else if (filterPrice === "paid") {
      list = list.filter((ev) => ev.price > 0);
    }

    // ▼ キーワード検索（タイトル・劇団名）
    if (keyword.trim() !== "") {
      const key = keyword.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.title.toLowerCase().includes(key) ||
          ev.troupe.toLowerCase().includes(key)
      );
    }

    // ------------------------------------------
    // ▼ 並べ替え処理
    // ------------------------------------------
    list = list.sort((a, b) => {
      switch (sortKey) {
        case "time-asc": // 開演が早い順
          return (a.time || "").localeCompare(b.time || "");

        case "time-desc": // 開演が遅い順
          return (b.time || "").localeCompare(a.time || "");

        case "price-asc": // 安い順（無料が最上位）
          return a.price - b.price;

        case "price-desc": // 高い順
          return b.price - a.price;

        case "newest": // 新着順（作成日時の降順、Firestoreで既にソート済み）
          return 0; // Firestoreで既にソートされているため、そのまま維持

        default:
          return 0;
      }
    });

    setDisplayList(list);
  }, [
    keyword,
    filterPrice,
    filterRegion,
    filterPrefecture,
    sortKey,
    selectedDate,
    performances, // Firestoreデータが変更されたときに再フィルタリング
    troupeMap,    // 劇団情報が変更されたときに再変換
  ]);

  // --------------------------------------------
  // JSX（UI部分）
  // --------------------------------------------
  
  // ローディング中の表示
  if (loading) {
    return (
      <div className="stage-list-page">
        <h1 className="page-title">公演一覧</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="stage-list-page">
        <h1 className="page-title">公演一覧</h1>
        <p style={{ color: "#c62828", padding: "20px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="stage-list-page">
      <h1 className="page-title">公演一覧</h1>

      {/* --------------------------------------------
          フィルターバー（検索 / 地域 / 都道府県 / 料金 / 並べ替え）
      -------------------------------------------- */}
      <div className="filter-bar">

        {/* キーワード検索 */}
        <input
          type="text"
          className="search-input"
          placeholder="キーワード検索（例：冬・劇団名など）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        {/* 地域（地方） */}
        <select
          className="filter-select"
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
        >
          <option value="all">すべての地域</option>
          <option value="北海道">北海道</option>
          <option value="東北">東北</option>
          <option value="関東">関東</option>
          <option value="中部">中部</option>
          <option value="関西">関西</option>
          <option value="中国">中国</option>
          <option value="九州">九州</option>
        </select>

        {/* 都道府県 */}
        <select
          className="filter-select"
          value={filterPrefecture}
          onChange={(e) => setFilterPrefecture(e.target.value)}
        >
          <option value="all">都道府県：すべて</option>
          {prefectureList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* 無料 / 有料 */}
        <select
          className="filter-select"
          value={filterPrice}
          onChange={(e) => setFilterPrice(e.target.value)}
        >
          <option value="all">料金：すべて</option>
          <option value="free">無料</option>
          <option value="paid">有料</option>
        </select>

        {/* 並べ替え */}
        <select
          className="filter-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="time-asc">開演が早い順</option>
          <option value="time-desc">開演が遅い順</option>
          <option value="price-asc">料金が安い順</option>
          <option value="price-desc">料金が高い順</option>
          <option value="newest">新着順</option>
        </select>
      </div>

      {/* --------------------------------------------
          公演カード一覧
      -------------------------------------------- */}
      <div className="stage-list">
        {displayList.length === 0 && (
          <p className="no-result">該当する公演がありません。</p>
        )}

        {displayList.map((item) => {
          // 公演が終了しているかどうかを判定
          // endDateが設定されている場合はendDateを使用、ない場合はdateを使用
          const endDate = item.endDate || item.date;
          const endDateTime = new Date(`${endDate}T${item.time || "23:59"}`);
          const now = new Date();
          const isEnded = endDateTime < now;

          return (
            <Link
              key={item.id}
              to={`/stage/${item.id}`}  
              className={`stage-card ${isEnded ? "stage-card-ended" : ""}`}
            >        
              {/* タイトル + バッジ */}
              <div className="stage-card-header">
                <h2 className="stage-title">{item.title}</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {/* 終了バッジ */}
                  {isEnded && (
                    <span className="ended-badge">
                      終了
                    </span>
                  )}
                  {/* 料金バッジ */}
                  <span
                    className={`price-badge ${
                      item.price === 0 ? "badge-free" : "badge-paid"
                    }`}
                  >
                    {item.price === 0 ? "無料" : "有料"}
                  </span>
                </div>
              </div>

              <p className="stage-info">劇団：{item.troupe}</p>
              <p className="stage-info">
                日時：{item.date} {item.time}
                {item.endDate && item.endDate !== item.date && (
                  <span> 〜 {item.endDate}</span>
                )}
              </p>
              <p className="stage-info">
                会場：{item.venue}（{item.prefecture}）
              </p>

              <p className="stage-info">地域：{item.region}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
