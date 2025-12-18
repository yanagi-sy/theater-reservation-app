import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import "./CalendarPage.css";


// ▼ 日本の祝日取得
async function fetchHolidays(year, month) {
  const url = `https://holidays-jp.github.io/api/v1/${year}/date.json`;
  const res = await fetch(url);
  const data = await res.json();

  // 月一致のデータのみ抽出
  const keys = Object.keys(data).filter((d) => {
    const [y, m] = d.split("-");
    return Number(y) === year && Number(m) === month;
  });

  return new Set(keys); // "YYYY-MM-DD" のまま保持
}

/**
 * YYYY-MM-DD 形式へ変換するユーティリティ
 *
 * なぜ必要か：
 * - 祝日API（holidays-jp）は "YYYY-MM-DD" をキーにしているため
 * - クリック遷移（/stages?date=...）でも同じ形式を使うため
 */
const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * カレンダー表示用の42セル配列を生成する（必ず 日曜始まり / 7列×6行）
 *
 * 【要件】
 * ① 表示月の1日の曜日を取得
 * ② その曜日分だけ前月の日付を配列に追加
 * ③ 表示月の日付をすべて追加
 * ④ 配列の長さが42になるまで次月の日付を追加
 *
 * なぜこの生成が必要か：
 * - 月によってセル数が変動すると、土日列の位置がズレやすくなるため
 * - 常に 42セル（6行）に固定すると、曜日列の位置が「毎月」安定するため
 * - 表示の安定により、土日/祝日の色判定がズレなくなるため
 */
const generateCalendar = (year, month) => {
  // month は 1〜12 で管理しているので、Date用に 0〜11 に変換する
  const monthIndex = month - 1;

  // ① 表示月の1日の曜日（0:日〜6:土）
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstDayOfMonth.getDay();

  // 表示月の日数（例：1月=31, 2月=28/29）
  const daysInThisMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];

  // ② その曜日分だけ前月の日付を先頭に補完
  // なぜ 1 - i で作るか：
  // - new Date(year, monthIndex, 0) は「前月末日」になるなど、Dateが月跨ぎを自動調整してくれるため
  for (let i = firstWeekday; i > 0; i -= 1) {
    const date = new Date(year, monthIndex, 1 - i);
    cells.push({
      date,
      dateString: toDateString(date),
      day: date.getDate(),
      isOutsideMonth: true, // ⑥ 表示月以外（前月）
    });
  }

  // ③ 表示月の日付をすべて追加
  for (let day = 1; day <= daysInThisMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({
      date,
      dateString: toDateString(date),
      day,
      isOutsideMonth: false,
    });
  }

  // ④ 42セルに達するまで次月の日付を末尾に補完
  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(year, monthIndex, daysInThisMonth + nextDay);
    cells.push({
      date,
      dateString: toDateString(date),
      day: date.getDate(),
      isOutsideMonth: true, // ⑥ 表示月以外（次月）
    });
    nextDay += 1;
  }

  return cells;
};

