# 工業系ゲームレシピ自動化計算Webアプリ 設計書

## 1. 概要

工業系ゲームのレシピを管理し、再帰的にレシピツリーを表示するWebアプリケーション。

## 2. 技術スタック

### フロントエンド
- **フレームワーク**: React (TypeScript)
- **UIライブラリ**: Material-UI (MUI) または Tailwind CSS
- **状態管理**: React Query + Zustand
- **ルーティング**: React Router
- **フォーム管理**: React Hook Form
- **CSV/JSONパーサー**: papaparse (CSV), 標準JSON

### バックエンド
- **フレームワーク**: Node.js + Express または Next.js (Full-stack)
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: JWT + bcrypt
- **バリデーション**: Zod

### インフラ
- **コンテナ**: Docker
- **デプロイ**: Vercel / Railway / AWS

## 3. データベース設計

### 3.1 ER図

```
User (ユーザー)
├── id: UUID (PK)
├── email: String (Unique)
├── password: String (Hashed)
├── role: Enum (ADMIN, USER)
└── createdAt: DateTime

Game (ゲームタイトル)
├── id: UUID (PK)
├── name: String
├── description: String (Optional)
└── createdAt: DateTime

Item (アイテム)
├── id: UUID (PK)
├── gameId: UUID (FK -> Game.id)
├── name: String
├── itemType: Enum (FACILITY, MATERIAL, OTHER)
└── createdAt: DateTime

Recipe (レシピ)
├── id: UUID (PK)
├── itemId: UUID (FK -> Item.id, Unique)
├── craftTime: Integer (秒)
├── outputCount: Integer (作成される個数)
├── requiredFacilityId: UUID (FK -> Item.id, Nullable)
└── createdAt: DateTime

RecipeMaterial (レシピ素材)
├── id: UUID (PK)
├── recipeId: UUID (FK -> Recipe.id)
├── materialItemId: UUID (FK -> Item.id)
├── quantity: Integer (必要な個数)
└── createdAt: DateTime
```

### 3.2 データモデル詳細

#### User
- 認証情報と権限を管理
- role: ADMIN | USER

#### Game
- 工業系ゲームタイトルを管理
- 管理者のみ追加可能

#### Item
- アイテムの基本情報
- itemType: FACILITY（施設）| MATERIAL（素材）| OTHER（その他）
- 同じゲーム内で名前は一意

#### Recipe
- アイテムの作成レシピ
- requiredFacilityId: 必要な施設（Item.itemType = FACILITY のもの）
- 1アイテム = 1レシピ（1対1）

#### RecipeMaterial
- レシピに必要な素材と数量
- 1レシピ = 複数素材（1対多）

## 4. API設計

### 4.1 認証API

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 4.2 ゲーム管理API（管理者のみ）

```
GET    /api/games              # ゲーム一覧取得
POST   /api/games              # ゲーム追加
GET    /api/games/:id          # ゲーム詳細取得
PUT    /api/games/:id          # ゲーム更新
DELETE /api/games/:id          # ゲーム削除
```

### 4.3 アイテム管理API

```
GET    /api/games/:gameId/items           # アイテム一覧取得（検索・ソート対応）
GET    /api/games/:gameId/items/:itemId   # アイテム詳細取得
POST   /api/games/:gameId/items           # アイテム追加（管理者のみ）
PUT    /api/games/:gameId/items/:itemId   # アイテム更新（管理者のみ）
DELETE /api/games/:gameId/items/:itemId   # アイテム削除（管理者のみ）
```

### 4.4 レシピ管理API（管理者のみ）

```
GET    /api/recipes/:recipeId              # レシピ詳細取得
POST   /api/recipes                         # レシピ追加
PUT    /api/recipes/:recipeId               # レシピ更新
DELETE /api/recipes/:recipeId               # レシピ削除
POST   /api/recipes/import                  # CSV/JSONインポート
```

### 4.5 レシピツリーAPI

```
GET /api/recipes/:recipeId/tree             # 再帰的レシピツリー取得
```

## 5. フロントエンド設計

### 5.1 ページ構成

```
/                          # ログイン/ホーム
/login                     # ログインページ
/register                  # 登録ページ
/games                     # ゲーム選択ページ
/games/:gameId/items       # アイテム一覧ページ
/games/:gameId/items/:itemId # アイテム詳細ページ
/admin/games               # ゲーム管理（管理者）
/admin/games/:gameId/items # アイテム管理（管理者）
```

