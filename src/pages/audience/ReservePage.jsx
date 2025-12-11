/**
 * ============================================
 * ReservePage.jsx - 予約フォームページ
 * ============================================
 * 
 * 観客が公演を予約するためのフォームページです。
 * 
 * 主な機能：
 * 1. 選択した公演情報の表示
 * 2. 予約情報の入力（氏名、メールアドレス、人数、備考）
 * 3. Firebaseへの予約データの保存
 * 4. 予約完了ページへの遷移
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { mockEvents } from "../../mock/MockEvents";
import "./ReservePage.css";

/**
 * ReservePageコンポーネント
 * 
 * @returns {JSX.Element} 予約フォームページのUI
 * 
 * URLパラメータ：
 * - stageId: 予約する公演のID（URLから取得）
 *   例：/reserve/1 → stageId = "1"
 */
export default function ReservePage() {
  // useParams: URLパラメータを取得（例：/reserve/1 の "1"）
  const { stageId } = useParams();
  
  // useNavigate: プログラム的にページ遷移を行うための関数
  const navigate = useNavigate();

  // モックデータから該当する公演情報を検索
  // Number(stageId)で文字列を数値に変換して比較
  const event = mockEvents.find((ev) => ev.id === Number(stageId));

  // ============================================
  // フォームの入力値管理（React Hooks）
  // ============================================
  // useState: コンポーネントの状態を管理するフック
  // [値, 値を更新する関数] = useState(初期値)
  
  const [name, setName] = useState("");           // 氏名
  const [email, setEmail] = useState("");          // メールアドレス
  const [people, setPeople] = useState(1);        // 人数（デフォルト：1人）
  const [note, setNote] = useState("");            // 備考（任意）
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信中の状態（重複送信防止用）

  /**
   * フォーム送信処理
   * 
   * @param {Event} e - フォーム送信イベント
   * 
   * 処理の流れ：
   * 1. フォームのデフォルト動作（ページリロード）を防止
   * 2. 送信中の状態に設定（重複送信防止）
   * 3. Firebaseに予約データを保存（可能な場合）
   * 4. 予約完了ページへ遷移
   */
  const handleSubmit = async (e) => {
    // フォームのデフォルト動作（ページリロード）を防止
    e.preventDefault();
    
    // 送信中の状態に設定（ボタンの無効化などに使用）
    setIsSubmitting(true);

    try {
      // Firebaseが利用可能な場合のみデータベースに保存
      if (db) {
        // 保存する予約データのオブジェクトを作成
        const reservationData = {
          stageId: stageId,                          // 公演ID
          eventTitle: event?.title || "",             // 公演タイトル（オプショナルチェーンで安全に取得）
          troupe: event?.troupe || "",                // 劇団名
          date: event?.date || "",                    // 公演日
          time: event?.time || "",                    // 公演時間
          venue: event?.venue || "",                  // 会場
          price: event?.price || 0,                  // 料金
          name: name,                                 // 予約者名
          email: email,                               // 予約者メールアドレス
          people: Number(people),                     // 人数（文字列を数値に変換）
          note: note || "",                           // 備考
          createdAt: serverTimestamp(),               // 作成日時（Firebaseサーバーのタイムスタンプ）
        };

        // Firestoreの"reservations"コレクションに予約データを追加
        // addDoc: 新しいドキュメントを追加する関数
        // collection: コレクションへの参照を取得する関数
        await addDoc(collection(db, "reservations"), reservationData);
      } else {
        // Firebaseが設定されていない場合の警告
        console.warn("Firebaseが設定されていません。予約データは保存されません。");
      }

      // 予約完了ページへ遷移（Firebaseの有無に関わらず）
      // stateオプションで予約データを次のページに渡す
      navigate("/reserve-complete", {
        state: {
          reservationData: {
            stageId,
            name,
            email,
            people,
            note,
          },
        },
      });
    } catch (error) {
      // エラーが発生した場合の処理
      console.error("予約の保存に失敗しました:", error);
      
      // エラーが発生しても予約完了ページへ遷移（ユーザー体験を優先）
      // 実際のアプリでは、エラーメッセージを表示するなどの処理を追加することを推奨
      navigate("/reserve-complete", {
        state: {
          reservationData: {
            stageId,
            name,
            email,
            people,
            note,
          },
        },
      });
    } finally {
      // 送信中の状態を解除（成功・失敗に関わらず実行される）
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reserve-page">
      {/* ページタイトル */}
      <h1 className="reserve-title">予約フォーム</h1>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
        <button 
          type="submit"                                    // フォーム送信ボタン
          className="reserve-button"
          disabled={isSubmitting}                          // 送信中はボタンを無効化
        >
          {/* 送信中の状態に応じてボタンのテキストを変更 */}
          {isSubmitting ? "予約処理中..." : "この公演を予約する"}
        </button>
      </form>
    </div>
  );
}
