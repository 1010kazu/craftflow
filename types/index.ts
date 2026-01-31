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
  hasRecipe?: boolean; // 一覧取得時にレシピ有無を示すフラグ
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
