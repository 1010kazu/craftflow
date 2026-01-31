# 次のステップ - セットアップ完了ガイド

## ✅ 完了した作業

1. ✅ プロジェクトのセットアップ（Next.js、TypeScript、依存関係）
2. ✅ Prismaスキーマとデータベース設定
3. ✅ 型定義とユーティリティ関数の作成
4. ✅ 認証機能の実装（JWT、bcrypt、API Routes）
5. ✅ ゲーム管理APIとページの実装
6. ✅ アイテム・レシピ管理APIの実装
7. ✅ アイテム一覧・詳細ページの実装
8. ✅ レシピツリー機能の実装
9. ✅ CSV/JSONインポート機能の実装
10. ✅ UIコンポーネントとスタイリングの実装
11. ✅ Prismaクライアントの生成
12. ✅ ビルドエラーの修正

## 📋 次のステップ

### 1. データベースのセットアップ

PostgreSQLデータベースをセットアップしてください：

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベースとユーザーを作成
CREATE DATABASE craftflow;
CREATE USER craftflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE craftflow TO craftflow_user;
\q
```

### 2. 環境変数の設定

`.env`ファイルを編集して、実際のデータベース接続情報を設定：

```env
DATABASE_URL="postgresql://craftflow_user:your_password@localhost:5432/craftflow?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_API_BASE_URL="/api"
```

### 3. データベースマイグレーション

```bash
# 初回マイグレーション
npm run db:migrate

# または、開発環境では以下でも可（スキーマを直接適用）
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

### 5. 初回ユーザーの作成

#### 方法1: アプリケーションで登録後、データベースで管理者に変更

1. ブラウザで `http://localhost:3000` にアクセス
2. 「新規登録」からユーザーを作成
3. データベースに接続して、該当ユーザーの`role`を`ADMIN`に変更

```bash
# PostgreSQLに接続
sudo -u postgres psql -d craftflow

# ユーザーのroleをADMINに変更
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
\q
```

#### 方法2: Prisma Studioを使用

```bash
npm run db:studio
```

ブラウザで `http://localhost:5555` にアクセスし、`User`テーブルでユーザーを作成します。
（パスワードはbcryptでハッシュ化する必要があるため、方法1を推奨）

### 6. 動作確認

1. ✅ ブラウザで `http://localhost:3000` にアクセス
2. ✅ ユーザー登録またはログイン
3. ✅ ゲーム選択ページが表示されることを確認
4. ✅ 管理者としてログインしている場合、`/admin/games` でゲーム管理が可能
5. ✅ ゲームを選択してアイテム一覧を表示
6. ✅ アイテム詳細でレシピツリーを表示

## 🎯 推奨される追加作業

### 機能の拡張
- [ ] レシピ編集機能のUI実装
- [ ] アイテムの一括削除機能
- [ ] レシピツリーのエクスポート機能（画像、PDF等）
- [ ] アイテムの画像アップロード機能

### パフォーマンス最適化
- [ ] レシピツリーの仮想スクロール実装
- [ ] データベースクエリの最適化
- [ ] キャッシュ戦略の実装

### セキュリティ強化
- [ ] レート制限の実装
- [ ] CSRF保護の追加
- [ ] 入力サニタイゼーションの強化

### テスト
- [ ] ユニットテストの追加
- [ ] 統合テストの実装
- [ ] E2Eテストの実装

### デプロイ
- [ ] 本番環境のセットアップ
- [ ] CI/CDパイプラインの構築
- [ ] 環境変数の管理（Vercel、Railway等）

## 📚 参考ドキュメント

- [SETUP.md](./SETUP.md) - 詳細なセットアップガイド
- [docs/DESIGN.md](./docs/DESIGN.md) - 設計書
- [docs/API_SPEC.md](./docs/API_SPEC.md) - API仕様書
- [docs/ALGORITHM.md](./docs/ALGORITHM.md) - レシピツリーアルゴリズム

## 🐛 トラブルシューティング

### データベース接続エラー
- PostgreSQLが起動しているか確認: `sudo systemctl status postgresql`
- `.env`ファイルの`DATABASE_URL`が正しいか確認
- データベースとユーザーが作成されているか確認

### ビルドエラー
```bash
# node_modulesとPrismaクライアントを削除して再インストール
rm -rf node_modules .prisma
npm install
npm run db:generate
```

### ポート3000が既に使用されている場合
```bash
PORT=3001 npm run dev
```

## 🎉 完了！

これで基本的な実装は完了です。データベースをセットアップして、開発サーバーを起動すれば、アプリケーションを使用できます。
