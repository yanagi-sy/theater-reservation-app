/**
 * ============================================
 * TroupePerformancesPage.jsx - 公演一覧ページ（管理用）
 * ============================================
 * 
 * 劇団が作成した公演の一覧を表示し、各公演の編集・予約一覧への導線を提供するページです。
 * 
 * 主な機能：
 * 1. 公演一覧の表示
 * 2. 各公演の「編集」ボタン（公演編集ページへの遷移）
 * 3. 各公演の「予約一覧」ボタン（予約一覧ページへの遷移）
 * 4. 各公演の予約人数と席数上限の表示
 */

// src/pages/troupe/TroupePerformancesPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import "./TroupePerformancesPage.css";

// ============================================
// 予約人数・席数上限の集計関数
// ============================================
// 
// これらの関数は、劇団側UI・観客側UIの両方で使用可能な汎用的な集計ロジックです。
// 

/**
 * 予約人数の合計を計算する関数
 * 
 * @param {Array} reservations - 予約データの配列
 *  各要素は { people: number } の形式
 *  例：[{ people: 2 }, { people: 3 }, { people: 2 }]
 * 
 * @returns {number} 合計予約人数
 *  例：7（上記の例の場合）
 * 
 * 処理内容：
 * - 全予約データのpeople（予約人数）を合計する
 * - 例：予約1（2人）+ 予約2（3人）+ 予約3（2人）= 合計7人
 * 
 * なぜforEachを使うか：
 * - 配列の各要素を順番に処理するため
 * - シンプルで読みやすいコードになるため
 * - reduceを使うこともできるが、この場合はforEachの方が直感的
 * 
 * なぜNumber()で変換するか：
 * - Firestoreから取得した値が文字列の場合があるため
 * - 型が数値でない場合に備えるため
 * 
 * なぜ || 0 を使うか：
 * - peopleが未定義やnullの場合、0として扱うため
 * - 数値変換に失敗した場合も0として扱うため
 * 
 * 使用例：
 *   const reservations = [
 *     { people: 2 },
 *     { people: 3 },
 *     { people: 2 }
 *   ];
 *   const total = getTotalReservedPeople(reservations); // 7
 */
export function getTotalReservedPeople(reservations) {
  // 引数の検証：配列でない場合は0を返す
  if (!Array.isArray(reservations)) {
    return 0;
  }

  let total = 0; // 合計予約人数を格納する変数（初期値は0）

  reservations.forEach((reservation) => {
    // 予約人数を数値に変換（失敗時は0）
    const people = Number(reservation?.people) || 0;
    
    // 合計に加算
    total += people;
  });

  return total;
}

/**
 * 席数上限の合計を計算する関数
 * 
 * @param {Array} stages - ステージデータの配列
 *  各要素は { seatLimit: number } の形式
 *  例：[
 *        { seatLimit: 20 },
 *        { seatLimit: 0 },      // 上限なし（除外される）
 *        { seatLimit: 30 }
 *      ]
 * 
 * @returns {number} 合計席数上限
 *  例：50（上記の例の場合、上限なしのステージは除外される）
 * 
 * 処理内容：
 * - stages配列から、各ステージのseatLimit（席数上限）を合計する
 * - 例：ステージ1（20席）+ ステージ2（20席）= 合計40席
 * 
 * なぜforEachを使うか：
 * - 配列の各要素を順番に処理するため
 * - 条件分岐（seatLimit > 0）を含む処理なので、forEachの方が読みやすい
 * - reduceを使うこともできるが、条件分岐が複雑になるためforEachを選択
 * 
 * なぜseatLimit > 0 のみ合計するのか：
 * - 0や未設定（null/undefined）の場合は「上限なし」を意味するため
 * - 上限なしのステージを合計に含めると、意味のない数値になってしまうため
 * - 例：ステージ1（20席）+ ステージ2（上限なし）+ ステージ3（30席）
 *    → 合計は50席（ステージ2は除外）
 *    → もしステージ2を含めると「50 / 50」となり、上限なしの意味が失われる
 * - UIでは「（予約人数 / 制限なし）」と表示するため、合計計算から除外する
 * 
 * 使用例：
 *   const stages = [
 *     { seatLimit: 20 },
 *     { seatLimit: 0 },      // 上限なし
 *     { seatLimit: 30 }
 *   ];
 *   const total = getTotalSeatLimit(stages); // 50
 */
