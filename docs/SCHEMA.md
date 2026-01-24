# データベーススキーマ詳細

## Prismaスキーマ

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
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       Item[]

  @@unique([name])
  @@map("games")
}

model Item {
  id          String   @id @default(uuid())
  gameId      String
  name        String
  itemType    ItemType
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  game            Game    @relation(fields: [gameId], references: [id], onDelete: Cascade)
  recipe          Recipe?
  requiredFacilities Recipe[] @relation("RequiredFacility")
  materialRecipes RecipeMaterial[]

  @@unique([gameId, name])
  @@index([gameId, name])
  @@map("items")
}

model Recipe {
  id                String   @id @default(uuid())
  itemId            String   @unique
  craftTime         Int      // 秒
  outputCount       Int      // 作成される個数
  requiredFacilityId String? // 必要な施設（Item.itemType = FACILITY）
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  item              Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  requiredFacility  Item?    @relation("RequiredFacility", fields: [requiredFacilityId], references: [id])
  materials         RecipeMaterial[]

  @@index([itemId])
  @@map("recipes")
}

model RecipeMaterial {
  id             String   @id @default(uuid())
  recipeId       String
  materialItemId String
  quantity       Int      // 必要な個数
  createdAt      DateTime @default(now())

  recipe         Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  materialItem   Item     @relation(fields: [materialItemId], references: [id], onDelete: Cascade)

  @@unique([recipeId, materialItemId])
  @@index([recipeId])
  @@map("recipe_materials")
}
```

## 型定義（TypeScript）

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
  requiredQuantity: number; // 親から必要な数量
  totalRequiredQuantity: number; // 全体での必要数合計
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
```
