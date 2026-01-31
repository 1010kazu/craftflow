# セットアップガイド

## 1. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/craftflow?schema=public"

# JWT Secret
JWT_SECRET="your-secret-key-change-in-production"

# Next.js
NEXT_PUBLIC_API_BASE_URL="/api"
```

### PostgreSQLのセットアップ

PostgreSQLがインストールされていない場合：

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# https://www.postgresql.org/download/windows/ からインストーラーをダウンロード
```

データベースの作成：

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベースとユーザーを作成
CREATE DATABASE craftflow;
CREATE USER craftflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE craftflow TO craftflow_user;
\q
```

`.env`ファイルの`DATABASE_URL`を更新：

```env
DATABASE_URL="postgresql://craftflow_user:your_password@localhost:5432/craftflow?schema=public"
```

## 2. Prismaクライアントの生成

```bash
npm run db:generate
```

## 3. データベースマイグレーション

```bash
# 初回マイグレーション
npm run db:migrate

# または、開発環境では以下でも可（スキーマを直接適用）
npm run db:push
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 5. 初回ユーザーの作成

### 方法1: データベースで直接作成

```bash
# Prisma Studioを起動
npm run db:studio
```

ブラウザで `http://localhost:5555` にアクセスし、`User`テーブルでユーザーを作成します。
パスワードはbcryptでハッシュ化する必要があるため、以下の方法2を推奨します。

### 方法2: アプリケーションで登録後、データベースで管理者に変更

1. アプリケーションでユーザー登録を行う
2. データベースに接続して、該当ユーザーの`role`を`ADMIN`に変更

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 6. 動作確認

1. ブラウザで `http://localhost:3000` にアクセス
2. ユーザー登録またはログイン
3. ゲーム選択ページが表示されることを確認
4. 管理者としてログインしている場合、`/admin/games` でゲーム管理が可能

## トラブルシューティング

### Prismaクライアントの生成エラー

```bash
# node_modulesとPrismaクライアントを削除して再インストール
rm -rf node_modules .prisma
npm install
npm run db:generate
```

### データベース接続エラー

- PostgreSQLが起動しているか確認
- `.env`ファイルの`DATABASE_URL`が正しいか確認
- データベースとユーザーが作成されているか確認

### ポート3000が既に使用されている場合

```bash
# 別のポートで起動
PORT=3001 npm run dev
```
