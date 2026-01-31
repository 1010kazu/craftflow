# 工業系ゲームレシピ自動化計算Webアプリ 設計書

## 1. 概要

工業系ゲーム（Factorio、Satisfactory等）のレシピを管理し、再帰的にレシピツリーを表示するWebアプリケーション。

## 2. 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.x | フルスタックフレームワーク |
| React | 19.x | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Material-UI (MUI) | 7.x | UIコンポーネント |
| Tailwind CSS | 4.x | ユーティリティCSS |
| React Query | 5.x | データフェッチング・キャッシュ |
| Zustand | 5.x | 状態管理 |

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js API Routes | 16.x | APIエンドポイント |
| PostgreSQL | 16.x | データベース |
| Prisma | 6.x | ORM |
| JWT (jsonwebtoken) | - | 認証トークン |
| bcryptjs | - | パスワードハッシュ |
| Zod | - | バリデーション |

### インフラ
| 技術 | 用途 |
|------|------|
| Docker | コンテナ化 |
| Docker Compose | 開発環境オーケストレーション |

## 3. システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      クライアント                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js (React)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Zustand  │ │  React   │ │   MUI    │            │   │
│  │  │  Store   │ │  Query   │ │Components│            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      サーバー                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Next.js API Routes                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │   JWT    │ │   Zod    │ │  Prisma  │            │   │
│  │  │   Auth   │ │Validation│ │  Client  │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  users   │ │  games   │ │  items   │ │ recipes  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 4. データベース設計

### 4.1 ER図

```
┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │
│ email        │
│ password     │
│ role         │
│ createdAt    │
│ updatedAt    │
└──────────────┘

┌──────────────┐       ┌──────────────┐
│    Game      │       │    Item      │
├──────────────┤       ├──────────────┤
│ id (PK)      │──────<│ id (PK)      │
│ name         │       │ gameId (FK)  │
│ description  │       │ name         │
│ createdAt    │       │ itemType     │
│ updatedAt    │       │ createdAt    │
└──────────────┘       │ updatedAt    │
                       └──────────────┘
                              │
                              │ 1:1
                              ▼
                       ┌──────────────┐
                       │   Recipe     │
                       ├──────────────┤
                       │ id (PK)      │
                       │ itemId (FK)  │
                       │ craftTime    │
                       │ outputCount  │
                       │ requiredFacilityId│
                       │ createdAt    │
                       │ updatedAt    │
                       └──────────────┘
                              │
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │RecipeMaterial│
                       ├──────────────┤
                       │ id (PK)      │
                       │ recipeId (FK)│
                       │ materialItemId│
                       │ quantity     │
                       │ createdAt    │
                       └──────────────┘
```

### 4.2 テーブル詳細

詳細は [SCHEMA.md](./SCHEMA.md) を参照してください。

## 5. 認証・認可設計

### 5.1 認証フロー

```
1. ユーザー登録 (POST /api/auth/register)
   └─> パスワードをbcryptでハッシュ化
   └─> JWTトークンを生成して返却

2. ログイン (POST /api/auth/login)
   └─> パスワードを検証
   └─> JWTトークンを生成して返却

3. 認証済みリクエスト
   └─> Authorizationヘッダーからトークンを取得
   └─> JWTを検証
   └─> ユーザー情報をリクエストに付加
```

### 5.2 権限モデル

| 権限 | 説明 | 許可される操作 |
|------|------|----------------|
| ADMIN | 管理者 | ゲーム・アイテム・レシピのCRUD、インポート、全閲覧機能 |
| USER | 利用者 | ゲーム・アイテム・レシピの閲覧、検索、レシピツリー表示 |

### 5.3 サンプルアカウント

| 権限 | メールアドレス | パスワード |
|------|----------------|------------|
| ADMIN | admin@example.com | password123 |
| USER | user@example.com | password123 |

## 6. API設計

詳細は [API_SPEC.md](./API_SPEC.md) を参照してください。

### 6.1 エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /api/auth/register | ユーザー登録 | 不要 |
| POST | /api/auth/login | ログイン | 不要 |
| GET | /api/auth/me | 現在のユーザー取得 | 必要 |
| GET | /api/games | ゲーム一覧取得 | 不要 |
| POST | /api/games | ゲーム作成 | ADMIN |
| GET | /api/games/:gameId | ゲーム詳細取得 | 不要 |
| PUT | /api/games/:gameId | ゲーム更新 | ADMIN |
| DELETE | /api/games/:gameId | ゲーム削除 | ADMIN |
| GET | /api/games/:gameId/items | アイテム一覧取得 | 不要 |
| POST | /api/games/:gameId/items | アイテム作成 | ADMIN |
| GET | /api/games/:gameId/items/:itemId | アイテム詳細取得 | 不要 |
| PUT | /api/games/:gameId/items/:itemId | アイテム更新 | ADMIN |
| DELETE | /api/games/:gameId/items/:itemId | アイテム削除 | ADMIN |
| POST | /api/recipes | レシピ作成 | ADMIN |
| GET | /api/recipes/:recipeId | レシピ詳細取得 | 不要 |
| PUT | /api/recipes/:recipeId | レシピ更新 | ADMIN |
| DELETE | /api/recipes/:recipeId | レシピ削除 | ADMIN |
| GET | /api/recipes/:recipeId/tree | レシピツリー取得 | 不要 |
| POST | /api/recipes/import | CSV/JSONインポート | ADMIN |

## 7. フロントエンド設計

### 7.1 ページ構成