export function getTotalSeatLimit(stages) {
  // 引数の検証：配列でない場合は0を返す
  if (!Array.isArray(stages)) {
    return 0;
  }

  let total = 0; // 合計席数上限を格納する変数（初期値は0）

  stages.forEach((stage) => {
    // 席数上限を数値に変換（失敗時は0）
    const limit = Number(stage?.seatLimit) || 0;
    
    // 0より大きい場合のみ合計に加算
    // なぜ条件分岐が必要か：上限なし（0または未設定）のステージは除外するため
    if (limit > 0) {
      total += limit;
    }
  });

  return total;
}

/**
 * 予約状況を状態で返す関数（観客側UI専用）
 * 
 * 【重要】この関数は観客側UIでのみ使用します。
 * 劇団側UIでは使用しません。
 * 劇団側UIでは、数値のみを事実として表示し、状態判定は行いません。
 * 
 * @param {number} totalReservedPeople - 合計予約人数
 *   getTotalReservedPeople()関数の結果を使用
 * 
 * @param {number} totalSeatLimit - 合計席数上限
 *   getTotalSeatLimit()関数の結果を使用
 *   0の場合は「上限なし」を意味する
 * 
 * @returns {"available" | "few" | "full"} 予約状況の状態
 *   - "available": 予約可能（残席が十分にある、または上限なし）
 *   - "few": 残りわずか（残席が5席以下だが、まだ予約可能）
 *   - "full": 満席（残席が0以下）
 * 
 * 判定ロジック：
 * 1. "full"（満席）：
 *    - 条件：席数上限が設定されており、残席数が0以下
 *    - 判定式：totalSeatLimit > 0 && (totalSeatLimit - totalReservedPeople) <= 0
 *    - 意味：予約ボタンを無効化または非表示する必要がある
 * 
 * 2. "few"（残りわずか）：
 *    - 条件：席数上限が設定されており、残席数が1以上5以下
 *    - 判定式：totalSeatLimit > 0 && (totalSeatLimit - totalReservedPeople) > 0 && (totalSeatLimit - totalReservedPeople) <= 5
 *    - 意味：視覚的に注意喚起するが、予約は可能
 * 
 * 3. "available"（予約可能）：
 *    - 条件：上記以外（残席が6席以上、または上限なし）
 *    - 判定式：totalSeatLimit === 0 || (totalSeatLimit - totalReservedPeople) > 5
 *    - 意味：通常通り予約可能
 * 
 * 使用例：
 *   const totalPeople = getTotalReservedPeople(reservations); // 7
 *   const totalLimit = getTotalSeatLimit(stages); // 20
 *   const status = getReservationStatus(totalPeople, totalLimit); // "available"
 * 
 *   // 満席の場合
 *   const status1 = getReservationStatus(20, 20); // "full"
 * 
 *   // 残りわずかの場合
 *   const status2 = getReservationStatus(16, 20); // "few" (残席4席)
 * 
 *   // 上限なしの場合
 *   const status3 = getReservationStatus(10, 0); // "available"
 * 
 * 【実装時の注意点】
 * - この関数は観客側UIのコンポーネント内で使用する
 * - 返り値に基づいて、UIの表示や予約ボタンの有効/無効を制御する
 * - 劇団側UIでは使用しない（劇団側UIでは数値のみを表示）
 */
export function getReservationStatus(totalReservedPeople, totalSeatLimit) {
  // 引数の検証：数値でない場合は"available"を返す（安全なデフォルト値）
  const reserved = Number(totalReservedPeople) || 0;
  const limit = Number(totalSeatLimit) || 0;

  // 上限なしの場合（limit === 0）は常に"available"
  if (limit === 0) {
    return "available";
  }

  // 残席数を計算
  const availableSeats = limit - reserved;

  // 満席の場合（残席が0以下）
  if (availableSeats <= 0) {
    return "full";
  }

  // 残りわずかの場合（残席が1以上5以下）
  if (availableSeats <= 5) {
    return "few";
  }

  // それ以外（残席が6席以上）は予約可能
  return "available";
}

