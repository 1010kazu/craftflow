# データベーススキーマ詳細

## 1. 概要

PostgreSQL 16を使用し、Prisma ORMでデータアクセスを行います。

## 2. Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  USER
}

enum ItemType {
  FACILITY    // 施設
  MATERIAL    // 素材
  OTHER       // その他
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Game {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       Item[]

  @@map("games")
}

model Item {
  id          String   @id @default(uuid())
  gameId      String
  name        String
  itemType    ItemType
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  game               Game             @relation(fields: [gameId], references: [id], onDelete: Cascade)
  recipe             Recipe?
  requiredFacilities Recipe[]         @relation("RequiredFacility")
  materialRecipes    RecipeMaterial[]

  @@unique([gameId, name])
  @@index([gameId, name])
  @@map("items")
}

model Recipe {
  id                 String   @id @default(uuid())
  itemId             String   @unique
  craftTime          Int      // 秒
  outputCount        Int      // 作成される個数
  requiredFacilityId String?  // 必要な施設（Item.itemType = FACILITY）
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  item             Item             @relation(fields: [itemId], references: [id], onDelete: Cascade)
  requiredFacility Item?            @relation("RequiredFacility", fields: [requiredFacilityId], references: [id])
  materials        RecipeMaterial[]

  @@index([itemId])
  @@map("recipes")
}

model RecipeMaterial {
  id             String   @id @default(uuid())
  recipeId       String
  materialItemId String
  quantity       Int      // 必要な個数
  createdAt      DateTime @default(now())

  recipe       Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  materialItem Item   @relation(fields: [materialItemId], references: [id], onDelete: Cascade)

  @@unique([recipeId, materialItemId])
  @@index([recipeId])
  @@map("recipe_materials")
}
```

## 3. テーブル定義

### 3.1 users（ユーザー）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 一意識別子 |
| email | TEXT | UNIQUE, NOT NULL | メールアドレス |
| password | TEXT | NOT NULL | ハッシュ化されたパスワード |
| role | UserRole | NOT NULL, DEFAULT 'USER' | 権限 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

### 3.2 games（ゲーム）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 一意識別子 |
| name | TEXT | UNIQUE, NOT NULL | ゲーム名 |
| description | TEXT | NULL | 説明 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

### 3.3 items（アイテム）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 一意識別子 |
| gameId | UUID | FK (games.id), NOT NULL | ゲームID |
| name | TEXT | NOT NULL | アイテム名 |
| itemType | ItemType | NOT NULL | アイテム種別 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

**インデックス:**
- `UNIQUE(gameId, name)` - 同一ゲーム内でアイテム名は一意
- `INDEX(gameId, name)` - 検索最適化

### 3.4 recipes（レシピ）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 一意識別子 |
| itemId | UUID | FK (items.id), UNIQUE, NOT NULL | アイテムID |
| craftTime | INT | NOT NULL | 作成時間（秒） |
| outputCount | INT | NOT NULL | 作成個数 |
| requiredFacilityId | UUID | FK (items.id), NULL | 必要な施設 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |
| updatedAt | TIMESTAMP | NOT NULL | 更新日時 |

**インデックス:**
- `UNIQUE(itemId)` - 1アイテム = 1レシピ
- `INDEX(itemId)` - 検索最適化

### 3.5 recipe_materials（レシピ素材）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 一意識別子 |
| recipeId | UUID | FK (recipes.id), NOT NULL | レシピID |
| materialItemId | UUID | FK (items.id), NOT NULL | 素材アイテムID |
| quantity | INT | NOT NULL | 必要個数 |
| createdAt | TIMESTAMP | NOT NULL | 作成日時 |

**インデックス:**
- `UNIQUE(recipeId, materialItemId)` - 同一レシピ内で素材は一意
- `INDEX(recipeId)` - 検索最適化

## 4. 列挙型

### 4.1 UserRole

| 値 | 説明 |
|----|------|
| ADMIN | 管理者（全機能へのアクセス可能） |
| USER | 利用者（閲覧機能のみ） |

### 4.2 ItemType

| 値 | 説明 |
|----|------|
| FACILITY | 施設（製造装置など） |
| MATERIAL | 素材（原材料、中間素材など） |
| OTHER | その他 |

## 5. TypeScript型定義

```typescript
// types/index.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum ItemType {
  FACILITY = 'FACILITY',
  MATERIAL = 'MATERIAL',
  OTHER = 'OTHER',
}

// 基本型
export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  gameId: string;
  name: string;
  itemType: ItemType;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  itemId: string;
  craftTime: number;
  outputCount: number;
  requiredFacilityId?: string;
  createdAt: Date;
}

export interface RecipeMaterial {
  id: string;
  recipeId: string;
  materialItemId: string;
  quantity: number;
}

// 拡張型（リレーション含む）
export interface ItemWithRecipe extends Item {
  recipe?: RecipeWithMaterials;
}

export interface RecipeWithMaterials extends Recipe {
  materials: (RecipeMaterial & { materialItem: Item })[];
  requiredFacility?: Item;
}

export interface RecipeTreeNode {
  item: Item;
  recipe?: RecipeWithMaterials;
  children: RecipeTreeNode[];
  isExpanded: boolean;
  isVisible: boolean;
  requiredQuantity: number;
  totalRequiredQuantity: number;
}

// フォーム型
export interface GameFormData {
  name: string;
  description?: string;
}

export interface ItemFormData {
  name: string;
  itemType: ItemType;
}

export interface RecipeFormData {
  craftTime: number;
  outputCount: number;
  requiredFacilityId?: string;
  materials: {
    materialItemId: string;
    quantity: number;
  }[];
}

// インポート型
export interface ImportItemData {
  name: string;
  craftTime: number;
  requiredFacility?: string;
  itemType: ItemType;
  outputCount: number;
  materials: {
    name: string;
    quantity: number;
  }[];
}

// APIレスポンス型
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 6. リレーション図

```
User (独立)

Game ─────────< Item ─────────< Recipe ─────────< RecipeMaterial
  │               │                │                    │
  │ 1:N           │ 1:1            │ 1:N                │
  │               │                │                    │
  │               │                └── requiredFacility─┘
  │               │                     (Item FK)
  │               │
  │               └── materialItem ─────────────────────┘
  │                   (RecipeMaterial FK)
  │
  └── ゲームを削除すると、関連するアイテム・レシピもカスケード削除
```

## 7. 制約とバリデーション

### 7.1 ユニーク制約

- `users.email` - メールアドレスの一意性
- `games.name` - ゲーム名の一意性
- `items(gameId, name)` - 同一ゲーム内でアイテム名の一意性
- `recipes.itemId` - アイテムとレシピの1:1関係
- `recipe_materials(recipeId, materialItemId)` - 同一レシピ内で素材の一意性

### 7.2 外部キー制約

- `items.gameId` → `games.id` (CASCADE DELETE)
- `recipes.itemId` → `items.id` (CASCADE DELETE)
- `recipes.requiredFacilityId` → `items.id` (SET NULL on delete)
- `recipe_materials.recipeId` → `recipes.id` (CASCADE DELETE)
- `recipe_materials.materialItemId` → `items.id` (CASCADE DELETE)

### 7.3 アプリケーション層バリデーション

| フィールド | バリデーション |
|------------|----------------|
| email | メール形式、必須 |
| password | 最小6文字、必須 |
| craftTime | 0以上の整数、必須 |
| outputCount | 1以上の整数、必須 |
| quantity | 1以上の整数、必須 |
| requiredFacilityId | ItemType=FACILITY のアイテムのみ |