```
/                          # ホーム（リダイレクト）
/login                     # ログインページ
/register                  # 登録ページ
/games                     # ゲーム選択ページ
/games/:gameId/items       # アイテム一覧ページ
/games/:gameId/items/:itemId # アイテム詳細ページ
/admin/games               # ゲーム管理（管理者）
/admin/games/:gameId/items # アイテム管理（管理者）
```

### 7.2 コンポーネント構成

```
components/
├── common/
│   └── Header.tsx         # 共通ヘッダー（ログアウト機能含む）
└── recipes/
    └── RecipeTree.tsx     # レシピツリー表示
```

### 7.3 状態管理

#### Zustand Store

| ストア | 用途 |
|--------|------|
| auth-store | 認証状態（ユーザー、トークン、ハイドレーション状態） |
| game-store | ゲーム選択状態 |

#### React Query

- ゲーム一覧・詳細の取得とキャッシュ
- アイテム一覧・詳細の取得とキャッシュ
- レシピツリーの取得とキャッシュ

## 8. UI/UX設計

詳細は [UI_DESIGN.md](./UI_DESIGN.md) を参照してください。

### 8.1 画面一覧

| 画面 | 説明 |
|------|------|
| ログイン | メール・パスワードでログイン |
| 登録 | 新規ユーザー登録 |
| ゲーム選択 | ゲームタイトル一覧をカード表示 |
| アイテム一覧 | 検索・ソート・ページネーション付きリスト |
| アイテム詳細 | レシピ情報とレシピツリー |
| ゲーム管理 | ゲームのCRUD（管理者） |
| アイテム管理 | アイテムのCRUD・インポート（管理者） |

### 8.2 ヘッダー機能

- CraftFlowロゴ（ホームへのリンク）
- 管理者バッジ（ADMIN権限時）
- ユーザーメニュー
  - メールアドレス表示
  - 管理者ページリンク（ADMIN権限時）
  - ログアウト

## 9. レシピツリーアルゴリズム

詳細は [ALGORITHM.md](./ALGORITHM.md) を参照してください。

### 9.1 基本機能

1. **再帰的表示**: アイテムのレシピを最下層まで展開
2. **展開/折りたたみ**: 各ノードを個別に制御可能
3. **非表示機能**: ノード以下を非表示にできる
4. **必要数計算**: 親の必要数から子の必要数を自動計算
5. **合計表示**: 全アイテムの必要数合計を表示

### 9.2 計算式

```
子の必要数 = ceil((親の必要数 × レシピの素材数) / レシピの作成個数)
```

## 10. ファイル構成

```
craftflow/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証ページ（グループ）
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (user)/                 # 利用者ページ（グループ）
│   │   └── games/
│   │       ├── page.tsx
│   │       └── [gameId]/items/
│   │           ├── page.tsx
│   │           └── [itemId]/page.tsx
│   ├── admin/                  # 管理者ページ
│   │   └── games/
│   │       ├── page.tsx
│   │       └── [gameId]/items/page.tsx
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   ├── games/
│   │   └── recipes/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/                 # Reactコンポーネント
│   ├── common/Header.tsx
│   └── recipes/RecipeTree.tsx
├── lib/                        # ユーティリティ
│   ├── api/client.ts           # APIクライアント
│   ├── auth/
│   │   ├── jwt.ts              # JWT処理
│   │   └── password.ts         # パスワード処理
│   ├── db/prisma.ts            # Prismaクライアント
│   └── utils/
│       ├── api.ts              # APIヘルパー
│       ├── auth-middleware.ts  # 認証ミドルウェア
│       └── recipe-tree.ts      # レシピツリーロジック
├── types/index.ts              # TypeScript型定義
├── hooks/useHydration.ts       # カスタムフック
├── store/                      # Zustandストア
│   ├── auth-store.ts
│   └── game-store.ts
├── prisma/schema.prisma        # Prismaスキーマ
├── docs/                       # 設計ドキュメント
│   ├── DESIGN.md
│   ├── SCHEMA.md
│   ├── API_SPEC.md
│   ├── UI_DESIGN.md
│   └── ALGORITHM.md
├── docker-compose.yml          # Docker Compose設定
├── Dockerfile                  # 本番用Dockerfile
├── Dockerfile.dev              # 開発用Dockerfile
└── package.json
```

## 11. 開発環境

### 11.1 Docker Compose構成

```yaml
services:
  postgres:     # PostgreSQLデータベース
  app:          # Next.jsアプリケーション
```

### 11.2 起動方法

```bash
# コンテナ起動
docker compose up -d

# ログ確認
docker compose logs -f app

# 停止
docker compose down
```

### 11.3 環境変数

| 変数 | 説明 |
|------|------|
| DATABASE_URL | PostgreSQL接続文字列 |
| JWT_SECRET | JWTシークレットキー |
| NEXT_PUBLIC_API_BASE_URL | APIベースURL |

## 12. セキュリティ

### 12.1 認証

- JWTトークンによる認証
- パスワードはbcryptでハッシュ化（ソルトラウンド: 10）
- トークンの有効期限: 7日

### 12.2 認可

- ロールベースアクセス制御（RBAC）
- 管理者専用エンドポイントのミドルウェア保護

### 12.3 入力検証

- Zodによるサーバーサイドバリデーション
- Prismaによるクエリパラメータ化（SQLインジェクション対策）
- ReactによるXSS自動エスケープ

## 13. パフォーマンス

### 13.1 データベース

- インデックス: `items(gameId, name)`, `recipes(itemId)`
- カスケード削除による整合性維持

### 13.2 フロントエンド

- React Queryによるキャッシュ（staleTime: 60秒）
- ページネーション（デフォルト: 20件/ページ）
- SSRハイドレーション対応
