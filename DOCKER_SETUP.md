# Dockerセットアップガイド

## 🐳 Docker環境での実行

このプロジェクトはDocker Composeを使用して、PostgreSQLデータベースとNext.jsアプリケーションを実行できます。

## 📋 前提条件

- Docker (version 20.10以上)
- Docker Compose (version 2.0以上)

## 🚀 クイックスタート

### 1. コンテナのビルドと起動

```bash
# コンテナのビルド
docker compose build

# コンテナの起動（バックグラウンド）
docker compose up -d

# ログの確認
docker compose logs -f app
```

### 2. アプリケーションへのアクセス

- **アプリケーション**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### 3. コンテナの停止

```bash
# コンテナの停止
docker compose down

# データベースのボリュームも削除する場合
docker compose down -v
```

## 📁 ファイル構成

- `Dockerfile` - 本番環境用のDockerイメージ
- `Dockerfile.dev` - 開発環境用のDockerイメージ
- `docker-compose.yml` - Docker Compose設定ファイル
- `.dockerignore` - Dockerビルド時に除外するファイル

## 🔧 環境変数

Docker Composeでは以下の環境変数が自動的に設定されます：

- `DATABASE_URL`: PostgreSQL接続文字列
- `JWT_SECRET`: JWTトークンの秘密鍵
- `NEXT_PUBLIC_API_BASE_URL`: APIのベースURL
- `NODE_ENV`: 環境（development）

## 🗄️ データベース

PostgreSQLコンテナは以下の設定で起動します：

- **ユーザー名**: `craftflow_user`
- **パスワード**: `craftflow_password`
- **データベース名**: `craftflow`
- **ポート**: `5432`

データベースのデータは`postgres_data`ボリュームに永続化されます。

## 🛠️ 開発コマンド

### コンテナ内でコマンドを実行

```bash
# コンテナ内でシェルを開く
docker compose exec app sh

# Prismaマイグレーション
docker compose exec app npx prisma migrate dev

# Prisma Studioを起動
docker compose exec app npx prisma studio
```

### ログの確認

```bash
# すべてのサービスのログ
docker compose logs

# アプリケーションのログのみ
docker compose logs app

# リアルタイムでログを確認
docker compose logs -f app
```

### コンテナの再起動

```bash
# アプリケーションコンテナのみ再起動
docker compose restart app

# すべてのコンテナを再起動
docker compose restart
```

## 🔍 トラブルシューティング

### ポートが既に使用されている場合

`docker-compose.yml`のポート番号を変更してください：

```yaml
ports:
  - "3001:3000"  # ホストの3001ポートにマッピング
```

### データベース接続エラー

```bash
# PostgreSQLコンテナの状態を確認
docker compose ps postgres

# PostgreSQLコンテナのログを確認
docker compose logs postgres
```

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker compose build --no-cache

# コンテナを削除して再作成
docker compose down
docker compose up -d --build
```

### データベースをリセット

```bash
# コンテナとボリュームを削除
docker compose down -v

# 再起動
docker compose up -d
```

## 📝 本番環境へのデプロイ

本番環境では`Dockerfile`を使用してビルドします：

```bash
# 本番用イメージのビルド
docker build -f Dockerfile -t craftflow:latest .

# コンテナの実行
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-secret-key" \
  craftflow:latest
```

## 🎯 次のステップ

1. ブラウザで http://localhost:3000 にアクセス
2. ユーザー登録を行う
3. データベースでユーザーのroleをADMINに変更
4. 管理者機能をテスト

詳細は [NEXT_STEPS.md](./NEXT_STEPS.md) を参照してください。
