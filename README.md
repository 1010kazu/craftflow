# 工業系ゲームレシピ自動化計算Webアプリ

工業系ゲームのレシピを管理し、再帰的にレシピツリーを表示するWebアプリケーション。

## 📋 概要

このアプリケーションは、工業系ゲーム（Factorio、Satisfactory等）のアイテムレシピを管理し、アイテム作成に必要な素材を再帰的に計算・表示するためのツールです。

## ✨ 主な機能

### 利用者機能
- ゲームタイトルの選択
- アイテム一覧の表示・検索・ソート
- アイテム詳細の表示
- 再帰的レシピツリーの表示
- 必要素材数の自動計算

### 管理者機能
- ゲームタイトルの追加・編集・削除
- アイテム・レシピの追加・編集・削除
- CSV/JSON形式での一括インポート

## 🏗️ 設計ドキュメント

- [設計書](./docs/DESIGN.md) - 全体設計・システムアーキテクチャ
- [データベーススキーマ](./docs/SCHEMA.md) - データベース設計・型定義
- [API仕様書](./docs/API_SPEC.md) - APIエンドポイント仕様
- [UI/UX設計書](./docs/UI_DESIGN.md) - 画面設計・コンポーネント
- [アルゴリズム](./docs/ALGORITHM.md) - レシピツリーアルゴリズム

## 🚀 技術スタック

### フロントエンド
- React (TypeScript)
- Material-UI / Tailwind CSS
- React Query
- Zustand
- React Router
- React Hook Form

### バックエンド
- Node.js + Express / Next.js
- PostgreSQL
- Prisma
- JWT認証

## 📦 セットアップ

### 必要な環境
- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

### インストール手順

```bash
# リポジトリのクローン
git clone <repository-url>
cd craftflow

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報等を設定
# DATABASE_URL="postgresql://user:password@localhost:5432/craftflow?schema=public"
# JWT_SECRET="your-secret-key-change-in-production"

# Prismaクライアントの生成
npm run db:generate

# データベースのマイグレーション
npm run db:migrate
# または、開発環境では以下でも可
npm run db:push

# 開発サーバーの起動
npm run dev
```

### 初回セットアップ後の注意事項

1. データベースが作成されていない場合は、PostgreSQLでデータベースを作成してください
2. `.env`ファイルに`DATABASE_URL`と`JWT_SECRET`を設定してください
3. 管理者ユーザーを作成するには、データベースで直接`role`を`ADMIN`に変更するか、シードスクリプトを使用してください

## 📁 プロジェクト構成

```
craftflow/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証ページ（login, register）
│   ├── (user)/             # 利用者ページ（games, items）
│   ├── admin/              # 管理者ページ
│   └── api/                # API Routes
├── components/             # Reactコンポーネント
│   ├── common/             # 共通コンポーネント（Header）
│   └── recipes/            # レシピ関連（RecipeTree）
├── lib/                    # ユーティリティ
│   ├── api/                # APIクライアント
│   ├── db/                 # Prisma設定
│   ├── auth/               # 認証関連（jwt, password）
│   └── utils/              # ヘルパー関数
├── types/                  # TypeScript型定義
├── hooks/                  # カスタムフック
├── store/                  # Zustandストア
├── prisma/                 # Prismaスキーマ
├── docs/                   # 設計ドキュメント
│   ├── DESIGN.md           # 全体設計
│   ├── SCHEMA.md           # データベーススキーマ
│   ├── API_SPEC.md         # API仕様書
│   ├── UI_DESIGN.md        # UI/UX設計書
│   └── ALGORITHM.md        # アルゴリズム
├── docker-compose.yml      # Docker Compose設定
├── Dockerfile              # 本番用Dockerfile
└── Dockerfile.dev          # 開発用Dockerfile
```

## 🔐 認証・認可

- ユーザーはメールアドレスとパスワードで登録・ログイン
- JWTトークンによる認証

### ユーザー権限

| 権限 | 説明 | できること |
|------|------|------------|
| **ADMIN**（管理者） | システム全体を管理する権限 | ゲームタイトルの追加・編集・削除、アイテム・レシピの追加・編集・削除、CSV/JSONインポート、全利用者機能 |
| **USER**（利用者） | 一般的な閲覧権限 | ゲーム選択、アイテム一覧の表示・検索・ソート、アイテム詳細の表示、レシピツリーの表示、必要素材数の確認 |

### サンプルアカウント

開発・テスト用のサンプルアカウントが用意されています。

| 権限 | メールアドレス | パスワード |
|------|----------------|------------|
| ADMIN（管理者） | admin@example.com | password123 |
| USER（利用者） | user@example.com | password123 |

> ⚠️ **注意**: 本番環境では必ずサンプルアカウントを削除し、セキュアなパスワードを使用してください。

## 📊 データモデル

### 主要エンティティ
- **User**: ユーザー情報
- **Game**: ゲームタイトル
- **Item**: アイテム（施設、素材、その他）
- **Recipe**: レシピ（作成時間、必要施設、作成個数）
- **RecipeMaterial**: レシピに必要な素材と数量

詳細は [SCHEMA.md](./docs/SCHEMA.md) を参照してください。

## 🔄 レシピツリー機能

レシピツリーは以下の機能を提供します：

1. **再帰的表示**: アイテムのレシピを再帰的に展開し、最下層まで表示
2. **展開/折りたたみ**: 各ノードを個別に展開・折りたたみ可能
3. **非表示機能**: 各ノードを非表示にすることで、その子ノードも非表示
4. **必要数計算**: 各アイテムの必要数を自動計算し、合計を表示

### 例
```
鉄板 (必要数: 1)
├─ 鉄鉱石 × 2
└─ 製錬所

必要数合計:
• 鉄鉱石: 2個
```

## 📥 インポート機能

### CSV形式
```csv
アイテム名,時間(秒),施設,アイテム種別,作成個数,素材1,個数1,素材2,個数2
鉄板,60,製錬所,MATERIAL,1,鉄鉱石,2
```

### JSON形式
```json
{
  "items": [
    {
      "name": "鉄板",
      "craftTime": 60,
      "requiredFacility": "製錬所",
      "itemType": "MATERIAL",
      "outputCount": 1,
      "materials": [
        { "name": "鉄鉱石", "quantity": 2 }
      ]
    }
  ]
}
```

## 🧪 テスト

```bash
# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずイシューを開いて変更内容を議論してください。

## 📧 お問い合わせ

質問や提案がある場合は、イシューを作成してください。
