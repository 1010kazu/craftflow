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

- [設計書](./DESIGN.md) - 全体設計
- [データベーススキーマ](./SCHEMA.md) - データベース設計
- [API仕様書](./API_SPEC.md) - APIエンドポイント仕様
- [UI/UX設計書](./UI_DESIGN.md) - 画面設計

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

# データベースのマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

## 📁 プロジェクト構成

```
craftflow/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   ├── (user)/             # 利用者ページ
│   ├── admin/              # 管理者ページ
│   └── api/                # API Routes
├── components/             # Reactコンポーネント
│   ├── common/             # 共通コンポーネント
│   ├── items/              # アイテム関連
│   ├── recipes/            # レシピ関連
│   └── admin/              # 管理者用
├── lib/                    # ユーティリティ
│   ├── db/                 # Prisma設定
│   ├── auth/               # 認証関連
│   └── utils/              # ヘルパー関数
├── types/                  # TypeScript型定義
├── hooks/                  # カスタムフック
├── store/                  # Zustandストア
├── prisma/                 # Prismaスキーマ
├── DESIGN.md               # 設計書
├── SCHEMA.md               # データベーススキーマ
├── API_SPEC.md             # API仕様書
└── UI_DESIGN.md            # UI/UX設計書
```

## 🔐 認証・認可

- ユーザーはメールアドレスとパスワードで登録・ログイン
- ロール: `ADMIN`（管理者）、`USER`（利用者）
- JWTトークンによる認証
- 管理者のみゲーム・アイテム・レシピの追加・編集・削除が可能

## 📊 データモデル

### 主要エンティティ
- **User**: ユーザー情報
- **Game**: ゲームタイトル
- **Item**: アイテム（施設、素材、その他）
- **Recipe**: レシピ（作成時間、必要施設、作成個数）
- **RecipeMaterial**: レシピに必要な素材と数量

詳細は [SCHEMA.md](./SCHEMA.md) を参照してください。

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
