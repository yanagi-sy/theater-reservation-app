// ============================================
// MockEvents.js（同日複数公演＋地域バラバラ）
// ============================================

export const mockEvents = [
    // ============================================
    // 2025年 12月
    // ============================================
  
    // ▼ 12月3日（3公演）
    {
      id: 1,
      title: "冬の劇場物語",
      troupe: "劇団A",
      date: "2025-12-03",
      time: "14:00",
      venue: "東京・シアター101",
      prefecture: "東京都",
      region: "関東",
      price: 0,
    },
    {
      id: 2,
      title: "雪のメロディ",
      troupe: "劇団B",
      date: "2025-12-03",
      time: "18:00",
      venue: "大阪・心斎橋ホール",
      prefecture: "大阪府",
      region: "関西",
      price: 2800,
    },
    {
      id: 3,
      title: "北の国の物語",
      troupe: "劇団C",
      date: "2025-12-03",
      time: "19:30",
      venue: "北海道・札幌文化館",
      prefecture: "北海道",
      region: "北海道",
      price: 1500,
    },
  
    // ▼ 12月10日（2公演）
    {
      id: 4,
      title: "クリスマス・ファンタジア",
      troupe: "劇団D",
      date: "2025-12-10",
      time: "19:00",
      venue: "福岡・天神シアター",
      prefecture: "福岡県",
      region: "九州",
      price: 0,
    },
    {
      id: 5,
      title: "聖夜の奇跡",
      troupe: "劇団E",
      date: "2025-12-10",
      time: "13:00",
      venue: "宮城・仙台アートホール",
      prefecture: "宮城県",
      region: "東北",
      price: 3000,
    },
  
    // ▼ 12月25日（3公演）
    {
      id: 6,
      title: "ホーリーナイトライブ",
      troupe: "劇団A",
      date: "2025-12-25",
      time: "15:00",
      venue: "愛知・名古屋文化小劇場",
      prefecture: "愛知県",
      region: "中部",
      price: 0,
    },
    {
      id: 7,
      title: "光の祝祭",
      troupe: "劇団B",
      date: "2025-12-25",
      time: "18:00",
      venue: "広島・平和記念ホール",
      prefecture: "広島県",
      region: "中国",
      price: 3500,
    },
    {
      id: 8,
      title: "キャンドル・ステージ",
      troupe: "劇団C",
      date: "2025-12-25",
      time: "20:00",
      venue: "大阪・梅田劇場",
      prefecture: "大阪府",
      region: "関西",
      price: 4200,
    },
  
    // ============================================
    // 2026年 1月
    // ============================================
  
    // ▼ 1月5日（2公演）
    {
      id: 9,
      title: "新春スペシャル公演",
      troupe: "劇団A",
      date: "2026-01-05",
      time: "18:00",
      venue: "東京・アートシアター",
      prefecture: "東京都",
      region: "関東",
      price: 0,
    },
    {
      id: 10,
      title: "初笑いステージ",
      troupe: "劇団D",
      date: "2026-01-05",
      time: "14:00",
      venue: "大阪・難波ホール",
      prefecture: "大阪府",
      region: "関西",
      price: 2000,
    },
  
    // ▼ 1月10日（3公演）
    {
      id: 11,
      title: "雪原のオペラ",
      troupe: "劇団E",
      date: "2026-01-10",
      time: "15:00",
      venue: "北海道・雪ホール",
      prefecture: "北海道",
      region: "北海道",
      price: 0,
    },
    {
      id: 12,
      title: "新年朗読ライブ",
      troupe: "劇団C",
      date: "2026-01-10",
      time: "17:00",
      venue: "宮城・仙台文化館",
      prefecture: "宮城県",
      region: "東北",
      price: 1200,
    },
    {
      id: 13,
      title: "冬空の音楽祭",
      troupe: "劇団B",
      date: "2026-01-10",
      time: "19:00",
      venue: "広島・アクアホール",
      prefecture: "広島県",
      region: "中国",
      price: 3800,
    },
  
    // ============================================
    // 2026年 2月
    // ============================================
  
    // ▼ 2月1日（2公演）
    {
      id: 14,
      title: "冬の終わりに",
      troupe: "劇団A",
      date: "2026-02-01",
      time: "14:00",
      venue: "福岡・天神小劇場",
      prefecture: "福岡県",
      region: "九州",
      price: 0,
    },
    {
      id: 15,
      title: "舞踏と音楽の夜",
      troupe: "劇団B",
      date: "2026-02-01",
      time: "19:00",
      venue: "愛知・金山文化ホール",
      prefecture: "愛知県",
      region: "中部",
      price: 2600,
    },
  
    // ▼ 2月11日（3公演）
    {
      id: 16,
      title: "愛と雪のステージ",
      troupe: "劇団C",
      date: "2026-02-11",
      time: "16:00",
      venue: "東京・光劇場",
      prefecture: "東京都",
      region: "関東",
      price: 0,
    },
    {
      id: 17,
      title: "光と影のダンス",
      troupe: "劇団D",
      date: "2026-02-11",
      time: "18:00",
      venue: "大阪・中央劇場",
      prefecture: "大阪府",
      region: "関西",
      price: 4500,
    },
    {
      id: 18,
      title: "星降る夜に",
      troupe: "劇団E",
      date: "2026-02-11",
      time: "20:00",
      venue: "広島・アートセンター",
      prefecture: "広島県",
      region: "中国",
      price: 2000,
    },
  
    // ============================================
    // 2026年 3月
    // ============================================
  
    // ▼ 3月3日（2公演）
    {
      id: 19,
      title: "春待つ物語",
      troupe: "劇団A",
      date: "2026-03-03",
      time: "14:00",
      venue: "宮城・杜のホール",
      prefecture: "宮城県",
      region: "東北",
      price: 1200,
    },
    {
      id: 20,
      title: "桜のシンフォニー",
      troupe: "劇団B",
      date: "2026-03-03",
      time: "18:00",
      venue: "東京・桜劇場",
      prefecture: "東京都",
      region: "関東",
      price: 3000,
    },
  
    // ▼ 3月10日（3公演）
    {
      id: 21,
      title: "春風のオペラ",
      troupe: "劇団C",
      date: "2026-03-10",
      time: "17:00",
      venue: "大阪・シアター北館",
      prefecture: "大阪府",
      region: "関西",
      price: 5000,
    },
    {
      id: 22,
      title: "旅立ちのメロディ",
      troupe: "劇団D",
      date: "2026-03-10",
      time: "19:00",
      venue: "愛知・名古屋アクトホール",
      prefecture: "愛知県",
      region: "中部",
      price: 0,
    },
    {
      id: 23,
      title: "光のアンサンブル",
      troupe: "劇団E",
      date: "2026-03-10",
      time: "20:30",
      venue: "福岡・大濠シアター",
      prefecture: "福岡県",
      region: "九州",
      price: 1500,
    },
  ];
  