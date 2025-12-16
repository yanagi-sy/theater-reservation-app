/**
 * ============================================
 * ReservePage.jsx - 予約フォームページ
 * ============================================
 * 
 * 観客が公演を予約するためのフォームページです。
 * 
 * 主な機能：
 * 1. 選択した公演情報の表示
 * 2. ステージ（日時）の選択（複数の公演日時から選択）
 * 3. 予約情報の入力（氏名、メールアドレス、人数、備考）
 * 4. Firebaseへの予約データの保存
 * 5. 予約完了ページへの遷移
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import "./ReservePage.css";

/**
 * ReservePageコンポーネント
 * 
 * @returns {JSX.Element} 予約フォームページのUI
 * 
 * URLパラメータ：
 * - performanceId: 予約する公演のID（FirestoreのドキュメントID）
 *   例：/reserve/abc123 → performanceId = "abc123"
 * 
 * 注意：
 * - performanceIdは「公演ID」を表します
 * - stageIdは「ステージ（日時）」のインデックスを表します（0から始まる）
 */
export default function ReservePage() {
  // useParams: URLパラメータから公演IDを取得
  // 例：/reserve/abc123 → performanceId = "abc123"
  const { performanceId } = useParams();
  
  // useNavigate: プログラム的にページ遷移を行うための関数
  const navigate = useNavigate();

  // ============================================
  // 状態管理
  // ============================================
  const [performance, setPerformance] = useState(null);  // 公演データ
  const [troupeInfo, setTroupeInfo] = useState(null);   // 劇団情報
  const [loading, setLoading] = useState(true);         // 読み込み中
  const [error, setError] = useState("");               // エラーメッセージ
  
  // フォームの入力値管理
  const [name, setName] = useState("");                 // 氏名
  const [email, setEmail] = useState("");               // メールアドレス
  const [emailConfirm, setEmailConfirm] = useState(""); // メールアドレス（確認用）
  const [people, setPeople] = useState(1);              // 人数（デフォルト：1人）
  const [note, setNote] = useState("");                 // 備考（任意）
  const [selectedStageId, setSelectedStageId] = useState(null); // 選択されたステージID（配列のインデックス）
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信中の状態（重複送信防止用）

  // ============================================
  // 残席チェック用の状態管理
  // ============================================
  const [reservedSeats, setReservedSeats] = useState(0);  // 予約済み人数（選択されたステージの）
  const [stageReservedSeatsMap, setStageReservedSeatsMap] = useState({}); // 各ステージごとの予約済み人数（stageId -> 人数）
  const [checkingSeats, setCheckingSeats] = useState(false); // 残席チェック中かどうか

  /**
   * 指定された公演IDとステージIDに紐づく予約済み人数を取得する関数
   * 
   * @param {string} targetPerformanceId - 公演ID（FirestoreのドキュメントID）
   * @param {number} targetStageId - ステージID（配列のインデックス）
   * @returns {Promise<number>} 予約済み人数の合計
   * 
   * なぜこの関数が必要か：
   * - 同じ公演・同じステージ（日時）に対して複数の予約が存在する可能性があるため
   * - 各予約の人数（people）を合計して、実際に予約されている人数を把握する必要があるため
   * - 残席数を正確に計算するために必要
   * 
   * 処理の流れ：
   * 1. Firestoreのreservationsコレクションから、指定されたperformanceIdとstageIdに一致する予約を検索
   * 2. 各予約のpeopleフィールドを合計する（peopleが無い場合は1として扱う）
   * 3. 合計値を返す
   */
  const getReservedSeatsCount = async (targetPerformanceId, targetStageId) => {
    if (!db || !targetPerformanceId || targetStageId === null || targetStageId === undefined) {
      return 0;
    }

    try {
      // Firestoreのreservationsコレクションから、指定された条件に一致する予約を検索
      // なぜquery + whereを使うか：特定の条件に一致するドキュメントだけを取得するため
      // これにより、ネットワーク転送量を減らし、パフォーマンスを向上させます
      const reservationsRef = collection(db, "reservations");
      const q = query(
        reservationsRef,
        where("performanceId", "==", targetPerformanceId),  // 公演IDでフィルタリング
        where("stageId", "==", targetStageId)              // ステージIDでフィルタリング
      );
      
      const querySnapshot = await getDocs(q);
      
      // 各予約の人数を合計
      // なぜpeopleが無い場合は1として扱うか：古いデータやデータ不整合に対応するため
      let totalReserved = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // peopleフィールドが存在する場合はその値、無い場合は1として扱う
        const peopleCount = data.people && typeof data.people === "number" ? data.people : 1;
        totalReserved += peopleCount;
      });

      return totalReserved;
    } catch (error) {
      console.error("予約済み人数の取得に失敗しました:", error);
      // エラーが発生した場合は0を返す（安全側に倒す）
      return 0;
    }
  };

  // Firestoreから公演データと劇団情報を取得
  useEffect(() => {
    const loadPerformance = async () => {
      if (!db) {
        setError("Firestoreが初期化されていません。");
        setLoading(false);
        return;
      }

      if (!performanceId) {
        setError("公演IDが指定されていません。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Firestoreから公演データを取得
        // performanceIdはFirestoreのperformancesコレクションのドキュメントID
        const performanceDocRef = doc(db, "performances", performanceId);
        const performanceDocSnap = await getDoc(performanceDocRef);

        if (!performanceDocSnap.exists()) {
          setError("公演が見つかりませんでした。");
          setLoading(false);
          return;
        }

        const performanceData = {
          id: performanceDocSnap.id,
          ...performanceDocSnap.data(),
        };

        // 劇団情報を取得
        if (performanceData.troupeId) {
          try {
            const troupeDocRef = doc(db, "troupes", performanceData.troupeId);
            const troupeDocSnap = await getDoc(troupeDocRef);
            
            if (troupeDocSnap.exists()) {
              setTroupeInfo(troupeDocSnap.data());
            } else {
              setTroupeInfo({ troupeName: "劇団名未設定" });
            }
          } catch (troupeError) {
            console.warn("劇団情報の取得に失敗しました:", troupeError);
            setTroupeInfo({ troupeName: "劇団名未設定" });
          }
        }

        setPerformance(performanceData);
        console.log("公演データを読み込みました:", performanceData);
      } catch (error) {
        console.error("公演データ読み込みエラー:", error);
        setError(`公演データの読み込みに失敗しました: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [performanceId]); // performanceIdが変更されたときに再読み込み

  // ============================================
  // 全ステージの予約済み人数を取得する処理
  // ============================================
  // なぜこのuseEffectが必要か：
  // - 各ステージごとの残席を表示するため、全ステージの予約済み人数を事前に取得する必要があるため
  // - 満席のステージを選択不可にするために必要
  useEffect(() => {
    // 公演データが無い場合はスキップ
    if (!performance || !performanceId || !performance.stages || performance.stages.length === 0) {
      setStageReservedSeatsMap({});
      return;
    }

    // 全ステージの予約済み人数を取得
    const loadAllStageReservedSeats = async () => {
      try {
        const reservedMap = {};
        
        // 各ステージごとに予約済み人数を取得
        // なぜ並列で取得するか：パフォーマンスを向上させるため
        const promises = performance.stages.map(async (stage, index) => {
          const stageId = index;
          const reserved = await getReservedSeatsCount(performanceId, stageId);
          return { stageId, reserved };
        });

        const results = await Promise.all(promises);
        
        // 結果をマップに格納
        results.forEach(({ stageId, reserved }) => {
          reservedMap[stageId] = reserved;
        });

        setStageReservedSeatsMap(reservedMap);
        console.log("全ステージの予約済み人数を取得しました:", reservedMap);
      } catch (error) {
        console.error("全ステージの予約済み人数取得エラー:", error);
        // エラーが発生しても空のマップを設定（安全側に倒す）
        setStageReservedSeatsMap({});
      }
    };

    loadAllStageReservedSeats();
  }, [performanceId, performance]); // 公演データが変更されたときに再取得

  // ============================================
  // 残席チェック処理（選択されたステージ用）
  // ============================================
  // なぜこのuseEffectが必要か：
  // - ユーザーがステージを選択したり、人数を変更したときに、即座に残席をチェックするため
  // - 残席が不足している場合、事前にエラーメッセージを表示して、予約できないことを伝えるため
  // - UIレベルで事故を減らすため（完全な防止ではないが、ユーザー体験を向上させる）
  useEffect(() => {
    // ステージが選択されていない、または公演データが無い場合はチェックしない
    if (selectedStageId === null || !performance || !performanceId) {
      setReservedSeats(0);
      return;
    }

    // 残席チェックを実行
    const checkAvailableSeats = async () => {
      setCheckingSeats(true);
      
      try {
        // 予約済み人数を取得
        const reserved = await getReservedSeatsCount(performanceId, selectedStageId);
        setReservedSeats(reserved);
        
        // 選択されたステージの情報を取得
        const selectedStageData = performance.stages[selectedStageId];
        const seatLimit = selectedStageData?.seatLimit || 0;
        
        // 残席数を計算
        // なぜseatLimitから引くか：席数上限から予約済み人数を引くことで残席を計算するため
        const availableSeats = seatLimit > 0 ? seatLimit - reserved : Infinity;
        
        // 希望人数が残席を超えている場合、エラーメッセージを設定
        // なぜこのチェックが必要か：残席を超える予約を防ぐため（UIレベルでの防止）
        const requestedPeople = Number(people) || 0;
        if (seatLimit > 0 && requestedPeople > availableSeats) {
          setError(`残席が不足しています。残席: ${availableSeats}席、希望人数: ${requestedPeople}人`);
        } else {
          // 残席が十分な場合は、残席関連のエラーをクリア
          // 注意：他のエラー（氏名未入力など）は残す
          if (error.includes("残席が不足")) {
            setError("");
          }
        }
      } catch (error) {
        console.error("残席チェックエラー:", error);
        // エラーが発生しても予約は可能にする（安全側に倒す）
      } finally {
        setCheckingSeats(false);
      }
    };

    checkAvailableSeats();
  }, [selectedStageId, people, performanceId, performance]); // これらの値が変更されたときに再チェック

  // 表示用データに変換
  // 注意：eventは公演情報カードの表示用で、最初のステージ情報を表示します
  // 実際の予約では、ユーザーが選択したステージ（selectedStageId）を使用します
  const firstStage = performance?.stages && performance.stages.length > 0 
    ? performance.stages[0] 
    : null;

  const event = performance ? {
    id: performance.id,
    title: performance.title || "タイトル未設定",
    troupe: troupeInfo?.troupeName || "劇団名未設定",
    date: firstStage?.date || "",
    time: firstStage?.start || "",
    venue: performance.venue || "",
    price: performance.price || 0,
  } : null;

  // 選択されたステージ情報を取得
  // selectedStageIdがnullの場合は未選択、数値の場合はそのインデックスのステージを取得
  const selectedStage = selectedStageId !== null && performance?.stages 
    ? performance.stages[selectedStageId] 
    : null;

  /**
   * cancelTokenを生成する関数
   * 
   * @returns {string} ランダムな32〜48文字の英数字文字列
   * 
   * なぜこの関数が必要か：
   * - キャンセル用の安全なトークンを生成するため
   * - window.crypto.getRandomValuesを使用して、セキュアな乱数を生成
   * - 予測不可能なトークンにより、不正なキャンセルを防ぐ
   */
  const generateCancelToken = () => {
    // window.crypto.getRandomValuesを使用して安全な乱数を生成
    // なぜcrypto APIを使うか：Math.random()よりもセキュアで予測不可能なため
    const array = new Uint8Array(32); // 32バイト = 256ビット
    window.crypto.getRandomValues(array);
    
    // バイト配列を16進数文字列に変換
    const hexString = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return hexString; // 64文字の16進数文字列
  };

  /**
   * フォーム送信処理
   * 
   * @param {Event} e - フォーム送信イベント
   * 
   * 処理の流れ：
   * 1. フォームのデフォルト動作（ページリロード）を防止
   * 2. バリデーション
   * 3. Firestoreに予約データを保存
   * 4. mailQueueに送信依頼を追加（Phase1）
   * 5. 予約完了ページへ遷移
   */
  const handleSubmit = async (e) => {
    // フォームのデフォルト動作（ページリロード）を防止
    e.preventDefault();
    
    // バリデーション
    // なぜバリデーションが必要か：不正なデータをFirestoreに保存するのを防ぐため
    if (!name.trim()) {
      setError("氏名を入力してください。");
      return;
    }
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }
    if (!emailConfirm.trim()) {
      setError("メールアドレス（確認用）を入力してください。");
      return;
    }
    // メールアドレスの一致確認
    if (email.trim() !== emailConfirm.trim()) {
      setError("メールアドレスが一致しません。");
      return;
    }
    if (Number(people) < 1) {
      setError("人数は1人以上を入力してください。");
      return;
    }
    // ステージ選択のバリデーション
    // なぜ必要か：どの日時の公演を予約するのかを明確にするため
    if (selectedStageId === null) {
      setError("公演日時を選択してください。");
      return;
    }
    // 選択されたステージが存在するか確認
    // なぜ必要か：配列の範囲外アクセスを防ぐため
    if (!performance?.stages || !performance.stages[selectedStageId]) {
      setError("選択された公演日時が見つかりませんでした。");
      return;
    }

    // 送信中の状態に設定（ボタンの無効化などに使用）
    setIsSubmitting(true);
    setError("");

    try {
      // Firestore初期化チェック
      if (!db) {
        throw new Error("Firestoreが初期化されていません。");
      }

      if (!performance) {
        throw new Error("公演情報が取得できませんでした。");
      }

      // 選択されたステージ情報を取得
      // なぜselectedStageを使うか：ユーザーが選択した日時情報を正確に保存するため
      const selectedStageData = performance.stages[selectedStageId];

      // ============================================
      // 保存直前の最終残席チェック
      // ============================================
      // なぜこのチェックが必要か：
      // - UIでの事前チェックと、実際の保存時点では時間差があるため
      // - その間に他のユーザーが予約して残席が変動する可能性があるため
      // - 保存直前の最新状態を確認することで、残席を超える予約を防ぐため
      // - 注意：これはUIレベルでの最終チェックであり、完全な防止ではないため、
      //   サーバー側（Firestore Security Rules）でもチェックが必要です
      const seatLimit = selectedStageData?.seatLimit || 0;
      
      // 席数上限が設定されている場合のみ残席チェックを実行
      if (seatLimit > 0) {
        // 最新の予約済み人数を取得
        // なぜ再取得するか：保存直前の最新状態を確認するため
        const latestReservedSeats = await getReservedSeatsCount(performanceId, selectedStageId);
        
        // 最新の残席数を計算
        const latestAvailableSeats = seatLimit - latestReservedSeats;
        
        // 希望人数を取得
        const requestedPeople = Number(people) || 0;
        
        // 希望人数が残席を超えている場合、保存を中止
        if (requestedPeople > latestAvailableSeats) {
          setError(`残席が不足しています。残席: ${latestAvailableSeats}席、希望人数: ${requestedPeople}人。他のユーザーが予約した可能性があります。`);
          setIsSubmitting(false); // 送信中の状態を解除
          return; // ここで処理を中断（addDocを実行しない）
        }
      }

      // cancelTokenを生成
      const cancelToken = generateCancelToken();

      // 保存する予約データのオブジェクトを作成
      const reservationData = {
        // 公演情報
        performanceId: performanceId,                 // 公演ID（FirestoreのドキュメントID）
        troupeId: performance.troupeId || "",        // 劇団ID
        
        // ステージ情報（ユーザーが選択した日時）
        // なぜstageIdを保存するか：どのステージ（日時）を予約したかを明確にするため
        stageId: selectedStageId,                    // ステージID（配列のインデックス、0から始まる）
        stageDate: selectedStageData.date || "",     // 公演日（選択されたステージの日付）
        stageStart: selectedStageData.start || "",   // 公演開始時間（選択されたステージの開始時間）
        stageEnd: selectedStageData.end || "",       // 公演終了時間（選択されたステージの終了時間）
        
        // 公演の基本情報（検索・表示用に保存）
        performanceTitle: performance.title || "",     // 公演タイトル
        troupeName: troupeInfo?.troupeName || "",     // 劇団名
        venue: performance.venue || "",               // 会場
        prefecture: performance.prefecture || "",     // 都道府県
        region: performance.region || "",             // 地域
        price: performance.price || 0,                // 料金
        
        // 予約者情報
        name: name.trim(),                            // 予約者名
        email: email.trim(),                          // 予約者メールアドレス
        people: Number(people),                       // 人数（文字列を数値に変換）
        note: note.trim() || "",                      // 備考
        
        // メタデータ
        createdAt: serverTimestamp(),                 // 作成日時（Firebaseサーバーのタイムスタンプ）
        status: "active",                             // 予約ステータス（active: 有効な予約）
        cancelToken: cancelToken,                     // キャンセル用トークン（ランダム文字列）
      };

      // Firestoreの"reservations"コレクションに予約データを追加
      const docRef = await addDoc(collection(db, "reservations"), reservationData);
      
      console.log("予約データを保存しました。ドキュメントID:", docRef.id);
      console.log("保存した予約データ:", reservationData);

      // ============================================
      // mailQueueに送信依頼を追加（Phase1）
      // ============================================
      // なぜmailQueueを使うか：
      // - Phase1: 送信依頼を保存するだけ（実送信は後で実装）
      // - Phase2: Firebase FunctionsでmailQueueを監視し、SendGrid等で実送信
      // この設計により、後から実送信機能を追加しやすい
      const cancelUrl = `${window.location.origin}/cancel?token=${cancelToken}`;
      const mailQueueData = {
        type: "reservation-confirm",
        to: email.trim(),
        subject: `【予約確認】${performance.title || "公演"}のご予約`,
        body: `
${name.trim()} 様

この度は、${performance.title || "公演"}のご予約ありがとうございます。

【予約内容】
公演名：${performance.title || "タイトル未設定"}
日時：${selectedStageData.date || ""} ${selectedStageData.start || ""}
会場：${performance.venue || ""}
予約者名：${name.trim()}
人数：${people}名
${note.trim() ? `備考：${note.trim()}` : ""}

【キャンセルについて】
キャンセルをご希望の場合は、以下のリンクからお手続きください。
${cancelUrl}

※このリンクは予約者様のみが使用できます。他の方に共有しないようご注意ください。

ご不明な点がございましたら、劇団までお問い合わせください。
        `.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        reservationId: docRef.id,
      };

      // mailQueueコレクションに送信依頼を追加
      await addDoc(collection(db, "mailQueue"), mailQueueData);
      console.log("メール送信依頼をmailQueueに追加しました。");

      // 予約完了ページへ遷移
      navigate("/reserve-complete", {
        state: {
          reservationData: {
            reservationId: docRef.id,
            performanceId: performanceId,
            name,
            email,
            people,
            note,
            performanceTitle: performance.title,
          },
        },
      });
    } catch (error) {
      // エラーが発生した場合の処理
      console.error("予約の保存に失敗しました:", error);
      setError(`予約の保存に失敗しました: ${error.message}`);
    } finally {
      // 送信中の状態を解除（成功・失敗に関わらず実行される）
      setIsSubmitting(false);
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="reserve-page">
        <h1 className="reserve-title">予約フォーム</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error && !event) {
    return (
      <div className="reserve-page">
        <h1 className="reserve-title">予約フォーム</h1>
        <p style={{ color: "#c62828", padding: "20px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="reserve-page">
      {/* ページタイトル */}
      <h1 className="reserve-title">予約フォーム</h1>

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

      {/* 公演情報の表示（eventが存在する場合のみ表示） */}
      {event && (
        <div className="reserve-event-card">
          <h2 className="reserve-event-title">{event.title}</h2>
          <p className="reserve-event-text">劇団：{event.troupe}</p>
          <p className="reserve-event-text">
            日時：{event.date} {event.time}
          </p>
          <p className="reserve-event-text">会場：{event.venue}</p>
          <p className="reserve-event-text">
            {/* 料金が0円の場合は「無料」と表示 */}
            料金：{event.price === 0 ? "無料" : `${event.price} 円`}
          </p>
        </div>
      )}

      {/* 予約フォーム */}
      <form onSubmit={handleSubmit} className="reserve-form">
        {/* ============================================
            ステージ（日時）選択セクション
            ============================================
            なぜ必要か：1つの公演に複数の公演日時がある場合、
            ユーザーがどの日時を予約するか選択する必要があるため
        */}
        {performance?.stages && performance.stages.length > 0 && (
          <div className="reserve-field">
            <label className="reserve-label">
              公演日時 <span style={{ color: "#c62828" }}>*</span>
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {performance.stages.map((stage, index) => {
                // なぜindexを使うか：配列のインデックスをstageIdとして使用するため
                // これにより、どのステージが選択されたかを簡単に識別できます
                const stageId = index;
                const isSelected = selectedStageId === stageId;
                
                // 各ステージごとの残席を計算
                // なぜ各ステージごとに計算するか：満席のステージを選択不可にするため
                const stageReservedSeats = stageReservedSeatsMap[stageId] || 0;
                const seatLimit = stage.seatLimit || 0;
                const availableSeats = seatLimit > 0 
                  ? seatLimit - stageReservedSeats 
                  : Infinity;
                const isFull = seatLimit > 0 && availableSeats <= 0; // 満席かどうか
                
                // 日時の表示形式を整形
                // 例：2025-12-03 14:00〜16:00
                const dateStr = stage.date || "";
                const startStr = stage.start || "";
                const endStr = stage.end || "";
                const displayText = `${dateStr} ${startStr}${endStr ? `〜${endStr}` : ""}`;
                
                return (
                  <label
                    key={stageId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px",
                      border: `2px solid ${isSelected ? "#4caf50" : isFull ? "#bdbdbd" : "#e0e0e0"}`,
                      borderRadius: "8px",
                      cursor: isFull ? "not-allowed" : "pointer",
                      backgroundColor: isSelected 
                        ? "#e8f5e9" 
                        : isFull 
                        ? "#f5f5f5" 
                        : "#fff",
                      opacity: isFull ? 0.6 : 1, // 満席の場合はグレーアウト
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Radioボタン */}
                    {/* なぜradioボタンを使うか：複数の選択肢から1つだけ選ぶ必要があるため */}
                    <input
                      type="radio"
                      name="stage"
                      value={stageId}
                      checked={isSelected}
                      disabled={isFull} // 満席の場合は選択不可
                      onChange={(e) => {
                        // 満席の場合は選択できないようにする
                        if (isFull) {
                          return;
                        }
                        // なぜNumber()で変換するか：e.target.valueは文字列なので、数値に変換する必要があるため
                        setSelectedStageId(Number(e.target.value));
                        // エラーメッセージをクリア（ユーザーが選択したらエラーを消す）
                        if (error.includes("公演日時")) {
                          setError("");
                        }
                      }}
                      style={{ 
                        marginRight: "12px", 
                        cursor: isFull ? "not-allowed" : "pointer",
                        opacity: isFull ? 0.5 : 1
                      }}
                    />
                    <span style={{ flex: 1, color: isFull ? "#999" : "inherit" }}>
                      {displayText}
                    </span>
                    {/* 席数上限が設定されている場合の表示 */}
                    {seatLimit > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isFull ? (
                          // 満席の場合の表示
                          <span style={{ 
                            color: "#c62828", 
                            fontSize: "0.9em",
                            fontWeight: "bold",
                            backgroundColor: "#ffebee",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}>
                            満席
                          </span>
                        ) : (
                          // 残席がある場合の表示
                          <span style={{ color: "#666", fontSize: "0.9em" }}>
                            （残席: {availableSeats}席）
                          </span>
                        )}
                      </div>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {/* ステージ未選択時のエラーメッセージ（バリデーション用） */}
            {error.includes("公演日時") && (
              <p style={{ color: "#c62828", fontSize: "0.9em", marginTop: "8px" }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* 氏名入力フィールド */}
        <div className="reserve-field">
          <label className="reserve-label">氏名</label>
          <input
            className="reserve-input"
            value={name}                                    // 入力値とstateを紐付け
            onChange={(e) => setName(e.target.value)}      // 入力時にstateを更新
            required                                        // 必須入力
          />
        </div>

        {/* メールアドレス入力フィールド */}
        <div className="reserve-field">
          <label className="reserve-label">メールアドレス</label>
          <input
            className="reserve-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // メールアドレス変更時にエラーをクリア
              if (error.includes("メールアドレスが一致")) {
                setError("");
              }
            }}
            required
          />
        </div>

        {/* メールアドレス（確認用）入力フィールド */}
        <div className="reserve-field">
          <label className="reserve-label">メールアドレス（確認用）</label>
          <input
            className="reserve-input"
            type="email"
            value={emailConfirm}
            onChange={(e) => {
              setEmailConfirm(e.target.value);
              // メールアドレス変更時にエラーをクリア
              if (error.includes("メールアドレスが一致")) {
                setError("");
              }
            }}
            required
          />
          {/* メールアドレス不一致時のエラーメッセージ */}
          {email && emailConfirm && email !== emailConfirm && (
            <p style={{ color: "#c62828", fontSize: "0.9em", marginTop: "4px" }}>
              メールアドレスが一致しません。
            </p>
          )}
        </div>

        {/* 人数入力フィールド */}
        <div className="reserve-field">
          <label className="reserve-label">人数</label>
          <input
            className="reserve-input"
            type="number"                                  // 数値入力
            min="1"                                        // 最小値：1人
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            required
          />
        </div>

        {/* 備考入力フィールド（任意） */}
        <div className="reserve-field">
          <label className="reserve-label">備考（任意）</label>
          <textarea
            className="reserve-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            // required属性なし = 任意入力
          />
        </div>

        {/* 送信ボタン */}
        {/* 
          なぜ残席チェックでボタンを無効化するか：
          - 残席が不足している場合、予約できないことを明確に伝えるため
          - ユーザーが誤って予約しようとするのを防ぐため（UIレベルでの防止）
          - 注意：これは完全な防止ではないため、サーバー側でもチェックが必要です
        */}
        {(() => {
          // 残席チェックの結果を計算
          const selectedStageData = selectedStageId !== null && performance?.stages 
            ? performance.stages[selectedStageId] 
            : null;
          const seatLimit = selectedStageData?.seatLimit || 0;
          const availableSeats = seatLimit > 0 ? seatLimit - reservedSeats : Infinity;
          const requestedPeople = Number(people) || 0;
          const isSeatInsufficient = seatLimit > 0 && requestedPeople > availableSeats;
          
          // メールアドレス不一致チェック
          const isEmailMismatch = email && emailConfirm && email !== emailConfirm;
          
          return (
            <button 
              type="submit"
              className="reserve-button"
              disabled={isSubmitting || checkingSeats || isSeatInsufficient || isEmailMismatch}
            >
              {isSubmitting 
                ? "予約処理中..." 
                : checkingSeats 
                ? "残席を確認中..." 
                : isSeatInsufficient
                ? "残席が不足しています"
                : isEmailMismatch
                ? "メールアドレスを確認してください"
                : "この公演を予約する"}
            </button>
          );
        })()}
      </form>
    </div>
  );
}
