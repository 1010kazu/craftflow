# API仕様書

## 認証API

### POST /api/auth/register
新規ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "USER" // デフォルトはUSER、管理者は手動で変更
}
```

**レスポンス:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  },
  "token": "jwt_token"
}
```

### POST /api/auth/login
ログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  },
  "token": "jwt_token"
}
```

### GET /api/auth/me
現在のユーザー情報取得

**ヘッダー:**
```
Authorization: Bearer {token}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER"
}
```

## ゲーム管理API

### GET /api/games
ゲーム一覧取得

**レスポンス:**
```json
{
  "games": [
    {
      "id": "uuid",
      "name": "Factorio",
      "description": "工場建設ゲーム",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/games
ゲーム追加（管理者のみ）

**リクエスト:**
```json
{
  "name": "Factorio",
  "description": "工場建設ゲーム"
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "Factorio",
  "description": "工場建設ゲーム",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### GET /api/games/:id
ゲーム詳細取得

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "Factorio",
  "description": "工場建設ゲーム",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## アイテム管理API

### GET /api/games/:gameId/items
アイテム一覧取得

**クエリパラメータ:**
- `search`: 検索文字列（アイテム名）
- `sort`: ソート順（`name_asc`, `name_desc`）
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）

**レスポンス:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "鉄板",
      "itemType": "MATERIAL",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/games/:gameId/items/:itemId
アイテム詳細取得

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "鉄板",
  "itemType": "MATERIAL",
  "recipe": {
    "id": "uuid",
    "craftTime": 60,
    "outputCount": 1,
    "requiredFacility": {
      "id": "uuid",
      "name": "製錬所"
    },
    "materials": [
      {
        "id": "uuid",
        "quantity": 2,
        "materialItem": {
          "id": "uuid",
          "name": "鉄鉱石"
        }
      }
    ]
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/games/:gameId/items
アイテム追加（管理者のみ）

**リクエスト:**
```json
{
  "name": "鉄板",
  "itemType": "MATERIAL",
  "recipe": {
    "craftTime": 60,
    "outputCount": 1,
    "requiredFacilityId": "uuid",
    "materials": [
      {
        "materialItemId": "uuid",
        "quantity": 2
      }
    ]
  }
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "鉄板",
  "itemType": "MATERIAL",
  "recipe": { ... }
}
```

## レシピツリーAPI

### GET /api/recipes/:recipeId/tree
再帰的レシピツリー取得

**クエリパラメータ:**
- `depth`: 最大深度（デフォルト: 10）

**レスポンス:**
```json
{
  "tree": {
    "item": {
      "id": "uuid",
      "name": "鉄板",
      "itemType": "MATERIAL"
    },
    "recipe": {
      "id": "uuid",
      "craftTime": 60,
      "outputCount": 1,
      "materials": [...]
    },
    "children": [
      {
        "item": {
          "id": "uuid",
          "name": "鉄鉱石",
          "itemType": "MATERIAL"
        },
        "recipe": null, // レシピがない場合
        "children": [],
        "requiredQuantity": 2
      }
    ],
    "requiredQuantity": 1,
    "totalRequiredQuantity": 1
  },
  "materialSummary": [
    {
      "itemId": "uuid",
      "itemName": "鉄鉱石",
      "totalQuantity": 2
    }
  ]
}
```

## インポートAPI

### POST /api/recipes/import
CSV/JSONインポート（管理者のみ）

**リクエスト:**
```
Content-Type: multipart/form-data

file: [CSV or JSON file]
gameId: uuid
format: csv | json
```

**CSV形式:**
```csv
アイテム名,時間(秒),施設,アイテム種別,作成個数,素材1,個数1,素材2,個数2
鉄板,60,製錬所,MATERIAL,1,鉄鉱石,2
```

**JSON形式:**
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

**レスポンス:**
```json
{
  "success": true,
  "imported": 10,
  "errors": [
    {
      "row": 3,
      "message": "アイテム名が重複しています"
    }
  ]
}
```

## エラーレスポンス

すべてのAPIエラーは以下の形式:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

**エラーコード:**
- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限不足
- `NOT_FOUND`: リソースが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `DUPLICATE_ERROR`: 重複エラー
- `INTERNAL_ERROR`: サーバーエラー