// ============================================
// 観客側UI専用の仕様（メモ）
// ============================================
// 
// 【重要】以下の仕様は観客側UIでのみ使用します。
// 劇団側UIでは使用しません。
// 
// 観客側UIでは、予約状況を視覚的に分かりやすく表示するため、
// 以下の状態を判定して表示します：
// 
// 1. 【満席】
//    - 条件：席数上限が設定されており、残席数が0以下
//    - 判定式：totalSeatLimit > 0 && (totalSeatLimit - totalReservedPeople) <= 0
//    - 表示：視覚的に強調（例：赤色、太字など）
//    - 動作：予約ボタンを無効化または非表示
// 
// 2. 【残りわずか】
//    - 条件：席数上限が設定されており、残席数が一定数以下（例：5席以下）
//    - 判定式：totalSeatLimit > 0 && (totalSeatLimit - totalReservedPeople) <= 5
//    - 表示：視覚的に注意喚起（例：オレンジ色、警告アイコンなど）
//    - 動作：予約ボタンは有効（通常通り予約可能）
// 
// 3. 【予約不可状態】
//    - 条件：以下のいずれかに該当する場合
//      a) 満席の場合
//      b) 公演が終了している場合
//      c) 予約受付期間外の場合
//      d) その他の理由で予約を受け付けていない場合
//    - 表示：予約ボタンを無効化または非表示、理由を表示
//    - 動作：予約ボタンをクリックできない状態
// 
// 【実装時の注意点】
// - これらの判定ロジックは、観客側UIのコンポーネント内で実装する
// - 集計関数（getTotalReservedPeople, getTotalSeatLimit）の結果を使用して判定する
// - 劇団側UIでは、これらの状態判定は行わず、数値のみを事実として表示する
// 
// 【実装予定の場所】
// - 観客側UIの公演一覧ページ（StageListPage.jsx）
// - 観客側UIの公演詳細ページ（StageDetailPage.jsx）
// - その他、予約状況を表示する観客側UIのコンポーネント
// 
// ============================================

