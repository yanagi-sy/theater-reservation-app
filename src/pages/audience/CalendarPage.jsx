import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
           * 変更前：当月のイベントのみ表示
           * 変更後：前月・当月・翌月のイベントも表示
           * 
           * 判定方法：
           * - 公演の最終日（endDate）が設定されている場合：開始日から最終日までの範囲で判定
           * - endDateが設定されていない場合：公演日（date）が該当日と一致する場合のみ表示
           */
          const events = mockEvents.filter((e) => {
            const eventDate = new Date(e.date);
            const cellDate = new Date(dateString);
            
            // 日付を00:00:00にリセットして比較
            eventDate.setHours(0, 0, 0, 0);
            cellDate.setHours(0, 0, 0, 0);
            
            // endDateが設定されている場合：開始日から最終日までの範囲で判定
            if (e.endDate) {
              const endDate = new Date(e.endDate);
              endDate.setHours(0, 0, 0, 0);
              return cellDate >= eventDate && cellDate <= endDate;
            }
            
            // endDateが設定されていない場合：公演日が該当日と一致する場合のみ
            return eventDate.getTime() === cellDate.getTime();
          });

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
