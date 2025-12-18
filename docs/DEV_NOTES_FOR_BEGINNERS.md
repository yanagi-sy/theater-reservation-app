# 開発メモ（初心者向け / 動作に影響しないドキュメント）

このファイルは**アプリの実行ロジックに一切影響しない**ドキュメントです。  
目的は「第三者がリポジトリを触るときに、**どこが重要で・何が罠で・なぜ反映されないのか**」を最短で理解できるようにすることです。

---

## 1) 「pushしたのに反映されない」典型パターン

### **(A) そもそもGitに乗っていない（.gitignore）**

このプロジェクトの`.gitignore`には、以下が含まれています。

- **`src/firebase.js`**（Firebase設定ファイル）
- **`dist/`**（Viteのビルド成果物）
- **`*.local`**（例：`.env.local`）

つまり：

- **`src/firebase.js`を編集しても、pushしても、GitHubには上がりません**  
  - ローカルでは動くのに、第三者の環境では動かない原因になりやすいポイントです。
- **`dist/`は生成物なのでpushしても通常は反映されません**（そもそもGitに乗らない）  
  - デプロイは「CIがbuildする」前提で運用するのが一般的です。
- **`.env.local`の変更はpushでは共有できません**  
  - 共有したい場合は`.env.example`のようなテンプレを別途作ります（値は入れない）。

### **(B) push先のブランチ/リポジトリが違う**

確認コマンド（例）：

```bash
git status
git branch --show-current
git remote -v
git log -1 --oneline
```

### **(C) ビルド/デプロイの仕組み上、反映までタイムラグがある**

- GitHubにpushしただけでは、公開環境が自動更新されない構成もあります。
- CDNやブラウザキャッシュで古いアセットが残ることもあります。

確認観点：
- デプロイがどのブランチを見ているか
- buildが走っているか（CIログ）
- ブラウザの強制リロード（キャッシュクリア）

### **(D) 「コメント/READMEの変更」は動作を変えない**

ReactのJSX内コメントや`.md`の更新は、アプリの挙動を変えません。  
（ただし、デプロイが「pushのたびに再ビルド」なら公開物は更新されますが、**機能差分は出ません**）

---

## 2) このアプリのざっくり構造（どこを見ればいいか）

### **ルーティング（入口）**
- `src/App.jsx`：観客側/劇団側のルート定義

### **Firebase初期化**
- `src/main.jsx`：`import './firebase.js'`で初期化を読み込み
  - ただし**`src/firebase.js`は`.gitignore`でGit管理外**（重要）

### **認証（劇団側のみ）**
- `src/contexts/AuthContext.jsx`：Auth状態（user/loading）とsignOut提供
- `src/components/ProtectedRoute.jsx`：劇団側ルートの保護

### **観客側の主要ページ**
- `src/pages/audience/CalendarPage.jsx`：日付タップ→`/stages?date=...`
- `src/pages/audience/StageListPage.jsx`：検索/フィルタ/並び替え/日付絞り込み
- `src/pages/audience/StageDetailPage.jsx`：公演詳細（情報の優先順位を整理）
- `src/pages/audience/CancelReservationPage.jsx`：`cancelToken`で検索→`deleteDoc`で完全削除

### **劇団側の主要ページ**
- `src/components/TroupeLayout.jsx`：管理画面レイアウト、ハンバーガー、ログアウト
- `src/pages/troupe/PerformanceReservationsPage.jsx`：公演ごとの予約一覧（`onSnapshot`で同期）

---

## 3) Firestore設計の「運用ルール」（このアプリの前提）

### **キャンセルは論理削除ではなく物理削除**

観客のキャンセルは`deleteDoc`で**予約ドキュメントを完全削除**します。

そのため設計上は：

- **`reservations`に存在する = 有効予約**
- キャンセル済みの履歴を残すなら、別コレクション/別設計が必要

この方針のメリット：
- 管理画面・集計・CSV/PDFの意味が単純になる（現場判断が速い）

---

## 4) 「不一致」を疑うときの見方（UI vs Firestore）

よく起きる原因：
- `stages`が空/欠損
- `stageId`の型が揺れている（number想定なのにstring等）
- `troupeId`が入っておらず、劇団情報が引けない

調査方針（推測で直さない）：
- **件数 / ID / 型 / 分岐**だけをログに出して、差分を確定させてから1点だけ直す

---

## 5) “デバッグログ”の扱い（運用ルール）

デバッグログは便利ですが、入れっぱなしにするとノイズになります。

- まずは**少数（3〜8個）**で「事実」を取る
- 原因が確定したら、その1点だけ修正
- 修正後に同じログで再確認
- **問題解消が確認できたらログは削除する**

※ PII（氏名・メール・token 等）はログに出さないこと。