function TroupePerformancesPage() {
  const { user } = useAuth();
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Firestoreから公演データと予約人数を読み込む
   * 
   * なぜuseEffectを使うか：
   * - コンポーネントがマウントされた時（ページが表示された時）に一度だけ実行したい処理のため
   * - 非同期処理（Firestoreからのデータ取得）を安全に実行するため
   * 
   * 処理の流れ：
   * 1. ログインしている劇団のtroupeIdを取得
   * 2. Firestoreから該当劇団の公演データ（performancesコレクション）を取得
   * 3. 各公演に対して、予約データ（reservationsコレクション）を取得して人数を集計
   * 4. 各公演のstagesからseatLimitを集計
   */
  useEffect(() => {
    const loadPerformances = async () => {
      // Firestoreが初期化されているか確認
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      // ユーザーがログインしているか確認
      // 【修正内容】修正前：userがnullの場合にエラーを表示して終了
      // 修正後：userがnullでもデータ取得を試みる（一時的な切り分け）
      // なぜ必要か：まず全部表示できるようにして、問題を切り分けるため
      if (!user) {
        console.warn("ユーザーがログインしていません。全公演を表示します。");
        // 一時的にエラーを表示せず、全公演を取得する
        // setError("ログインが必要です。");
        // setLoading(false);
        // return;
      }

      try {
        setLoading(true);
        setError("");

        // ============================================
        // 【Firestoreから取得するデータ その1】劇団ID（troupeId）を取得
        // ============================================
        // 
        // 取得元：troupesコレクション
        // 取得条件：uid（Firebase認証のユーザーID）が現在ログインしているユーザーと一致するもの
        // 取得内容：劇団のドキュメントID（troupeId）
        // 
        // なぜ必要か：
        // - ログインしている劇団の公演だけを取得するため
        // - 他の劇団の公演を表示しないようにするため
        // 
        // データ構造の例：
        // troupes/{troupeId}
        //   - uid: "firebase認証のユーザーID"
        //   - troupeName: "劇団名"
        //   - ...その他の劇団情報
        const troupesQuery = query(
          collection(db, "troupes"),  // troupesコレクションを指定
          where("uid", "==", user.uid) // uidが現在のユーザーIDと一致するものを検索
        );
        const troupesSnapshot = await getDocs(troupesQuery); // クエリを実行してデータを取得

        // 劇団データが見つからない場合のエラーハンドリング
        // 【修正内容】修正前：劇団データが見つからない場合にエラーを表示して終了
        // 修正後：一時的に全公演を表示する（切り分け用）
        let troupeId = null;
        if (troupesSnapshot.empty) {
          console.warn("劇団データが見つかりませんでした。全公演を表示します。");
          // 一時的にエラーを表示せず、全公演を取得する
          // setError("劇団データが見つかりませんでした。");
          // setLoading(false);
          // return;
        } else {
          // 取得した劇団ドキュメントのIDをtroupeIdとして保存
          // なぜdocs[0]を使うか：uidは一意なので、検索結果は1件のはず
          troupeId = troupesSnapshot.docs[0].id;
        }

        // ============================================
        // 【Firestoreから取得するデータ その2】該当劇団の公演データを取得
        // ============================================
        // 
        // 取得元：performancesコレクション
        // 取得条件：troupeIdが上で取得した劇団IDと一致するもの
        // 取得内容：公演の全データ（タイトル、会場、ステージ情報など）
        // ソート：createdAt（作成日時）の降順（新しい順）
        // 
        // 【修正内容】修正前：orderBy("createdAt", "desc")を使用
        // 修正後：createdAtが存在しない場合のエラーハンドリングを追加
        // なぜ必要か：createdAtフィールドが存在しない場合、orderByでエラーになるため
        // 
        // なぜquery + whereを使うか：
        // - 特定の劇団ID（troupeId）に紐づく公演だけを取得するため
        // - 全公演を取得してからフィルタリングするよりも効率的（ネットワーク転送量を削減）
        // 
        // データ構造の例：
        // performances/{performanceId}
        //   - troupeId: "劇団ID"
        //   - title: "公演タイトル"
        //   - venue: "会場名"
        //   - stages: [
        //       { date: "2025-12-01", start: "14:00", end: "16:00", seatLimit: 20 },
        //       { date: "2025-12-02", start: "14:00", end: "16:00", seatLimit: 20 }
        //     ]
        //   - createdAt: Timestamp（作成日時）※存在しない場合もある
        // 
        let performancesSnapshot;
        
        // 【修正内容】troupeIdがnullの場合（劇団データが見つからない場合）の処理
        if (!troupeId) {
          // 一時的に全公演を取得（切り分け用）
          try {
            const performancesQuery = query(
              collection(db, "performances"),
              orderBy("createdAt", "desc")
            );
            performancesSnapshot = await getDocs(performancesQuery);
          } catch (orderByError) {
            console.warn("createdAtでのソートに失敗しました。全公演を取得します:", orderByError);
            // ソートなしで全公演を取得
            const performancesQuery = query(collection(db, "performances"));
            performancesSnapshot = await getDocs(performancesQuery);
          }
        } else {
          // troupeIdが存在する場合：該当劇団の公演のみを取得
          try {
            // createdAtでソートを試みる
            const performancesQuery = query(
              collection(db, "performances"),  // performancesコレクションを指定
              where("troupeId", "==", troupeId), // troupeIdが一致するものを検索
              orderBy("createdAt", "desc")      // 作成日時の降順でソート（新しい順）
            );
            performancesSnapshot = await getDocs(performancesQuery);
          } catch (orderByError) {
            // createdAtが存在しない場合やインデックスが設定されていない場合のエラーハンドリング
            console.warn("createdAtでのソートに失敗しました。フィルタのみで取得します:", orderByError);
            // ソートなしで取得（一時的な切り分け）
            const performancesQuery = query(
              collection(db, "performances"),
              where("troupeId", "==", troupeId)
            );
            performancesSnapshot = await getDocs(performancesQuery);
          }
        }

        // ============================================
        // 【予約人数と席数上限の集計ロジック】
        // 各公演に対して予約人数と席数上限を集計する
        // ============================================
        // 
        // 処理の流れ：
        // 1. 各公演をループで処理
        // 2. 各公演の予約データを取得（reservationsコレクション）
        // 3. 予約人数を合計（totalReservedPeople）
        // 4. 席数上限を合計（totalSeatLimit）
        // 5. 集計結果を公演データに追加
        // 
        const performancesData = [];

        // なぜfor...ofループを使うか：
        // - 各公演に対して非同期処理（予約データの取得）を行うため
        // - awaitを使えるため、順次処理が可能
        for (const performanceDoc of performancesSnapshot.docs) {
          // 公演データを取得（ドキュメントIDとデータを結合）
          const performanceData = {
            id: performanceDoc.id,      // ドキュメントID（例："abc123"）
            ...performanceDoc.data(),   // 公演の全データ（タイトル、会場、ステージ情報など）
          };

          // ============================================
          // 【Firestoreから取得するデータ その3】予約データを取得
          // ============================================
          // 
          // 取得元：reservationsコレクション
          // 取得条件：performanceIdが現在処理中の公演IDと一致するもの
          // 取得内容：該当公演の全予約データ
          // 
          // なぜ必要か：公演カードに「（予約人数 / 席数上限）」を表示するため
          // 
          // データ構造の例：
          // reservations/{reservationId}
          //   - performanceId: "公演ID"
          //   - stageId: 0（ステージのインデックス）
          //   - people: 2（予約人数）
          //   - customerName: "お客様名"
          //   - ...その他の予約情報
          // 
          const reservationsQuery = query(
            collection(db, "reservations"),  // reservationsコレクションを指定
            where("performanceId", "==", performanceDoc.id) // performanceIdが一致するものを検索
          );
          const reservationsSnapshot = await getDocs(reservationsQuery); // クエリを実行してデータを取得

          // ============================================
          // 【集計ロジック その1】予約人数を合計
          // ============================================
          // 
          // 処理内容：
          // - 取得した全予約データのpeople（予約人数）を合計する
          // - getTotalReservedPeople()関数を使用して集計
          // 
          // なぜ関数を使うか：
          // - 集計ロジックを再利用可能にするため
          // - 観客側UIでも同じロジックを使用できるため
          // - コードの可読性と保守性を向上させるため
          // 
          // 予約データを配列形式に変換
          const reservationsData = [];
          reservationsSnapshot.forEach((reservationDoc) => {
            reservationsData.push(reservationDoc.data());
          });

          // 関数を使用して予約人数を合計
          const totalReservedPeople = getTotalReservedPeople(reservationsData);

          // ============================================
          // 【集計ロジック その2】席数上限を合計
          // ============================================
          // 
          // 処理内容：
          // - 公演データのstages配列から、各ステージのseatLimit（席数上限）を合計する
          // - getTotalSeatLimit()関数を使用して集計
          // 
          // なぜ関数を使うか：
          // - 集計ロジックを再利用可能にするため
          // - 観客側UIでも同じロジックを使用できるため
          // - コードの可読性と保守性を向上させるため
          // 
          // 関数を使用して席数上限を合計
          const totalSeatLimit = getTotalSeatLimit(performanceData.stages);

          // ============================================
          // 集計結果を公演データに追加
          // ============================================
          // 
          // なぜ追加するか：UIで表示するため
          // 
          performanceData.totalReservedPeople = totalReservedPeople; // 合計予約人数を追加
          performanceData.totalSeatLimit = totalSeatLimit;           // 合計席数上限を追加

          // 集計済みの公演データを配列に追加
          performancesData.push(performanceData);
        }

        // 【重要】setStateでデータを保存
        // なぜ必要か：stateに保存しないと、コンポーネントが再レンダリングされてもデータが反映されない
        setPerformances(performancesData);
        
        // Firestore連携確認のためのconsole.log
        console.log("=== 劇団側公演一覧：Firestoreデータ取得 ===");
        console.log("取得した公演数:", performancesData.length);
        console.log("公演データ:", performancesData);
        console.log("===========================================");
      } catch (error) {
        console.error("データ読み込みエラー:", error);
        setError(`データの読み込みに失敗しました: ${error.message}`);
      } finally {
        // なぜfinallyを使うか：エラーが発生しても必ずloadingをfalseにするため
        setLoading(false);
      }
    };

    loadPerformances();
  }, [user]);

  // ============================================
  // UI
  // ============================================

  // データ読み込み中の表示
  // なぜ必要か：データ取得中にユーザーに待機中であることを伝えるため
  if (loading) {
    return (
      <div className="troupe-performances-page">
        <h1>公演一覧（管理用）</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="troupe-performances-page">
      <h1>公演一覧（管理用）</h1>

      {/* エラーメッセージ表示 */}
      {error && (
        <div style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ef5350",
        }}>
          {error}
        </div>
      )}

      {/* 新規公演作成ボタン */}
      <Link to="/troupe/performance/create" className="create-performance-link">
        ＋ 新しい公演を作成
      </Link>

      {/* 公演リスト */}
      <div className="performance-list">
        {performances.length === 0 ? (
          <div style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            color: "#666",
          }}>
            <p>公演が登録されていません。</p>
          </div>
        ) : (
          performances.map((p) => (
            <div key={p.id} className="performance-item">
              {/* 公演タイトル */}
              <div className="performance-title">{p.title || "タイトル未設定"}</div>
              
              {/* 
                ============================================
                【UIで表示している箇所】予約人数と席数上限の表示
                ============================================
                
                【仕様】予約人数表記の表示形式
                ============================================
                
                基本形式：
                  （予約人数 / 席数上限）
                
                表示パターン：
                  1. 席数上限が設定されている場合：
                     「（予約人数 / 席数上限）」
                     例：「（7 / 20）」→ 予約7人、上限20席
                     例：「（0 / 20）」→ 予約0人、上限20席
                
                  2. 席数上限が設定されていない場合：
                     「（予約人数 / 制限なし）」
                     例：「（5 / 制限なし）」→ 予約5人、上限なし
                     例：「（0 / 制限なし）」→ 予約0人、上限なし
                
                表示ルール：
                  - 予約人数が0件でも「（0 / X）」と表示される
                  - 予約人数が未定義やnullの場合は0として表示
                  - 席数上限が0より大きい場合のみ「席数上限」として表示
                  - 席数上限が0または未設定の場合は「制限なし」と表示
                
                スタイル仕様：
                  - 色や強調は行わない（管理画面のため）
                  - 通常テキストとして表示（グレー色：#666）
                  - タイトルより少し小さく表示（fontSize: 0.9em）
                  - タイトルとの間隔を4px確保
                
                ============================================
                
                表示位置：公演タイトルの下
                
                表示するデータ：
                  - p.totalReservedPeople：集計ロジックで計算した合計予約人数
                  - p.totalSeatLimit：集計ロジックで計算した合計席数上限
                
                なぜこの位置に表示するか：
                  - 公演タイトルの下に表示することで、予約状況を一目で把握できるようにするため
                
                なぜ視覚的な強調をしないか：
                  - 劇団側UIでは「満席」「残りわずか」などの視覚強化は行わない
                  - 数値のみを事実として表示する
                  - 観客向けUIとは役割を分離する
              */}
              <div style={{
                fontSize: "0.9em",
                color: "#666",
                marginTop: "4px",
              }}>
                {/* 
                  条件分岐：
                  - totalSeatLimit > 0 の場合：席数上限が設定されているので「（予約人数 / 席数上限）」を表示
                  - それ以外の場合：席数上限が設定されていないので「（予約人数 / 制限なし）」を表示
                  
                  なぜ || 0 を使うか：
                  - totalReservedPeopleが未定義やnullの場合、0として表示するため
                  - 予約が0件でも「（0 / X）」と表示されるようにするため
                */}
                {p.totalSeatLimit > 0 ? (
                  `（${p.totalReservedPeople || 0} / ${p.totalSeatLimit}）`
                ) : (
                  `（${p.totalReservedPeople || 0} / 制限なし）`
                )}
              </div>
              
              {/* アクションボタンエリア（編集・予約一覧を横並びに表示） */}
              <div className="performance-actions">
                {/* 編集ボタン */}
                {/* なぜ Link を使うか：React Router でページ遷移を行うため */}
                {/* to 属性に URL を指定することで、クリック時にその URL に遷移します */}
                <Link 
                  to={`/troupe/performance/${p.id}/edit`} 
                  className="performance-edit-link"
                >
                  編集
                </Link>
                
                {/* 予約一覧ボタン */}
                {/* なぜこの URL を使うか：
                    - App.jsx で定義されているルーティングに合わせるため
                    - /troupe/performances/:performanceId/reservations が
                      PerformanceReservationsPage にマッピングされています
                    - p.id は公演の Firestore ドキュメントID（performanceId）です */}
                <Link 
                  to={`/troupe/performances/${p.id}/reservations`} 
                  className="performance-reservations-link"
                >
                  予約一覧
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TroupePerformancesPage;