export default function CalendarPage() {
  const navigate = useNavigate();

  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(12);

  const [holidays, setHolidays] = useState(new Set());
  const [performances, setPerformances] = useState([]); // Firestoreから取得した公演データ

  // ▼ カレンダーページ表示中だけ、Layoutの左右paddingを無効化してフル幅にする（iPhone SE等の横はみ出し対策）
  useEffect(() => {
    document.body.classList.add("audience-calendar");
    return () => {
      document.body.classList.remove("audience-calendar");
    };
  }, []);

  // ============================================
  // Firestoreから公演データを取得
  // ============================================
  // 
  // 【問題点】修正前：
  // - mockEventsのみを使用していたため、Firestoreのデータが表示されなかった
  // - Firestoreからデータを取得する処理が実装されていなかった
  // 
  // 【修正内容】：
  // - Firestoreのperformancesコレクションからデータを取得
  // - 取得したデータをstateに保存
  // - useEffectの依存配列を空配列にして、コンポーネントマウント時に1回だけ実行
  // 
  useEffect(() => {
    const loadPerformances = async () => {
      // Firestoreが初期化されているか確認
      if (!db) {
        console.warn("Firestoreが初期化されていません。");
        return;
      }

      try {
        // Firestoreの"performances"コレクションから全データを取得
        // 【一時的な切り分け】フィルタ条件を外して、まず全部取得
        const performancesRef = collection(db, "performances");
        const q = query(performancesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const performancesData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          performancesData.push({
            id: doc.id, // ドキュメントID
            ...data,
          });
        });

        // 【重要】setStateでデータを保存
        // なぜ必要か：stateに保存しないと、コンポーネントが再レンダリングされてもデータが反映されない
        setPerformances(performancesData);
      } catch (error) {
        console.error("公演データ読み込みエラー:", error);
        // エラーが発生しても画面は表示する（空の配列のまま）
      }
    };

    loadPerformances();
  }, []); // 依存配列を空にして、コンポーネントマウント時に1回だけ実行

  // ▼ 月変更時に祝日再取得
  useEffect(() => {
    fetchHolidays(year, month).then(setHolidays);
  }, [year, month]);

  // 横はみ出しの事実確認（PIIなし：幅のみ）
  useEffect(() => {
    // ※以前のデバッグ用ログ送信は削除（プロダクションコードに不要なため）
  }, [year, month, performances.length]);

  // ▼ カレンダーマス生成
  const calendar = generateCalendar(year, month);

  const getEventsForDate = (dateString) => {
    if (!dateString) return [];

    return performances
      .filter((performance) => {
        if (!performance.stages || !Array.isArray(performance.stages) || performance.stages.length === 0) {
          return false;
        }

        const firstStage = performance.stages[0];
        const lastStage = performance.stages[performance.stages.length - 1];

        const startDateString = firstStage?.date;
        if (!startDateString) return false;

        const startDate = new Date(startDateString);
        const cellDate = new Date(dateString);
        startDate.setHours(0, 0, 0, 0);
        cellDate.setHours(0, 0, 0, 0);

        const endDateString = lastStage?.date;
        if (endDateString && endDateString !== startDateString) {
          const endDate = new Date(endDateString);
          endDate.setHours(0, 0, 0, 0);
          return cellDate >= startDate && cellDate <= endDate;
        }

        return startDate.getTime() === cellDate.getTime();
      })
      .map((performance) => ({
        id: performance.id,
        title: performance.title || "タイトル未設定",
      }));
  };

  // ▼ 前月へ
  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  // ▼ 次月へ
  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="calendar-page">
      {/* トップへ戻る（履歴依存しない固定リンク） */}
      <div className="audience-top-nav">
        <Link to="/" className="audience-top-nav-link">
          ← トップに戻る
        </Link>
      </div>

      {/* ▼ 年月ヘッダー */}
      <div className="calendar-header">
        <button className="month-btn" onClick={prevMonth}>◀</button>
        <h2 className="calendar-title">{year}年 {month}月</h2>
        <button className="month-btn" onClick={nextMonth}>▶</button>
      </div>

      {/* カレンダー表示 */}
      <div className="calendar-grid">
        {calendar.map((cell, index) => {
          const { day, dateString, isOutsideMonth } = cell;

          // ④ 土日判定は Date.getDay() ではなく「表示セルのindex」で行う
          // なぜ必要か：
          // - 日付配列が前月/当月/次月を含むため、列の位置は index%7 が最も確実だから
          const isSunday = index % 7 === 0;
          const isSaturday = index % 7 === 6;

          // ⑤ 祝日判定は「実日付（dateString）」に対してのみ行う
          // さらに、表示月以外（前月・次月）のセルには祝日色を付けない（視認性優先）
          const isHoliday = !isOutsideMonth && holidays.has(dateString);

          // 日付色（表示セルの列位置で土日を判定する）
          const dayColor = isOutsideMonth
            ? "#b8b8b8"
            : isHoliday || isSunday
              ? "red"
              : isSaturday
                ? "blue"
                : "#4a3a2a";

          const events = getEventsForDate(dateString);
          const firstEvent = events[0];
          const restCount = Math.max(0, events.length - 1);

          return (
            <div
              key={dateString}
              className={`calendar-cell ${isOutsideMonth ? "fade-cell" : ""}`}
              onClick={() => {
                // 日付タップでそのまま公演一覧へ遷移（Bottom Sheetは使わない）
                navigate(`/stages?date=${dateString}`);
              }}
            >
              {/* ▼ 日付 + イベント領域（CSS Grid支配 / 中身はoverflowで逃がす） */}
              <div className="calendar-date">
                <span style={{ color: dayColor, fontWeight: 600 }}>
                  {day}
                </span>
              </div>
              <div className="calendar-events">
                {firstEvent && (
                  <div className="calendar-event" title={firstEvent.title}>
                    {firstEvent.title}
                  </div>
                )}
                {restCount > 0 && (
                  <div className="calendar-event">
                    他{restCount}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
