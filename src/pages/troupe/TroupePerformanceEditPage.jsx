/**
 * ============================================
 * TroupePerformanceEditPage.jsx - 公演編集ページ
 * ============================================
 * 
 * 劇団が既存の公演を編集・削除するためのフォームページです。
 * 
 * 主な機能：
 * 1. Firestoreから既存の公演データを取得してフォームに反映
 * 2. 公演の基本情報編集（タイトル、画像、説明、会場、料金など）
 * 3. ステージ情報の追加・編集・削除（複数の公演日時を設定可能）
 * 4. 公演データの更新（updateDoc使用）
 * 5. 公演データの削除（deleteDoc使用、confirm必須）
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import "./TroupePerformanceEditPage.css";

/**
 * TroupePerformanceEditPageコンポーネント
 * 
 * @returns {JSX.Element} 公演編集フォームページのUI
 */
function TroupePerformanceEditPage() {
  const { performanceId } = useParams(); // URLパラメータから公演IDを取得
  const navigate = useNavigate();
  const { user } = useAuth(); // 認証状態を取得

  // ============================================
  // UI状態管理
  // ============================================
  const [loading, setLoading] = useState(true);      // データ読み込み中かどうか
  const [saving, setSaving] = useState(false);      // 保存処理中かどうか
  const [deleting, setDeleting] = useState(false);   // 削除処理中かどうか
  const [error, setError] = useState("");            // エラーメッセージ
  const [success, setSuccess] = useState("");        // 成功メッセージ

  // ============================================
  // 公演の基本情報（単一の値）
  // ============================================
  // useState: コンポーネントの状態を管理するReactフック
  // [値, 値を更新する関数] = useState(初期値)
  // 
  // 【重要】初期値は空文字列や0に設定し、
  // useEffectでFirestoreから取得したデータで上書きします
  
  const [title, setTitle] = useState("");           // 公演タイトル
  const [thumbnailUrl, setThumbnailUrl] = useState(""); // サムネイル画像URL（mainImageも対応）
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
  // 
  // 【なぜ配列で管理するのか】
  // - 1つの公演に複数のキャスト（出演者）が存在するため
  // - 例：主人公、ヒロイン、悪役など、複数の役者が出演する
  // - 配列を使うことで、動的にキャストを追加・削除できる
  // 
  // 【なぜindexベース編集で問題ないのか】
  // - キャスト情報は順序が重要ではない（表示順は任意）
  // - 各キャストに一意のIDが不要（配列のインデックスで十分）
  // - 編集・削除時にインデックスで特定できるため、シンプルな実装で対応可能
  // - 将来的にサブコレクションに分離する場合も、現時点では配列で完結させる
  // 
  // 1つの公演に複数のキャスト（出演者）を登録できます
  // 例：同じ公演に複数の役者が出演する場合、複数のキャストを追加
  
  const [cast, setCast] = useState([{ name: "", role: "" }]);  // 初期値：1人のキャスト

  /**
   * キャストを追加する関数
   * 
   * スプレッド演算子（...）を使用して、既存の配列に新しい要素を追加
   */
  const addCast = () => {
    setCast([...cast, { name: "", role: "" }]);
  };

  /**
   * キャスト情報を更新する関数
   * 
   * @param {number} index - 更新するキャストのインデックス
   * @param {string} key - 更新するフィールド名（name, role）
   * @param {string} value - 新しい値
   */
  const updateCast = (index, key, value) => {
    const updated = [...cast];  // 配列のコピーを作成（直接変更を避ける）
    updated[index][key] = value;  // 指定されたインデックスのフィールドを更新
    setCast(updated);           // 更新された配列でstateを更新
  };

  /**
   * キャストを削除する関数
   * 
   * @param {number} index - 削除するキャストのインデックス
   * 
   * 注意：最後の1人は削除できない（最低1人のキャストが必要）
   */
  const removeCast = (index) => {
    if (cast.length === 1) return;  // 最後の1人は削除不可
    setCast(cast.filter((_, i) => i !== index));  // 指定されたインデックスの要素を除外
  };

  // ============================================
  // スタッフ情報（配列：複数のスタッフを管理）
  // ============================================
  // 
  // 【なぜ配列で管理するのか】
  // - 1つの公演に複数のスタッフ（制作スタッフ）が存在するため
  // - 例：演出、照明、音響、舞台監督など、複数のスタッフが関わる
  // - 配列を使うことで、動的にスタッフを追加・削除できる
  // 
  // 【なぜindexベース編集で問題ないのか】
  // - スタッフ情報は順序が重要ではない（表示順は任意）
  // - 各スタッフに一意のIDが不要（配列のインデックスで十分）
  // - 編集・削除時にインデックスで特定できるため、シンプルな実装で対応可能
  // - 将来的にサブコレクションに分離する場合も、現時点では配列で完結させる
  // 
  // 1つの公演に複数のスタッフ（制作スタッフなど）を登録できます
  
  const [staff, setStaff] = useState([{ role: "", name: "" }]);  // 初期値：1人のスタッフ

  /**
   * スタッフを追加する関数
   * 
   * スプレッド演算子（...）を使用して、既存の配列に新しい要素を追加
   */
  const addStaff = () => {
    setStaff([...staff, { role: "", name: "" }]);
  };

  /**
   * スタッフ情報を更新する関数
   * 
   * @param {number} index - 更新するスタッフのインデックス
   * @param {string} key - 更新するフィールド名（role, name）
   * @param {string} value - 新しい値
   */
  const updateStaff = (index, key, value) => {
    const updated = [...staff];  // 配列のコピーを作成（直接変更を避ける）
    updated[index][key] = value;  // 指定されたインデックスのフィールドを更新
    setStaff(updated);           // 更新された配列でstateを更新
  };

  /**
   * スタッフを削除する関数
   * 
   * @param {number} index - 削除するスタッフのインデックス
   * 
   * 注意：最後の1人は削除できない（最低1人のスタッフが必要）
   */
  const removeStaff = (index) => {
    if (staff.length === 1) return;  // 最後の1人は削除不可
    setStaff(staff.filter((_, i) => i !== index));  // 指定されたインデックスの要素を除外
  };

  // ============================================
  // Firestoreから既存の公演データを取得
  // ============================================
  // 
  // 【なぜuseEffectを使うか】
  // - コンポーネントがマウントされた時（ページが表示された時）に一度だけ実行したい処理のため
  // - 非同期処理（Firestoreからのデータ取得）を安全に実行するため
  // 
  // 【処理の流れ】
  // 1. performanceId（URLパラメータ）を使ってFirestoreから公演データを取得
  // 2. 取得したデータをフォームの各stateに反映（初期値として設定）
  // 3. データが存在しない場合はエラーを表示
  // 
  // 【重要】依存配列にperformanceIdを指定することで、
  // URLパラメータが変更された場合（別の公演を編集する場合）に再実行されます
  
  useEffect(() => {
    const loadPerformance = async () => {
      // Firestoreが初期化されているか確認
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      // performanceIdが存在しない場合のエラーハンドリング
      if (!performanceId) {
        setError("公演IDが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // ============================================
        // 【Firestoreから取得するデータ】公演データを取得
        // ============================================
        // 
        // 取得元：performancesコレクション
        // 取得条件：performanceId（URLパラメータ）と一致するドキュメントID
        // 取得内容：公演の全データ（タイトル、会場、ステージ情報など）
        // 
        // なぜdoc()を使うか：
        // - 特定のドキュメントIDでデータを取得するため
        // - query + whereを使うよりも効率的（直接ドキュメントを参照）
        // 
        // データ構造の例：
        // performances/{performanceId}
        //   - title: "公演タイトル"
        //   - mainImage: "https://..."（またはthumbnailUrl）
        //   - overview: "公演説明"
        //   - venue: "会場名"
        //   - address: "住所"
        //   - prefecture: "都道府県"
        //   - region: "地域"
        //   - price: 1000
        //   - stages: [
        //       { date: "2025-12-01", start: "14:00", end: "16:00", seatLimit: 20 },
        //       { date: "2025-12-02", start: "14:00", end: "16:00", seatLimit: 20 }
        //     ]
        //   - createdAt: Timestamp（作成日時）
        //   - updatedAt: Timestamp（更新日時）
        // 
        const performanceRef = doc(db, "performances", performanceId);
        const performanceSnapshot = await getDoc(performanceRef);

        // 公演データが存在しない場合のエラーハンドリング
        if (!performanceSnapshot.exists()) {
          setError("指定された公演が見つかりませんでした。");
          setLoading(false);
          return;
        }

        // 取得したデータを取得
        const performanceData = performanceSnapshot.data();

        // ============================================
        // 【重要】取得したデータをフォームの初期値として反映
        // ============================================
        // 
        // なぜ必要か：
        // - ユーザーが既存のデータを編集できるようにするため
        // - フォームに既存の値が表示されないと、何を編集しているか分からないため
        // 
        // なぜ || "" や || 0 を使うか：
        // - Firestoreから取得した値がundefinedやnullの場合に備えるため
        // - 空文字列や0をデフォルト値として設定することで、エラーを防ぐため
        
        setTitle(performanceData.title || "");
        
        // 【重要】mainImageとthumbnailUrlの両方に対応
        // 既存データがmainImageを使っている場合と、thumbnailUrlを使っている場合の両方に対応
        setThumbnailUrl(performanceData.thumbnailUrl || performanceData.mainImage || "");
        
        setOverview(performanceData.overview || "");
        setVenue(performanceData.venue || "");
        setAddress(performanceData.address || "");
        setPrefecture(performanceData.prefecture || "");
        setRegion(performanceData.region || "");
        setPrice(Number(performanceData.price) || 0);

        // ステージ情報を反映
        // 【重要】stagesが配列で存在する場合のみ反映
        // なぜ必要か：stagesが存在しない場合や、空配列の場合にエラーを防ぐため
        if (Array.isArray(performanceData.stages) && performanceData.stages.length > 0) {
          setStages(performanceData.stages.map(stage => ({
            date: stage.date || "",
            start: stage.start || "",
            end: stage.end || "",
            seatLimit: Number(stage.seatLimit) || 0,
          })));
        } else {
          // stagesが存在しない場合は、初期値（1つの空ステージ）を維持
          setStages([{ date: "", start: "", end: "", seatLimit: 0 }]);
        }

        // ============================================
        // キャスト情報を反映
        // ============================================
        // 
        // 【重要】castが配列で存在する場合のみ反映
        // なぜ必要か：castが存在しない場合や、空配列の場合にエラーを防ぐため
        // 
        // Firestoreのフィールド名は「cast」または「casts」の両方に対応
        // （既存データの互換性を保つため）
        const castData = performanceData.cast || performanceData.casts || [];
        if (Array.isArray(castData) && castData.length > 0) {
          setCast(castData.map(c => ({
            name: c.name || "",
            role: c.role || "",
          })));
        } else {
          // castが存在しない場合は、初期値（1人の空キャスト）を維持
          setCast([{ name: "", role: "" }]);
        }

        // ============================================
        // スタッフ情報を反映
        // ============================================
        // 
        // 【重要】staffが配列で存在する場合のみ反映
        // なぜ必要か：staffが存在しない場合や、空配列の場合にエラーを防ぐため
        // 
        // Firestoreのフィールド名は「staff」または「staffs」の両方に対応
        // （既存データの互換性を保つため）
        const staffData = performanceData.staff || performanceData.staffs || [];
        if (Array.isArray(staffData) && staffData.length > 0) {
          setStaff(staffData.map(s => ({
            role: s.role || "",
            name: s.name || "",
          })));
        } else {
          // staffが存在しない場合は、初期値（1人の空スタッフ）を維持
          setStaff([{ role: "", name: "" }]);
        }

        console.log("公演データを取得しました:", performanceData);
      } catch (error) {
        console.error("データ読み込みエラー:", error);
        setError(`データの読み込みに失敗しました: ${error.message}`);
      } finally {
        // なぜfinallyを使うか：エラーが発生しても必ずloadingをfalseにするため
        setLoading(false);
      }
    };

    loadPerformance();
  }, [performanceId]); // performanceIdが変更された場合に再実行

  // ============================================
  // フォーム送信処理（更新）
  // ============================================
  
  /**
   * フォーム送信時の処理（公演データを更新）
   * 
   * @param {Event} e - フォーム送信イベント
   * 
   * 【処理の流れ】
   * 1. フォームのデフォルト動作（ページリロード）を防止
   * 2. バリデーション（必須項目の確認）
   * 3. updateDocを使用してFirestoreの既存ドキュメントを更新
   * 4. updatedAtを追加（createdAtは変更しない）
   * 5. 成功メッセージを表示して、公演一覧ページにリダイレクト
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

    // performanceIdが存在しない場合のエラーハンドリング
    if (!performanceId) {
      setError("公演IDが指定されていません。");
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

      // ============================================
      // 【重要】updateDocを使用して既存ドキュメントを更新
      // ============================================
      // 
      // なぜupdateDocを使うか：
      // - 既存のドキュメントを上書き更新するため
      // - addDoc（新規作成）ではなく、updateDoc（更新）を使うことで、
      //   同じ公演IDのドキュメントに上書き更新されます
      // 
      // なぜcreatedAtを更新しないか：
      // - 作成日時は変更してはいけないため
      // - 更新日時（updatedAt）のみを追加することで、いつ更新されたかが分かります
      // 
      // Firestoreに保存するデータを準備
      // 【重要】createdAtは含めない（既存の値が保持される）
      const updateData = {
        title: title.trim(),                    // 公演タイトル
        thumbnailUrl: thumbnailUrl.trim(),       // サムネイル画像URL
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
        cast: cast.filter(c => c.name.trim() && c.role.trim()), // キャスト情報（空のキャストを除外）
        staff: staff.filter(s => s.name.trim() && s.role.trim()), // スタッフ情報（空のスタッフを除外）
        updatedAt: serverTimestamp(),           // 更新日時（新規追加）
        // 【重要】createdAtは含めない（既存の値が保持される）
      };

      // Firestoreの"performances"コレクションの既存ドキュメントを更新
      const performanceRef = doc(db, "performances", performanceId);
      await updateDoc(performanceRef, updateData);
      
      console.log("公演データを更新しました。ドキュメントID:", performanceId);
      console.log("更新したデータ:", updateData);

      setSuccess("公演を更新しました。");
      
      // 更新成功後、公演一覧ページにリダイレクト
      setTimeout(() => {
        navigate("/troupe/performances");
      }, 1500);
    } catch (error) {
      console.error("公演更新エラー:", error);
      setError(`公演の更新に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // 公演削除処理
  // ============================================
  
  /**
   * 公演を削除する関数
   * 
   * 【処理の流れ】
   * 1. confirmダイアログで削除確認
   * 2. deleteDocを使用してFirestoreのドキュメントを削除
   * 3. 成功メッセージを表示して、公演一覧ページにリダイレクト
   * 
   * 【なぜconfirmが必要か】
   * - 誤って削除することを防ぐため
   * - 削除は不可逆的な操作なので、必ず確認を取る必要があるため
   */
  const handleDelete = async () => {
    // 【重要】confirmダイアログで削除確認
    // ユーザーが「キャンセル」を選択した場合は処理を中断
    if (!window.confirm("この公演を削除しますか？\nこの操作は取り消せません。")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    // 認証チェック
    if (!user || !user.uid) {
      setError("ログインが必要です。");
      setDeleting(false);
      return;
    }

    // Firestore初期化チェック
    if (!db) {
      setError("Firestoreが初期化されていません。");
      setDeleting(false);
      return;
    }

    // performanceIdが存在しない場合のエラーハンドリング
    if (!performanceId) {
      setError("公演IDが指定されていません。");
      setDeleting(false);
      return;
    }

    try {
      // ============================================
      // 【重要】deleteDocを使用してドキュメントを削除
      // ============================================
      // 
      // なぜdeleteDocを使うか：
      // - Firestoreのドキュメントを削除する標準的な方法
      // - ドキュメントIDを指定するだけで削除できる
      // 
      // 注意：
      // - 削除は不可逆的な操作です
      // - サブコレクション（例：reservations）は自動的に削除されません
      //   必要に応じて、関連する予約データも削除する処理を追加する必要があります
      
      const performanceRef = doc(db, "performances", performanceId);
      await deleteDoc(performanceRef);
      
      console.log("公演データを削除しました。ドキュメントID:", performanceId);

      setSuccess("公演を削除しました。");
      
      // 削除成功後、公演一覧ページにリダイレクト
      setTimeout(() => {
        navigate("/troupe/performances");
      }, 1500);
    } catch (error) {
      console.error("公演削除エラー:", error);
      setError(`公演の削除に失敗しました: ${error.message}`);
      setDeleting(false);
    }
  };

  // ============================================
  // UI
  // ============================================

  // データ読み込み中の表示
  // なぜ必要か：データ取得中にユーザーに待機中であることを伝えるため
  if (loading) {
    return (
      <div className="troupe-performance-edit-page">
        <h1>公演編集</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="troupe-performance-edit-page">
      <h1>公演編集</h1>
      <p className="performance-id-info">編集する公演ID：{performanceId}</p>

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

      <form className="performance-edit-form" onSubmit={handleSubmit}>
        
        {/* 基本情報 */}
        <h3>基本情報</h3>

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

        {/* サムネイル画像URL（任意） */}
        <div className="form-field">
          <label className="form-label">
            サムネイル画像URL <span className="optional-badge">任意</span>
          </label>
          <input 
            type="text" 
            placeholder="https://..." 
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
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
        <h3>ステージ日時（複数可）</h3>
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
        <h3>キャスト</h3>
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
              <button 
                type="button" 
                className="remove-btn" 
                onClick={() => removeCast(i)}
              >
                削除
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addCast}>
          ＋ キャスト追加
        </button>

        {/* スタッフ */}
        <h3>スタッフ</h3>
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
              <button 
                type="button" 
                className="remove-btn" 
                onClick={() => removeStaff(i)}
              >
                削除
              </button>
            )}
          </div>
        ))}

        <button type="button" className="add-btn" onClick={addStaff}>
          ＋ スタッフ追加
        </button>

        {/* 更新ボタン */}
        <button type="submit" className="update-btn" disabled={saving}>
          {saving ? "更新中..." : "更新する"}
        </button>

        {/* 削除ボタン */}
        <button 
          type="button" 
          className="delete-btn" 
          onClick={handleDelete}
          disabled={deleting || saving}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: deleting || saving ? "not-allowed" : "pointer",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
            transition: "all 0.25s ease",
            marginTop: "20px",
            opacity: deleting || saving ? 0.6 : 1,
          }}
        >
          {deleting ? "削除中..." : "この公演を削除"}
        </button>

      </form>
    </div>
  );
}

export default TroupePerformanceEditPage;