### 5.2 コンポーネント設計

#### 共通コンポーネント
- `Layout`: 共通レイアウト（ヘッダー、サイドバー）
- `ProtectedRoute`: 認証保護ルート
- `AdminRoute`: 管理者専用ルート
- `SearchBar`: 検索バー
- `SortButton`: ソートボタン

#### アイテム一覧ページ
- `ItemList`: アイテム一覧表示
- `ItemCard`: アイテムカード
- `ItemFilters`: フィルター（検索、ソート）

#### アイテム詳細ページ
- `ItemDetail`: アイテム詳細表示
- `RecipeDisplay`: レシピ表示
- `RecipeTree`: 再帰的レシピツリー
- `RecipeTreeNode`: ツリーノード（展開/折りたたみ）
- `MaterialSummary`: 必要数合計表示

#### 管理者ページ
- `GameForm`: ゲーム追加/編集フォーム
- `ItemForm`: アイテム追加/編集フォーム
- `RecipeForm`: レシピ追加/編集フォーム
- `ImportDialog`: CSV/JSONインポートダイアログ

### 5.3 状態管理

#### Zustandストア
- `authStore`: 認証状態
- `gameStore`: ゲーム選択状態
- `uiStore`: UI状態（モーダル、ローディング等）

#### React Query
- データフェッチングとキャッシュ管理
- アイテム一覧、詳細、レシピツリー等

## 6. 機能詳細設計

### 6.1 レシピツリー表示

#### データ構造
```typescript
interface RecipeTreeNode {
  item: Item;
  recipe: Recipe;
  materials: RecipeMaterial[];
  children: RecipeTreeNode[]; // 再帰的
  isExpanded: boolean;
  requiredQuantity: number; // 親から必要な数量
}
```

#### アルゴリズム
1. ルートアイテムのレシピを取得
2. 各素材アイテムについて再帰的にレシピを取得
3. 素材がレシピを持たない（最下層）まで展開
4. 各ノードで展開/折りたたみ状態を管理

#### 必要数計算
- 各アイテムの必要数を再帰的に計算
- 親の必要数 × レシピの必要数 = 子の必要数
- 同じアイテムが複数箇所で使用される場合は合算

### 6.2 CSV/JSONインポート

#### CSV形式
```csv
アイテム名,時間(秒),施設,アイテム種別,作成個数,素材1,個数1,素材2,個数2,...
鉄板,60,製錬所,素材,1,鉄鉱石,2
```

#### JSON形式
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

### 6.3 バリデーション

#### レシピ追加時のバリデーション
- アイテム名: 必須、同一ゲーム内で一意
- 時間: 必須、0以上の整数
- 施設: アイテム種別がFACILITYのアイテムのみ選択可能
- アイテム種別: 必須、FACILITY | MATERIAL | OTHER
- 作成個数: 必須、1以上の整数
- 素材: 少なくとも1つ必要、すべてのアイテムから選択可能
- 素材個数: 1以上の整数

## 7. セキュリティ設計

### 7.1 認証・認可
- JWTトークンによる認証
- ロールベースアクセス制御（RBAC）
- パスワードはbcryptでハッシュ化

### 7.2 入力検証
- サーバーサイドでのバリデーション必須
- SQLインジェクション対策（Prisma使用）
- XSS対策（Reactの自動エスケープ）

### 7.3 レート制限
- API呼び出しのレート制限
- インポート機能の制限

## 8. パフォーマンス最適化

### 8.1 データベース
- インデックス: Item(gameId, name), Recipe(itemId)
- クエリ最適化: 必要最小限のJOIN

### 8.2 フロントエンド
- レシピツリーの仮想スクロール（大量データ対応）
- メモ化による再レンダリング最適化
- ページネーション（アイテム一覧）

## 9. 開発計画

### Phase 1: 基盤構築
- プロジェクトセットアップ
- データベース設計・実装
- 認証機能実装

### Phase 2: 管理者機能
- ゲーム管理
- アイテム・レシピ管理
- CSV/JSONインポート

### Phase 3: 利用者機能
- アイテム一覧・検索
- アイテム詳細
- レシピツリー表示

### Phase 4: 最適化・テスト
- パフォーマンス最適化
- テスト実装
- UI/UX改善

## 10. ファイル構成（Next.js想定）

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
└── prisma/                 # Prismaスキーマ
```
