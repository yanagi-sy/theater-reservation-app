// ============================================
// StageListPage.jsx（完全版）
// 公演一覧ページ：検索・フィルター・並べ替え・地域対応
// MockEvents.js と完全連携します
// ============================================

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import "./StageListPage.css";

// Mockイベントデータ
import { mockEvents } from "../mock/MockEvents";

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

  // --------------------------------------------
  // 都道府県一覧（MockEvents から自動生成）
  // --------------------------------------------
  const prefectureList = Array.from(
    new Set(mockEvents.map((e) => e.prefecture))
  );

  // --------------------------------------------
  // 初期ロード & 日付が変わったとき
  // --------------------------------------------
  useEffect(() => {
    let list = [...mockEvents];

    if (selectedDate) {
      list = list.filter((ev) => ev.date === selectedDate);
    }

    setDisplayList(list);
  }, [selectedDate]);

  // --------------------------------------------
  // 絞り込み / 並べ替え処理
  // --------------------------------------------
  useEffect(() => {
    let list = [...mockEvents];

    // ▼ カレンダー遷移の日付
    if (selectedDate) {
      list = list.filter((ev) => ev.date === selectedDate);
    }

    // ▼ 地方フィルター
    if (filterRegion !== "all") {
      list = list.filter((ev) => ev.region === filterRegion);
    }

    // ▼ 都道府県フィルター
    if (filterPrefecture !== "all") {
      list = list.filter((ev) => ev.prefecture === filterPrefecture);
    }

    // ▼ 無料 / 有料
    if (filterPrice === "free") {
      list = list.filter((ev) => ev.price === 0);
    } else if (filterPrice === "paid") {
      list = list.filter((ev) => ev.price > 0);
    }

    // ▼ キーワード検索（タイトル・劇団）
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
          return a.time.localeCompare(b.time);

        case "time-desc": // 開演が遅い順
          return b.time.localeCompare(a.time);

        case "price-asc": // 安い順（無料が最上位）
          return a.price - b.price;

        case "price-desc": // 高い順
          return b.price - a.price;

        case "newest": // 新着順（IDが大きい順）
          return b.id - a.id;

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
  ]);

  // --------------------------------------------
  // JSX（UI部分）
  // --------------------------------------------
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

        {displayList.map((item) => (
          <Link
            key={item.id}
            to={`/stage-detail/${item.id}`}
            className="stage-card"
          >
            {/* タイトル + バッジ */}
            <div className="stage-card-header">
              <h2 className="stage-title">{item.title}</h2>
              <span
                className={`price-badge ${
                  item.price === 0 ? "badge-free" : "badge-paid"
                }`}
              >
                {item.price === 0 ? "無料" : "有料"}
              </span>
            </div>

            <p className="stage-info">劇団：{item.troupe}</p>
            <p className="stage-info">
              日時：{item.date} {item.time}
            </p>
            <p className="stage-info">
              会場：{item.venue}（{item.prefecture}）
            </p>

            <p className="stage-info">地域：{item.region}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
