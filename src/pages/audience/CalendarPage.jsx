import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import "./CalendarPage.css";

import { mockEvents } from "../../mock/MockEvents";


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

// ▼ 42マスのカレンダー生成（前月/当月/翌月）
const generateCalendar = (year, month) => {
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay(); // 0(日)〜6(土)
  const daysInThisMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells = [];

  // ▼ 前月の日付マス
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, offset: -1 });
  }

  // ▼ 当月の日付マス
  for (let i = 1; i <= daysInThisMonth; i++) {
    cells.push({ day: i, offset: 0 });
  }

  // ▼ 翌月の日付マス（42マスに調整）
  while (cells.length < 42) {
    const nextDay = cells.length - (startWeekday + daysInThisMonth) + 1;
    cells.push({ day: nextDay, offset: 1 });
  }

  return cells;
};

export default function CalendarPage() {
  const navigate = useNavigate();

  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(12);

  const [holidays, setHolidays] = useState(new Set());
  const [performances, setPerformances] = useState([]); // Firestoreから取得した公演データ

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
        
        // Firestore連携確認のためのconsole.log
        console.log("=== カレンダーページ：Firestoreデータ取得 ===");
        console.log("取得した公演数:", performancesData.length);
        console.log("公演データ:", performancesData);
        console.log("===========================================");
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

  // ▼ カレンダーマス生成
  const calendar = generateCalendar(year, month);

  // ▼ 日付色処理
  const getDayColor = (day, offset) => {
    // 前後月
    if (offset !== 0) return "#b8b8b8";

    // 日付文字列（祝日チェック用）
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    if (holidays.has(dateString)) return "red";

    const w = new Date(year, month - 1, day).getDay();
    if (w === 0) return "red"; // 日曜
    if (w === 6) return "blue"; // 土曜

    return "#4a3a2a";
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
      {/* ▼ 年月ヘッダー */}
      <div className="calendar-header">
        <button className="month-btn" onClick={prevMonth}>◀</button>
        <h2 className="calendar-title">{year}年 {month}月</h2>
        <button className="month-btn" onClick={nextMonth}>▶</button>
      </div>

      {/* カレンダー表示 */}
      <div className="calendar-grid">
        {calendar.map((cell, index) => {
          const { day, offset } = cell;

          // 前月・翌月の年月を計算
          let displayYear = year;
          let displayMonth = month;
          
          if (offset === -1) {
            // 前月
            if (month === 1) {
              displayYear = year - 1;
              displayMonth = 12;
            } else {
              displayMonth = month - 1;
            }
          } else if (offset === 1) {
            // 翌月
            if (month === 12) {
              displayYear = year + 1;
              displayMonth = 1;
            } else {
              displayMonth = month + 1;
            }
          }

          // YYYY-MM-DD 形式（実際の年月を使用）
          const dateString = `${displayYear}-${String(displayMonth).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;

          /**
           * イベント抽出ロジック
           * 
           * 【修正内容】：
           * - 修正前：mockEventsのみを使用（Firestoreのデータが表示されない）
           * - 修正後：Firestoreから取得したperformancesデータを使用
           * 
           * 判定方法：
           * - 公演のstages配列から各ステージのdateを取得
           * - 公演の最終日（endDate）が設定されている場合：開始日から最終日までの範囲で判定
           * - endDateが設定されていない場合：各ステージのdateが該当日と一致する場合のみ表示
           * 
           * 【重要】null/undefinedチェック：
           * - performancesが空配列の場合、filterは空配列を返す（エラーにならない）
           * - stagesが存在しない場合、空配列として扱う
           */
          const events = performances.filter((performance) => {
            // 【重要】stages配列の存在チェック
            // なぜ必要か：stagesが未定義やnullの場合、エラーを防ぐため
            if (!performance.stages || !Array.isArray(performance.stages) || performance.stages.length === 0) {
              return false; // stagesが存在しない場合は表示しない
            }

            // stages配列から最初と最後のステージを取得
            const firstStage = performance.stages[0];
            const lastStage = performance.stages[performance.stages.length - 1];
            
            // 最初のステージの日付を取得
            const startDateString = firstStage?.date;
            if (!startDateString) {
              return false; // 日付が存在しない場合は表示しない
            }

            const startDate = new Date(startDateString);
            const cellDate = new Date(dateString);
            
            // 日付を00:00:00にリセットして比較
            startDate.setHours(0, 0, 0, 0);
            cellDate.setHours(0, 0, 0, 0);
            
            // 最後のステージの日付を取得（複数日の場合）
            const endDateString = lastStage?.date;
            if (endDateString && endDateString !== startDateString) {
              // 複数日にわたる公演の場合：開始日から最終日までの範囲で判定
              const endDate = new Date(endDateString);
              endDate.setHours(0, 0, 0, 0);
              return cellDate >= startDate && cellDate <= endDate;
            }
            
            // 単一日の公演の場合：開始日が該当日と一致する場合のみ
            return startDate.getTime() === cellDate.getTime();
          }).map((performance) => ({
            // 表示用のデータ形式に変換
            id: performance.id,
            title: performance.title || "タイトル未設定",
            date: performance.stages?.[0]?.date || "",
          }));

          return (
            <div
              key={index}
              className={`calendar-cell ${offset !== 0 ? "fade-cell" : ""}`}
              onClick={() => {
                // 前月/翌月もクリック可能に変更（イベントが表示されるため）
                // ステージ一覧ページへ遷移
                navigate(`/stage-list?date=${dateString}`);
              }}
            >
              {/* ▼ 日付表示 */}
              <span style={{ color: getDayColor(day, offset), fontWeight: 600 }}>
                {day}
              </span>

              {/* ▼ イベント表示 */}
              <div className="events">
                {events.map((ev, i) => (
                  <div key={i} className="event-tag">
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
