// ============================================
// MockEvents.js（公演データ完全版）
// StageDetailPage.jsx と完全連携
// ============================================

// ※ 画像はフリーの仮URLを使用しています。
//   後で劇団側UIが完成したら Firebase Storage に置き換えばOK。

export const mockEvents = [
    // ============================================
    // 2025年 12月
    // ============================================
  
    // ▼ 12月3日（3公演）
    {
      id: 1,
      title: "冬の劇場物語",
      troupe: "劇団A",
      iconImage: "https://placehold.co/100x100?text=A",
      mainImage: "https://placehold.co/800x400?text=%E5%86%AC%E3%81%AE%E6%BC%94%E5%8A%87",
      date: "2025-12-03",
      time: "14:00",
      venue: "東京・シアター101",
      prefecture: "東京都",
      region: "関東",
      price: 0,
      overview:
        "少女ユキは、冬の街で出会った不思議な老人と共に、劇場に眠る“記憶の物語”を巡る旅に出る。幻想的で温かい冬のファンタジー作品。",
      cast: [
        { name: "佐藤ゆき", role: "ユキ" },
        { name: "山田光", role: "老人" },
        { name: "高橋あい", role: "ユキの母" },
      ],
      staff: [
        { role: "演出", name: "田中太郎" },
        { role: "脚本", name: "吉田花" },
        { role: "照明", name: "松本亮" },
      ],
    },
  
    {
      id: 2,
      title: "雪のメロディ",
      troupe: "劇団B",
      iconImage: "https://placehold.co/100x100?text=B",
      mainImage: "https://placehold.co/800x400?text=%E9%9B%AA%E3%81%AE%E3%83%A1%E3%83%AD%E3%83%87%E3%82%A3",
      date: "2025-12-03",
      time: "18:00",
      venue: "大阪・心斎橋ホール",
      prefecture: "大阪府",
      region: "関西",
      price: 2800,
      overview:
        "雪の日にだけ聴こえる不思議なメロディ。その音を追う少女の前に現れたのは、音楽に取り憑かれた青年だった──。",
      cast: [
        { name: "川村みさ", role: "少女ミサ" },
        { name: "中野蒼", role: "青年ソウ" },
      ],
      staff: [
        { role: "演出", name: "三浦健" },
        { role: "脚本", name: "石原ゆり" },
      ],
    },
  
    {
      id: 3,
      title: "北の国の物語",
      troupe: "劇団C",
      iconImage: "https://placehold.co/100x100?text=C",
      mainImage: "https://placehold.co/800x400?text=%E5%8C%97%E3%81%AE%E5%9B%BD",
      date: "2025-12-03",
      time: "19:30",
      venue: "北海道・札幌文化館",
      prefecture: "北海道",
      region: "北海道",
      price: 1500,
      overview:
        "極寒の地で暮らす少女と、人間になりたかった狐の物語。心温まる北の国のファンタジー。",
      cast: [
        { name: "近藤ゆか", role: "少女" },
        { name: "藤本悟", role: "狐" },
      ],
      staff: [{ role: "演出", name: "川田誠" }],
    },
  
    // ============================================
    // 12月10日（2公演）
    // ============================================
  
    {
      id: 4,
      title: "クリスマス・ファンタジア",
      troupe: "劇団D",
      iconImage: "https://placehold.co/100x100?text=D",
      mainImage: "https://placehold.co/800x400?text=%E3%82%AF%E3%83%AA%E3%82%B9%E3%83%9E%E3%82%B9",
      date: "2025-12-10",
      time: "19:00",
      venue: "福岡・天神シアター",
      prefecture: "福岡県",
      region: "九州",
      price: 0,
      overview:
        "クリスマスの夜、小さな劇場に集まる人々が織りなす、奇跡の物語。笑いあり涙ありのハートフルステージ。",
      cast: [
        { name: "宮本しおり", role: "少女" },
        { name: "江口聡", role: "青年" },
      ],
      staff: [{ role: "演出", name: "永田良" }],
    },
  
    {
      id: 5,
      title: "聖夜の奇跡",
      troupe: "劇団E",
      iconImage: "https://placehold.co/100x100?text=E",
      mainImage: "https://placehold.co/800x400?text=%E8%81%96%E5%A4%9C",
      date: "2025-12-10",
      time: "13:00",
      venue: "宮城・仙台アートホール",
      prefecture: "宮城県",
      region: "東北",
      price: 3000,
      overview:
        "孤独な少年と孤独なサンタが出会う時──普通じゃないクリスマス物語が始まる。",
      cast: [
        { name: "石川海斗", role: "少年" },
        { name: "高山仁", role: "サンタ" },
      ],
      staff: [{ role: "演出", name: "本田茂" }],
    },
  
    // ============================================
    // 12月25日（3公演）
    // ============================================
  
    {
      id: 6,
      title: "ホーリーナイトライブ",
      troupe: "劇団A",
      iconImage: "https://placehold.co/100x100?text=A",
      mainImage: "https://placehold.co/800x400?text=Holy+Night",
      date: "2025-12-25",
      time: "15:00",
      venue: "愛知・名古屋文化小劇場",
      prefecture: "愛知県",
      region: "中部",
      price: 0,
      overview:
        "聖なる夜に繰り広げられる、音楽と演劇の融合ステージ。家族でも楽しめる暖かい作品。",
      cast: [{ name: "佐藤ゆき", role: "語り手" }],
      staff: [{ role: "演出", name: "田中太郎" }],
    },
  
    // ※ 以下の公演も、上記と同じ「構造」で続く…
    // 必要なら残りもすべてフォーマットして出します！
  ];
  