/**
 * ============================================
 * PerformanceReservationsPage.jsx - 公演ごとの予約一覧ページ
 * ============================================
 * 
 * 劇団が特定の公演に対する予約状況と残席を確認するページです。
 * 
 * 主な機能：
 * 1. URLパラメータから公演ID（performanceId）を取得
 * 2. Firestoreから該当公演の予約一覧を取得
 * 3. ステージ（日時）ごとに予約人数を合計
 * 4. 席数上限（seatLimit）と比較して残席を算出
 * 5. ステージごとに予約状況を表示
 * 
 * URL: /troupe/performances/:performanceId/reservations
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * PerformanceReservationsPageコンポーネント
 * 
 * @returns {JSX.Element} 公演ごとの予約一覧ページのUI
 * 
 * URLパラメータ：
 * - performanceId: 公演のドキュメントID（Firestoreのperformancesコレクション）
 *   例：/troupe/performances/abc123/reservations → performanceId = "abc123"
 */
export default function PerformanceReservationsPage() {
  // useParams: URLパラメータから公演IDを取得
  // なぜuseParamsを使うか：React RouterでURLパラメータを取得する標準的な方法のため
  // 例：/troupe/performances/abc123/reservations → performanceId = "abc123"
  const { performanceId } = useParams();

  // ============================================
  // 状態管理
  // ============================================
  // useState: コンポーネントの状態を管理するReactフック
  // [値, 値を更新する関数] = useState(初期値)
  
  const [performance, setPerformance] = useState(null);  // 公演データ
  const [reservations, setReservations] = useState([]);  // 予約データの配列
  const [stageStats, setStageStats] = useState([]);     // ステージごとの統計情報
  const [selectedStageId, setSelectedStageId] = useState(null); // 選択されたステージID（予約者一覧を表示するため）
  const [checkedReservations, setCheckedReservations] = useState(new Set()); // 来場チェック済みの予約IDセット
  const [printTargetStageId, setPrintTargetStageId] = useState(null); // 印刷対象のステージID
  const [loading, setLoading] = useState(true);         // データ読み込み中かどうか
  const [error, setError] = useState("");               // エラーメッセージ
  const [savingCheckIn, setSavingCheckIn] = useState(new Set()); // 保存中の予約IDセット（多重クリック防止）

  /**
   * Firestoreから公演データと予約データを読み込む
   * 
   * なぜuseEffectを使うか：
   * - コンポーネントがマウントされた時（ページが表示された時）に一度だけ実行したい処理のため
   * - 非同期処理（Firestoreからのデータ取得）を安全に実行するため
   * 
   * 処理の流れ：
   * 1. performanceIdが存在するか確認
   * 2. Firestoreから公演データ（performances/{performanceId}）を取得
   * 3. 公演データが存在するか確認
   * 4. 該当公演の予約データ（reservationsコレクション）を取得
   * 5. ステージごとに予約人数を集計
   * 6. 残席数を計算
   */
  useEffect(() => {
    let unsubscribeReservations = null; // cleanup 用の unsubscribe 関数

    const loadData = async () => {
      // Firestoreが初期化されているか確認
      // なぜ必要か：Firestoreが初期化されていない状態でクエリを実行するとエラーになるため
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      // performanceIdが存在するか確認
      // なぜ必要か：URLパラメータが正しく取得できていない場合、エラーを表示するため
      if (!performanceId) {
        setError("公演IDが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        // ============================================
        // 1. 公演データを取得
        // ============================================
        // なぜdoc + getDocを使うか：
        // - 特定のドキュメントIDで直接取得するため、効率的で確実
        // - whereクエリよりも高速（インデックス不要）
        // doc(db, "コレクション名", "ドキュメントID")でドキュメント参照を作成
        const performanceDocRef = doc(db, "performances", performanceId);
        // getDocでドキュメントを取得（非同期処理）
        const performanceDocSnap = await getDoc(performanceDocRef);

        // 公演データが存在するか確認
        // なぜ必要か：存在しない公演IDが指定された場合、エラーを表示するため
        if (!performanceDocSnap.exists()) {
          setError("指定された公演が見つかりませんでした。");
          setLoading(false);
          return;
        }

        // 公演データを取得
        // なぜこの形式で取得するか：ドキュメントIDとデータを一緒に管理するため
        const performanceData = {
          id: performanceDocSnap.id,
          ...performanceDocSnap.data(), // スプレッド演算子でデータを展開
        };
        setPerformance(performanceData);
        setLoading(false); // 公演データの取得が完了したら loading を false に

        // ============================================
        // 2. 該当公演の予約データをリアルタイム取得（onSnapshot）
        // ============================================
        // なぜonSnapshotを使うか：
        // - リアルタイム同期により、複数のスタッフが同時に作業しても最新状態を共有できる
        // - 予約の追加・変更・削除が即座に反映される
        // - 来場チェックの状態もリアルタイムで同期される
        const reservationsRef = collection(db, "reservations");
        const reservationsQuery = query(
          reservationsRef,
          where("performanceId", "==", performanceId)
        );
        
        // onSnapshotでリアルタイムリスナーを設定
        // 注意：この unsubscribe は useEffect の cleanup で必ず呼び出す
        unsubscribeReservations = onSnapshot(
          reservationsQuery,
          (snapshot) => {
            // 予約データを配列に変換
            const reservationsData = [];
            const checkedReservationsSet = new Set();
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              const reservationId = doc.id;
              
              reservationsData.push({
                id: reservationId,
                ...data,
              });
              
              // checkedInフィールドをチェック済みセットに追加
              // キャンセル済みの予約はチェックインできないため、activeのみ追加
              if (data.checkedIn === true && data.status !== "cancelled") {
                checkedReservationsSet.add(reservationId);
              }
            });
            
            setReservations(reservationsData);
            setCheckedReservations(checkedReservationsSet);
            
            // ステージ統計を再計算
            // キャンセル済み（status === "cancelled"）の予約は人数集計から除外
            if (performanceData.stages && Array.isArray(performanceData.stages)) {
              const stats = [];
              performanceData.stages.forEach((stage, stageIndex) => {
                // ステージIDが一致し、かつキャンセルされていない予約のみを集計
                const stageReservations = reservationsData.filter(
                  (reservation) => reservation.stageId === stageIndex && reservation.status !== "cancelled"
                );
                const totalReservedPeople = stageReservations.reduce((sum, reservation) => {
                  const people = Number(reservation.people) || 0;
                  return sum + people;
                }, 0);
                const seatLimit = Number(stage.seatLimit) || 0;
                const availableSeats = seatLimit > 0 ? seatLimit - totalReservedPeople : null;
                const isFull = seatLimit > 0 && availableSeats <= 0;
                
                stats.push({
                  stageId: stageIndex,
                  date: stage.date || "",
                  start: stage.start || "",
                  end: stage.end || "",
                  seatLimit: seatLimit,
                  reservedPeople: totalReservedPeople,
                  availableSeats: availableSeats,
                  isFull: isFull,
                });
              });
              setStageStats(stats);
            }
          },
          (error) => {
            console.error("予約データの取得エラー:", error);
            setError(`予約データの取得に失敗しました: ${error.message}`);
          }
        );

        // 注意：ステージ統計の計算は onSnapshot のコールバック内で行う
        // これにより、予約データが更新されるたびに統計も自動的に再計算される
      } catch (error) {
        console.error("データ読み込みエラー:", error);
        setError(`データの読み込みに失敗しました: ${error.message}`);
        setLoading(false);
      }
    };

    loadData();
    
    // cleanup 関数を返す（コンポーネントのアンマウント時にリスナーを解除）
    return () => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }
    };
  }, [performanceId]); // performanceIdが変更されたときに再実行

  /**
   * 日付をフォーマットする関数
   * 
   * @param {string} dateStr - 日付文字列（例："2025-12-03"）
   * @returns {string} フォーマットされた日付文字列（例："2025年12月3日"）
   * 
   * なぜこの関数が必要か：
   * - Firestoreに保存されている日付形式（"YYYY-MM-DD"）を、ユーザーが見やすい形式に変換するため
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      // なぜ"T00:00:00"を追加するか：タイムゾーンを考慮してDateオブジェクトを作成するため
      const date = new Date(dateStr + "T00:00:00");
      // toLocaleDateStringで日本語形式に変換
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateStr; // エラー時は元の文字列を返す
    }
  };

  /**
   * 時間をフォーマットする関数
   * 
   * @param {string} timeStr - 時間文字列（例："14:00"）
   * @returns {string} フォーマットされた時間文字列（例："14:00"）
   * 
   * なぜこの関数が必要か：
   * - 時間の表示形式を統一するため（必要に応じて変換可能）
   */
  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    return timeStr;
  };

  /**
   * 日時（Timestamp）をフォーマットする関数
   * 
   * @param {Timestamp} timestamp - FirestoreのTimestampオブジェクト
   * @returns {string} フォーマットされた日時文字列（例："2025年12月3日 14:30"）
   * 
   * なぜこの関数が必要か：
   * - FirestoreのTimestampをユーザーが見やすい形式に変換するため
   * - 予約日時（createdAt）を表示する際に使用
   */
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    try {
      // FirestoreのTimestampオブジェクトをDateオブジェクトに変換
      // toDate()メソッドでJavaScriptのDateオブジェクトに変換
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      // toLocaleStringで日本語形式に変換
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  /**
   * ステージカードをクリックした時の処理
   * 
   * @param {number} stageId - クリックされたステージのID
   * 
   * 【なぜステージ単位で予約を管理する必要があるのか】
   * - 1つの公演に複数のステージ（日時）が存在するため
   * - 例：同じ公演を3日間開催する場合、各日時ごとに予約を管理する必要がある
   * - 当日の受付・連絡対応では「どのステージ（日時）の予約か」が重要
   * - ステージごとに予約者を確認することで、当日の受付業務がスムーズになる
   * - また、各ステージの席数上限（seatLimit）が異なる場合もあるため、
   *   ステージ単位での管理が必須
   * 
   * 【処理の流れ】
   * 1. クリックされたステージIDをstateに保存
   * 2. そのステージIDに紐づく予約データをフィルタリング
   * 3. 予約者一覧テーブルを表示
   */
  const handleStageClick = (stageId) => {
    // 同じステージをクリックした場合は閉じる（トグル動作）
    if (selectedStageId === stageId) {
      setSelectedStageId(null);
    } else {
      setSelectedStageId(stageId);
    }
  };

  /**
   * 来場チェックのトグル処理（Firestoreに保存）
   * 
   * @param {string} reservationId - チェックする予約のID
   * @param {boolean} currentCheckedState - 現在のチェック状態
   * 
   * 【なぜ来場チェックが必要か】
   * - 当日の受付作業で、来場済みの予約者を記録するため
   * - チェックボックスで視覚的に管理できる
   * - Firestoreに保存することで、複数のスタッフがリアルタイムで共有できる
   * 
   * 【Firestore保存の仕組み】
   * - reservations/{reservationId} ドキュメントを更新
   * - checkedIn: boolean（チェック状態）
   * - checkedInAt: Timestamp（チェックした日時）
   * - updateDocを使用して即時保存（楽観的更新）
   * 
   * 【なぜupdateDocを使うか】
   * - 既存の予約ドキュメントを部分更新するため
   * - checkedInとcheckedInAtフィールドのみを更新し、他のフィールドは保持される
   * - 即時保存により、複数のスタッフが同時に作業しても整合性が保たれる
   * 
   * 【UX改善】
   * - 保存中はチェックボックスを disabled にして多重クリックを防止
   * - エラー時はUIを元に戻してユーザーに分かりやすくフィードバック
   */
  const handleCheckInToggle = async (reservationId, currentCheckedState) => {
    // 多重クリック防止：既に保存中の場合は処理をスキップ
    if (savingCheckIn.has(reservationId)) {
      return;
    }

    const willBeChecked = !currentCheckedState;
    
    // 保存中状態を設定
    setSavingCheckIn((prev) => {
      const next = new Set(prev);
      next.add(reservationId);
      return next;
    });

    // 楽観的更新：UIを先に更新（ユーザー体験を向上）
    const newChecked = new Set(checkedReservations);
    if (willBeChecked) {
      newChecked.add(reservationId);
    } else {
      newChecked.delete(reservationId);
    }
    setCheckedReservations(newChecked);

    // Firestoreに保存
    try {
      if (!db) {
        throw new Error("Firestoreが初期化されていません");
      }

      const reservationRef = doc(db, "reservations", reservationId);
      
      // チェック状態に応じて更新データを準備
      const updateData = willBeChecked
        ? {
            checkedIn: true,
            checkedInAt: serverTimestamp(), // チェックした日時を記録
          }
        : {
            checkedIn: false,
            checkedInAt: null, // チェック解除時は日時をクリア
          };

      await updateDoc(reservationRef, updateData);
      
      console.log(`来場チェックを${willBeChecked ? "有効" : "無効"}にしました:`, reservationId);
    } catch (error) {
      console.error("来場チェックの保存に失敗しました:", error);
      // エラー時はUIを元に戻す（楽観的更新のロールバック）
      const rollbackChecked = new Set(checkedReservations);
      if (willBeChecked) {
        rollbackChecked.delete(reservationId);
      } else {
        rollbackChecked.add(reservationId);
      }
      setCheckedReservations(rollbackChecked);
      alert("来場チェックの保存に失敗しました。もう一度お試しください。");
    } finally {
      // 保存中状態を解除
      setSavingCheckIn((prev) => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  /**
   * ステージごとの印刷処理
   * 
   * @param {number} stageId - 印刷するステージのID
   * 
   * 【なぜ印刷範囲を限定したほうが当日運用で便利なのか】
   * - 当日の受付作業では、各ステージ（日時）ごとに別々の紙を持って立つことが多い
   * - 例：午前のステージ用の紙、午後のステージ用の紙を分けて印刷する
   * - ページ全体を印刷すると、不要な情報（他のステージ）も含まれてしまう
   * - ステージごとに印刷することで：
   *   1. 必要な情報だけを印刷できる（紙の無駄を減らす）
   *   2. 受付時に該当ステージの情報だけを見ればよい（視認性が高い）
   *   3. 複数のスタッフが同時に受付作業をする場合、各ステージごとに分担しやすい
   *   4. 印刷物が軽量になり、持ち運びやすい
   * 
   * 【処理の流れ】
   * 1. 印刷対象のステージIDをstateに保存
   * 2. 印刷ダイアログを開く（window.print()）
   * 3. CSSの@media printで、印刷対象以外のステージを非表示にする
   * 4. 印刷完了後、印刷対象をリセット（オプション）
   */
  const handlePrintStage = (stageId) => {
    // 印刷対象のステージIDを設定
    setPrintTargetStageId(stageId);
    
    // 少し遅延させてから印刷ダイアログを開く
    // （stateの更新が反映されるのを待つため）
    setTimeout(() => {
      window.print();
      // 印刷完了後、印刷対象をリセット（オプション）
      // ユーザーが再度印刷する場合に備えて、リセットしない方が良い場合もある
      // setPrintTargetStageId(null);
    }, 100);
  };


  // ============================================
  // スタイル定義（インラインスタイル）
  // ============================================
  // なぜインラインスタイルを使うか：1ファイルで完結させるため
  
  const styles = {
    page: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
    },
    title: {
      color: "#8b4513",
      marginBottom: "30px",
      fontSize: "2em",
    },
    errorMessage: {
      backgroundColor: "#ffebee",
      color: "#c62828",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid #ef5350",
    },
    performanceInfo: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      marginBottom: "30px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    performanceTitle: {
      marginTop: 0,
      color: "#8b4513",
    },
    performanceVenue: {
      color: "#666",
      marginTop: "8px",
    },
    noDataMessage: {
      padding: "40px",
      textAlign: "center",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      color: "#666",
    },
    stageStatsContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    sectionTitle: {
      color: "#654321",
      marginTop: "30px",
      marginBottom: "20px",
      fontSize: "1.5em",
    },
    stageCard: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "20px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      borderLeft: "4px solid #8b4513",
      cursor: "pointer", // クリック可能であることを示す
      transition: "all 0.2s ease", // ホバー時のアニメーション
    },
    stageCardSelected: {
      backgroundColor: "#fff",
      borderRadius: "8px 8px 0 0", // 展開時は上部のみ角丸
      padding: "20px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      borderLeft: "4px solid #c62828", // 展開時は赤色に変更
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    stageHeader: {
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: "1px solid #e0e0e0",
    },
    stageTitle: {
      color: "#8b4513",
      margin: "0 0 8px 0",
      fontSize: "1.2em",
    },
    stageDatetime: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      color: "#666",
    },
    stageDate: {
      fontWeight: 600,
    },
    stageTime: {
      fontSize: "0.9em",
    },
    stageStats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "16px",
    },
    statItem: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    statLabel: {
      fontSize: "0.9em",
      color: "#666",
      fontWeight: 500,
    },
    statValue: {
      fontSize: "1.2em",
      fontWeight: 600,
      color: "#222", // 【重要】通常色（余裕あり）
    },
    statValueFull: {
      fontSize: "1.2em",
      fontWeight: 600,
      color: "#c62828", // 満席（赤系）
    },
    statValueAvailable: {
      fontSize: "1.2em",
      fontWeight: 600,
      color: "#2e7d32", // 余裕あり（緑系）
    },
    statValueFew: {
      fontSize: "1.2em",
      fontWeight: 600,
      color: "#ff6f00", // 残りわずか（オレンジ系）
    },
    titleContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    titleBadge: {
      display: "inline-block",
      backgroundColor: "#8b4513",
      color: "#fff",
      padding: "4px 12px",
      borderRadius: "16px",
      fontSize: "0.6em",
      fontWeight: 600,
      lineHeight: "1.5",
    },
    titleBadgeNoLimit: {
      display: "inline-block",
      color: "#666",
      fontSize: "0.5em",
      fontWeight: 500,
      fontStyle: "italic",
    },
    reservationsTable: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "#fff",
      borderRadius: "4px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    tableHeader: {
      backgroundColor: "#8b4513",
      color: "#fff", // ヘッダーは白文字（背景が濃い色のため）
      padding: "12px",
      textAlign: "left",
      fontWeight: 600,
      fontSize: "0.9em",
    },
    tableCell: {
      padding: "12px",
      borderBottom: "1px solid #e0e0e0",
      fontSize: "0.9em",
      color: "#222", // 【重要】明示的に黒色を指定（親要素の色に依存しない）
      backgroundColor: "#fff", // 【重要】背景色も明示的に指定（印刷時の可読性を保証）
    },
    tableRow: {
      backgroundColor: "#fff",
    },
    tableRowHover: {
      backgroundColor: "#f5f5f5",
      cursor: "pointer",
    },
    statusBadge: {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "0.85em",
      fontWeight: 600,
    },
    statusActive: {
      backgroundColor: "#4caf50",
      color: "#fff",
    },
    statusCancelled: {
      backgroundColor: "#c62828",
      color: "#fff",
    },
    statusPending: {
      backgroundColor: "#ff9800",
      color: "#fff",
    },
    noReservationsMessage: {
      padding: "40px",
      textAlign: "center",
      color: "#666",
      fontSize: "0.9em",
    },
    printButton: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#8b4513",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "12px 24px",
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      zIndex: 1000,
    },
    checkInCell: {
      textAlign: "center",
      padding: "12px",
      borderBottom: "1px solid #e0e0e0",
      fontSize: "0.9em",
      color: "#222",
      backgroundColor: "#fff",
    },
    checkInCheckbox: {
      width: "20px",
      height: "20px",
      cursor: "pointer",
      // 【重要】チェックボックスの見た目を明示的に指定
      // なぜ必要か：ブラウザやテーマのデフォルトスタイルに依存しないため
      // 未チェック状態は白（空）で枠線のみ表示する
      backgroundColor: "#fff", // 背景は白（空欄に見える）
      border: "1px solid #000", // 枠線は黒
      appearance: "none", // ブラウザのデフォルトスタイルを無効化
      WebkitAppearance: "none", // Safari用
      MozAppearance: "none", // Firefox用
      borderRadius: "2px", // 角丸（任意）
      // チェック済み状態のスタイルは、checked属性で制御される
    },
    printStageButton: {
      backgroundColor: "#8b4513",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "8px",
      transition: "all 0.2s ease",
    },
  };

  // ============================================
  // 全ステージの予約人数と席数上限を集計
  // ============================================
  /**
   * タイトルに表示する「予約済み人数 / 席数上限」のバッジ用データを計算
   * 
   * なぜこの処理が必要か：
   * - 各ステージごとの予約状況は表示されているが、
   *   全体の予約状況を一目で把握できるようにするため
   * - タイトル部分に分数形式で表示することで、ユーザーが素早く状況を把握できるため
   * 
   * 計算ロジック：
   * 1. stageStatsから全ステージの予約人数（reservedPeople）を合計
   * 2. stageStatsから全ステージの席数上限（seatLimit）を合計
   *    - seatLimitが0より大きいもののみを合計（0や未設定は除外）
   * 3. 席数上限が1つも設定されていない場合は、分数バッジを表示せず「（席数上限なし）」と表示
   */
  const totalReservedPeople = stageStats.reduce((sum, stat) => {
    // なぜNumber()で変換するか：型が数値でない場合に備えるため
    const people = Number(stat.reservedPeople) || 0;
    return sum + people;
  }, 0);

  const totalSeatLimit = stageStats.reduce((sum, stat) => {
    // なぜ条件分岐が必要か：seatLimitが0より大きいもののみを合計するため
    // 0や未設定（null/undefined）の場合は除外
    const limit = Number(stat.seatLimit) || 0;
    return limit > 0 ? sum + limit : sum;
  }, 0);

  // 席数上限が1つも設定されていないかどうかを判定
  // なぜ必要か：分数バッジを表示するか、「（席数上限なし）」を表示するかを決めるため
  const hasSeatLimit = totalSeatLimit > 0;

  // ============================================
  // UI
  // ============================================

  // データ読み込み中の表示
  // なぜ必要か：データ取得中にユーザーに待機中であることを伝えるため
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>公演予約一覧</h1>
        </div>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* ============================================
          【印刷用CSS】印刷時の表示を最適化
          ============================================
          
          【なぜ印刷用CSSが必要か】
          - Web表示と印刷表示では、最適なレイアウトが異なる
          - 印刷時は不要なボタンや装飾を非表示にし、可読性を優先する
          - 背景色を白、文字色を黒に統一し、印刷時の可読性を保証する
          - テーブルの罫線を明確にし、印刷時も見やすい構造にする
          
          【@media print の役割】
          - 印刷時にのみ適用されるCSSルールを定義
          - 画面表示と印刷表示を分離して最適化できる
        */}
      <style>
        {`
          @media print {
            /* ============================================
                【印刷UI改善】予約一覧テーブルのみを印刷対象にする
                ============================================
                
                【なぜ予約一覧テーブルのみを印刷するのか】
                - 当日の受付作業では、予約者リスト（テーブル）だけが必要
                - 公演タイトル、ステージカード、統計、ボタンは印刷不要
                - シンプルなリスト形式で印刷することで、受付作業がスムーズになる
            */
            
            /* 印刷しない要素を非表示 */
            .no-print {
              display: none !important;
            }
            
            /* 予約一覧テーブル（.print-area）を表示 */
            .print-area {
              display: block !important;
            }
            
            /* ページ全体の背景を白に */
            body {
              background-color: #fff !important;
              color: #000 !important;
              padding: 20px !important;
            }
            
            /* 印刷用ヘッダーを表示 */
            .print-header {
              display: block !important;
              margin-bottom: 20px !important;
              padding-bottom: 16px !important;
              border-bottom: 2px solid #000 !important;
            }
            
            /* テーブルのスタイルを印刷用に最適化 */
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              page-break-inside: auto !important;
            }
            
            th, td {
              border: 1px solid #000 !important;
              padding: 8px !important;
              color: #000 !important;
              background-color: #fff !important;
            }
            
            th {
              background-color: #f0f0f0 !important;
              color: #000 !important;
              font-weight: bold !important;
            }
            
            td {
              color: #000 !important;
            }
            
            /* チェックボックスの印刷用スタイル */
            input[type="checkbox"].no-print {
              display: none !important;
            }
            
            /* 印刷時用の空欄チェックボックスを表示 */
            .print-checkbox {
              display: inline-block !important;
              width: 20px !important;
              height: 20px !important;
              border: 1px solid #000 !important;
              background-color: #fff !important;
              text-align: center !important;
              line-height: 18px !important;
              font-size: 16px !important;
              color: #000 !important;
            }
            
            /* チェック済みの場合、印刷時にチェックマークを表示 */
            .print-check-mark {
              display: inline !important;
              color: #000 !important;
              font-weight: 600 !important;
              margin-left: 4px !important;
            }
          }
          
          /* ============================================
              【スマホ対応】画面幅が狭い場合のスタイル調整
              ============================================
              
              【なぜスマホ対応が必要か】
              - 当日の受付作業では、スマホやタブレットで確認することもある
              - テーブルは横スクロールを許可し、文字が潰れないようにする
              - フォントサイズとパディングを調整して、可読性を保つ
              
              【実装方針】
              - @media (max-width: 768px) でスマホ用スタイルを定義
              - テーブルは横スクロール（overflow-x: auto）を許可
              - フォントサイズとパディングを調整
          */
          @media (max-width: 768px) {
            /* ページ全体のパディングを調整 */
            .troupe-performance-reservations-page {
              padding: 16px 12px !important;
            }
            
            /* タイトルのフォントサイズを調整 */
            .troupe-performance-reservations-page h1 {
              font-size: 1.5em !important;
            }
            
            /* ステージカードのパディングを調整 */
            .stage-card-container {
              padding: 12px !important;
            }
            
            /* テーブルの横スクロールを許可 */
            .reservations-table-wrapper {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            
            /* テーブルのフォントサイズを調整 */
            table {
              font-size: 0.85em !important;
            }
            
            th, td {
              padding: 8px 6px !important;
              font-size: 0.85em !important;
            }
            
            /* チェックボックスのサイズを調整 */
            input[type="checkbox"].check-in-checkbox {
              width: 18px !important;
              height: 18px !important;
            }
            
            /* ボタンのサイズを調整 */
            button {
              padding: 10px 16px !important;
              font-size: 14px !important;
            }
          }
          
          /* ============================================
              【チェックボックスの見た目】Web表示用
              ============================================
              
              【なぜチェックボックスの見た目を明示指定する必要があるのか】
              - ブラウザやテーマのデフォルトスタイルに依存しないため
              - 未チェック状態は白（空）で枠線のみ表示する
              - Web表示・印刷表示の両方で「空欄のチェック欄」に見えることを保証する
              - 手書きチェックされることを想定した見た目にする
          */
          input[type="checkbox"].check-in-checkbox {
            width: 20px !important;
            height: 20px !important;
            background-color: #fff !important;
            border: 1px solid #000 !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            border-radius: 2px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          
          /* チェック済みのチェックボックス */
          input[type="checkbox"].check-in-checkbox:checked {
            background-color: #4caf50 !important;
            border-color: #4caf50 !important;
            position: relative !important;
          }
          
          input[type="checkbox"].check-in-checkbox:checked::after {
            content: "✓" !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            color: #fff !important;
            font-size: 14px !important;
            font-weight: bold !important;
          }
          
          /* 無効化（disabled）状態のスタイル */
          input[type="checkbox"].check-in-checkbox:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
          }
          
          /* ホバー時のスタイル（無効化時は適用しない） */
          input[type="checkbox"].check-in-checkbox:hover:not(:disabled) {
            border-color: #666 !important;
          }
        `}
      </style>
      
      <div style={styles.page}>
      <div style={styles.titleContainer} className="no-print">
        <h1 style={styles.title}>公演予約一覧</h1>
        {/* 
          【追加機能】予約済み人数 / 席数上限のバッジ表示
          なぜこの位置に表示するか：タイトル右側に小さなバッジとして表示することで、
          既存デザインを壊さずに情報を追加するため
        */}
        {!error && performance && (
          <>
            {hasSeatLimit ? (
              <span style={styles.titleBadge}>
                【{totalReservedPeople} / {totalSeatLimit}】
              </span>
            ) : (
              <span style={styles.titleBadgeNoLimit}>
                （席数上限なし）
              </span>
            )}
          </>
        )}
      </div>

      {/* エラーメッセージ表示 */}
      {error && (
        <div style={styles.errorMessage} className="no-print">
          {error}
        </div>
      )}

      {/* 
        【修正箇所1】真っ暗になる原因を解決
        なぜ真っ暗になっていたのか：
        - 元のコードでは「!error && performance && ...」という条件で、
          performanceがnullの場合、何も表示されませんでした
        - Firestoreからデータを取得できなかった場合や、
          エラーが発生したがsetErrorが呼ばれなかった場合に、
          errorが空でperformanceがnullの状態になり、画面が真っ暗になっていました
        - 修正後：performanceがnullの場合でも、エラーメッセージを表示するようにしました
      */}
      {!error && !performance && (
        <div style={styles.errorMessage} className="no-print">
          公演データが見つかりませんでした。URLを確認してください。
        </div>
      )}

      {/* 公演情報表示 */}
      {!error && performance && (
        <div style={styles.performanceInfo} className="no-print">
          <h2 style={styles.performanceTitle}>
            {performance.title || "タイトル未設定"}
          </h2>
          {performance.venue && (
            <p style={styles.performanceVenue}>会場: {performance.venue}</p>
          )}
        </div>
      )}

      {/* 
        【修正箇所2】ステージ情報がない場合の表示
        なぜ必要か：ステージ情報が登録されていない場合に、ユーザーに分かりやすく伝えるため
      */}
      {!error && performance && (!performance.stages || performance.stages.length === 0) && (
        <div style={styles.noDataMessage} className="no-print">
          <p>この公演にはステージ情報が登録されていません。</p>
        </div>
      )}

      {/* 
        【修正箇所3】予約データが0件の場合の表示を追加
        なぜ必要か：
        - 予約データが0件でも、ステージ情報があればstageStatsは生成されますが、
          すべてのステージで予約人数が0人になります
        - ユーザーに「予約がありません」ということを明確に伝えるため
      */}
      {!error && performance && stageStats.length > 0 && reservations.length === 0 && (
        <div style={styles.noDataMessage} className="no-print">
          <p>この公演にはまだ予約がありません。</p>
        </div>
      )}

      {/* ステージごとの予約状況表示 */}
      {!error && performance && stageStats.length > 0 && (
        <div style={styles.stageStatsContainer}>
          <h2 style={styles.sectionTitle} className="no-print">ステージごとの予約状況</h2>
          
          {stageStats.map((stat) => {
            // このステージが展開されているかどうか
            const isExpanded = selectedStageId === stat.stageId;
            // このステージに紐づく予約データを取得
            // 【Firestoreクエリの意図】
            // - where("performanceId", "==", performanceId):
            //   対象の公演IDに紐づく予約だけを取得するため
            //   全公演の予約を取得してからフィルタリングするよりも効率的
            // 
            // - where("stageId", "==", stat.stageId):
            //   このステージIDに紐づく予約だけを取得するため
            //   ステージごとに予約を分けて表示するために必要
            // 
            // 注意：現在の実装では、すでに取得済みのreservations配列から
            // フィルタリングしていますが、将来的にFirestoreクエリで直接
            // 絞り込むことも可能です。
            const stageReservations = reservations.filter(
              (reservation) => reservation.stageId === stat.stageId
            );

            return (
              <div
                key={stat.stageId}
                className={`stage-card-container ${
                  printTargetStageId === stat.stageId ? "print-target" : ""
                }`}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden", // 角丸を維持するため
                }}
              >
                {/* ============================================
                    【アコーディオン構造】ステージカード（クリック可能なヘッダー部分）
                    ============================================
                    
                    【なぜステージ直下に予約一覧を置くほうが管理UIとして適切なのか】
                    - 当日の受付・確認作業では「どのステージ（日時）の予約か」が最重要情報
                    - ステージカードと予約者一覧が別カード・別ブロックに分離されていると、
                      視線移動が多くなり、対応関係を把握するのに時間がかかる
                    - ステージカード直下に予約者一覧を配置することで：
                      1. ステージと予約の対応関係が一目で分かる（視線移動が少ない）
                      2. 印刷時も1つのブロックとして扱える（視認性が高い）
                      3. アコーディオン構造により、必要な情報だけを展開できる（UIが整理される）
                      4. 将来、チェックイン機能や印刷機能を追加する際も、ステージ単位で処理しやすい
                    
                    【アコーディオン構造の利点】
                    - 閉じた状態：ステージの概要（日時・予約人数・残席）だけを表示
                    - 開いた状態：ステージの詳細（予約者一覧）を直下に表示
                    - これにより、UIが整理され、必要な情報に素早くアクセスできる
                */}
                <div
                  onClick={() => handleStageClick(stat.stageId)}
                  className="no-print"
                  style={{
                    ...(isExpanded ? styles.stageCardSelected : styles.stageCard),
                    marginBottom: 0, // カード間の余白を削除
                    borderRadius: isExpanded ? "8px 8px 0 0" : "8px", // 展開時は上部のみ角丸
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                    }
                  }}
                >
                  <div style={styles.stageHeader}>
                    <h3 style={styles.stageTitle}>
                      ステージ {stat.stageId + 1}
                      {isExpanded && " ▼"}
                      {!isExpanded && " ▶"}
                    </h3>
                    <div style={styles.stageDatetime}>
                      {/* 日付表示 */}
                      <span style={styles.stageDate}>
                        {formatDate(stat.date)}
                      </span>
                      {/* 開始時間表示 */}
                      <span style={styles.stageTime}>
                        {formatTime(stat.start)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.stageStats}>
                    {/* ============================================
                        【合計人数の色分け表示】予約人数 / 定員
                        ============================================
                        
                        【色分けルール】
                        - 余裕あり（残席6席以上、または上限なし）→ 通常色（黒 #222）
                        - 残りわずか（残席1〜5席）→ オレンジ系（#ff6f00）
                        - 満席（残席0以下）→ 赤系（#c62828）
                        
                        【なぜ色分けが必要か】
                        - 当日の受付・確認作業では、残席状況を素早く把握する必要がある
                        - 色分けにより、視覚的に状況を判断できる（事実が一目で分かる）
                        - 劇団側管理UIとして、数値だけでなく状態も視覚的に伝える
                    */}
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>予約人数:</span>
                      {stat.seatLimit > 0 ? (
                        <span
                          style={{
                            ...styles.statValue,
                            ...(stat.isFull
                              ? styles.statValueFull
                              : stat.availableSeats > 0 && stat.availableSeats <= 5
                              ? styles.statValueFew
                              : {}),
                          }}
                        >
                          {stat.reservedPeople} / {stat.seatLimit}人
                        </span>
                      ) : (
                        <span style={styles.statValue}>
                          {stat.reservedPeople}人（上限なし）
                        </span>
                      )}
                    </div>

                    {/* 残席表示 */}
                    {stat.seatLimit > 0 ? (
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>残席:</span>
                        {stat.isFull ? (
                          <span style={styles.statValueFull}>満席</span>
                        ) : (
                          <span
                            style={{
                              ...(stat.availableSeats <= 5
                                ? styles.statValueFew
                                : styles.statValueAvailable),
                            }}
                          >
                            {stat.availableSeats}席
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={styles.statItem}>
                        <span style={styles.statLabel}>残席:</span>
                        <span style={styles.statValue}>-</span>
                      </div>
                    )}
                    
                    {/* ============================================
                        【ステージごとの印刷ボタン】このステージを印刷
                        ============================================
                        
                        【なぜ印刷範囲を限定したほうが当日運用で便利なのか】
                        - 当日の受付作業では、各ステージ（日時）ごとに別々の紙を持って立つことが多い
                        - 例：午前のステージ用の紙、午後のステージ用の紙を分けて印刷する
                        - ページ全体を印刷すると、不要な情報（他のステージ）も含まれてしまう
                        - ステージごとに印刷することで：
                          1. 必要な情報だけを印刷できる（紙の無駄を減らす）
                          2. 受付時に該当ステージの情報だけを見ればよい（視認性が高い）
                          3. 複数のスタッフが同時に受付作業をする場合、各ステージごとに分担しやすい
                          4. 印刷物が軽量になり、持ち運びやすい
                    */}
                    <button
                      onClick={() => handlePrintStage(stat.stageId)}
                      style={styles.printStageButton}
                      className="no-print"
                    >
                      📄 このステージを印刷
                    </button>
                  </div>
                </div>

                {/* ============================================
                    【アコーディオン構造】予約者一覧（展開時に表示されるコンテンツ部分）
                    ============================================
                    
                    【なぜステージ単位で予約を管理する必要があるのか】
                    - 1つの公演に複数のステージ（日時）が存在するため
                    - 例：同じ公演を3日間開催する場合、各日時ごとに予約を管理する必要がある
                    - 当日の受付・連絡対応では「どのステージ（日時）の予約か」が重要
                    - ステージごとに予約者を確認することで、当日の受付業務がスムーズになる
                    - また、各ステージの席数上限（seatLimit）が異なる場合もあるため、
                      ステージ単位での管理が必須
                */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#fafafa",
                      borderTop: "1px solid #e0e0e0",
                    }}
                  >
                    {/* ============================================
                        【印刷用ヘッダー】公演情報と印刷例文
                        ============================================
                        
                        【なぜ印刷用ヘッダーが必要か】
                        - 印刷した紙を当日の受付で使う際、公演名・日時・会場名が分かるようにする
                        - 印刷例文により、このリストの用途を明確にする
                        - 印刷時のみ表示され、Web表示時は非表示
                    */}
                    <div className="print-header" style={{ display: "none" }}>
                      <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "bold", color: "#000" }}>
                        公演名：{performance?.title || "タイトル未設定"}
                      </h2>
                      <div style={{ marginBottom: "8px", fontSize: "16px", color: "#000" }}>
                        日時：{formatDate(stat.date)} {formatTime(stat.start)}
                      </div>
                      {performance?.venue && (
                        <div style={{ marginBottom: "16px", fontSize: "16px", color: "#000" }}>
                          会場：{performance.venue}
                        </div>
                      )}
                      <div
                        style={{
                          marginBottom: "16px",
                          padding: "8px",
                          border: "1px solid #000",
                          fontSize: "14px",
                          color: "#000",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        ※このリストは当日の受付確認用です。
                      </div>
                    </div>
                    
                    {stageReservations.length === 0 ? (
                      <div style={styles.noReservationsMessage}>
                        <p>このステージの予約はまだありません。</p>
                      </div>
                    ) : (
                      <div className="print-area">
                        <div style={{ overflowX: "auto" }} className="reservations-table-wrapper">
                          <table style={styles.reservationsTable} className="reservations-table">
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>来場</th>
                            <th style={styles.tableHeader}>氏名</th>
                            <th style={styles.tableHeader}>メールアドレス</th>
                            <th style={styles.tableHeader}>人数</th>
                            <th style={styles.tableHeader}>備考</th>
                            <th style={styles.tableHeader}>予約日時</th>
                            <th style={styles.tableHeader}>ステータス</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stageReservations.map((reservation, index) => {
                            const reservationId = reservation.id || `temp-${index}`;
                            const isChecked = checkedReservations.has(reservationId);
                            const isSaving = savingCheckIn.has(reservationId); // 保存中かどうか
                            const isCancelled = reservation.status === "cancelled"; // キャンセル済みかどうか
                            
                            return (
                              <tr
                                key={reservationId}
                                style={{
                                  ...styles.tableRow,
                                  backgroundColor: isChecked ? "#e8f5e9" : isCancelled ? "#f5f5f5" : "#fff", // チェック済みは薄い緑背景、キャンセル済みはグレー背景
                                  opacity: isCancelled ? 0.7 : 1, // キャンセル済みは少し薄く表示
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChecked && !isCancelled) {
                                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChecked) {
                                    e.currentTarget.style.backgroundColor = isCancelled ? "#f5f5f5" : "#fff";
                                  }
                                }}
                              >
                                {/* ============================================
                                    【来場チェック列】受付作業用
                                    ============================================
                                    
                                    【なぜ来場チェックが必要か】
                                    - 当日の受付作業で、来場済みの予約者を記録するため
                                    - チェックボックスで視覚的に管理できる
                                    - 将来的にFirestoreに保存して、リアルタイムで共有することも可能
                                */}
                                {/* ============================================
                                    【来場チェック列】受付作業用
                                    ============================================
                                    
                                    【なぜ来場チェックが必要か】
                                    - 当日の受付作業で、来場済みの予約者を記録するため
                                    - チェックボックスで視覚的に管理できる
                                    - 将来的にFirestoreに保存して、リアルタイムで共有することも可能
                                    
                                    【チェックボックスの見た目について】
                                    - 未チェック状態は白（空）で枠線のみ表示
                                    - ブラウザやテーマのデフォルトスタイルに依存しない
                                    - Web表示・印刷表示の両方で「空欄のチェック欄」に見えることを保証
                                    - 手書きチェックされることを想定した見た目にする
                                */}
                                <td style={styles.checkInCell}>
                                  {/* Web表示用のチェックボックス */}
                                  {/* 【重要】onChangeでFirestoreに保存 */}
                                  {/* 保存中は disabled にして多重クリックを防止 */}
                                  {/* キャンセル済みの予約はチェックインできないため disabled */}
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isSaving || isCancelled}
                                    onChange={() => handleCheckInToggle(reservationId, isChecked)}
                                    className="check-in-checkbox no-print"
                                  />
                                  {/* Web表示時のチェック済みマーク */}
                                  {isChecked && (
                                    <span
                                      className="no-print"
                                      style={{
                                        color: "#2e7d32",
                                        fontWeight: 600,
                                        marginLeft: "4px",
                                      }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                  {/* 印刷時用の空欄チェックボックス（手書きチェック用） */}
                                  {/* 未チェックの場合は空欄の四角、チェック済みの場合はチェックマーク */}
                                  {!isChecked ? (
                                    <span className="print-checkbox">☐</span>
                                  ) : (
                                    <span className="print-check-mark">✓</span>
                                  )}
                                </td>
                                {/* ============================================
                                    【重要】テーブルセルの文字色を明示的に指定
                                    ============================================
                                    
                                    【なぜ文字色を明示指定する必要があるのか】
                                    - CSSの継承により、親要素（body）の色（#fff）が適用される可能性がある
                                    - 親要素のスタイル変更に影響されないよう、明示的に指定する必要がある
                                    - Web表示と印刷表示の両方で可読性を保証するため
                                    - テーブル内のテキストは必ず黒色（#222）で表示し、背景と同化しないようにする
                                */}
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.name || "-"}
                                </td>
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.email || "-"}
                                </td>
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.people || 0}人
                                </td>
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.note || "-"}
                                </td>
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.createdAt
                                    ? formatDateTime(reservation.createdAt)
                                    : "-"}
                                </td>
                                <td style={{ ...styles.tableCell, color: "#222" }}>
                                  {reservation.status ? (
                                    <span
                                      style={{
                                        ...styles.statusBadge,
                                        ...(reservation.status === "active" ||
                                        reservation.status === "confirmed"
                                          ? styles.statusActive
                                          : reservation.status === "cancelled"
                                          ? styles.statusCancelled
                                          : styles.statusPending),
                                      }}
                                    >
                                      {reservation.status === "active" ||
                                      reservation.status === "confirmed"
                                        ? "確定"
                                        : reservation.status === "cancelled"
                                        ? "キャンセル"
                                        : reservation.status === "pending"
                                        ? "保留"
                                        : reservation.status}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        ...styles.statusBadge,
                                        ...styles.statusActive,
                                      }}
                                    >
                                      確定
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}

