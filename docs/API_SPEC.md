# API仕様書

## 1. 概要

Next.js API Routesを使用したRESTful APIです。

### 1.1 ベースURL

```
/api
```

### 1.2 認証

JWTトークンをAuthorizationヘッダーで送信します。

```
Authorization: Bearer {token}
```

### 1.3 レスポンス形式

**成功時:**
```json
{
  "data": { ... }
}
```

**エラー時:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  }
}
```

---

## 2. 認証API

### POST /api/auth/register

新規ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (201 Created):**
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

**エラー:**
- `400` - バリデーションエラー
- `409` - メールアドレスが既に登録済み

---

### POST /api/auth/login

ログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200 OK):**
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

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証失敗（メールアドレスまたはパスワードが不正）

---

### GET /api/auth/me

現在のユーザー情報取得

**ヘッダー:**
```
Authorization: Bearer {token}
```

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**エラー:**
- `401` - 認証が必要

---

## 3. ゲーム管理API

### GET /api/games

ゲーム一覧取得（認証不要）

**レスポンス (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Factorio",
    "description": "工場建設ゲーム",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### POST /api/games

ゲーム追加（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "name": "Factorio",
  "description": "工場建設ゲーム"
}
```

**レスポンス (201 Created):**
```json
{
  "id": "uuid",
  "name": "Factorio",
  "description": "工場建設ゲーム",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証が必要
- `403` - 管理者権限が必要
- `409` - ゲーム名が既に存在

---

### GET /api/games/:gameId

ゲーム詳細取得（認証不要）

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "name": "Factorio",
  "description": "工場建設ゲーム",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**エラー:**
- `404` - ゲームが見つからない

---

### PUT /api/games/:gameId

ゲーム更新（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "name": "Factorio",
  "description": "更新された説明"
}
```

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "name": "Factorio",
  "description": "更新された説明",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証が必要
- `403` - 管理者権限が必要
- `404` - ゲームが見つからない

---

### DELETE /api/games/:gameId

ゲーム削除（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**レスポンス (200 OK):**
```json
{
  "message": "ゲームを削除しました"
}
```

**エラー:**
- `401` - 認証が必要
- `403` - 管理者権限が必要
- `404` - ゲームが見つからない

---

## 4. アイテム管理API

### GET /api/games/:gameId/items

アイテム一覧取得（認証不要）

**クエリパラメータ:**
| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| search | string | - | アイテム名の部分一致検索 |
| sort | string | name_asc | ソート順（name_asc, name_desc） |
| page | number | 1 | ページ番号 |
| limit | number | 20 | 1ページあたりの件数 |

**レスポンス (200 OK):**
```json
{
  "items": [
    {
      "id": "uuid",
      "gameId": "uuid",
      "name": "鉄板",
      "itemType": "MATERIAL",
      "hasRecipe": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "gameId": "uuid",
      "name": "鉄鉱石",
      "itemType": "MATERIAL",
      "hasRecipe": false,
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

**アイテムオブジェクト:**
| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | アイテムID |
| gameId | string | ゲームID |
| name | string | アイテム名 |
| itemType | string | アイテム種別（FACILITY/MATERIAL/OTHER） |
| hasRecipe | boolean | レシピが登録されているかどうか |
| createdAt | string | 作成日時 |

---

### GET /api/games/:gameId/items/:itemId

アイテム詳細取得（認証不要）

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "gameId": "uuid",
  "name": "鉄板",
  "itemType": "MATERIAL",
  "recipe": {
    "id": "uuid",
    "craftTime": 60,
    "outputCount": 1,
    "requiredFacility": {
      "id": "uuid",
      "name": "製錬所",
      "itemType": "FACILITY"
    },
    "materials": [
      {
        "id": "uuid",
        "quantity": 2,
        "materialItem": {
          "id": "uuid",
          "name": "鉄鉱石",
          "itemType": "MATERIAL"
        }
      }
    ]
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**エラー:**
- `404` - アイテムが見つからない

---

### POST /api/games/:gameId/items

アイテム追加（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "name": "鉄板",
  "itemType": "MATERIAL"
}
```

**レスポンス (201 Created):**
```json
{
  "id": "uuid",
  "gameId": "uuid",
  "name": "鉄板",
  "itemType": "MATERIAL",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証が必要
- `403` - 管理者権限が必要
- `404` - ゲームが見つからない
- `409` - アイテム名が既に存在

---

### PUT /api/games/:gameId/items/:itemId

アイテム更新（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "name": "鉄板",
  "itemType": "MATERIAL"
}
```

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "gameId": "uuid",
  "name": "鉄板",
  "itemType": "MATERIAL",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### DELETE /api/games/:gameId/items/:itemId

アイテム削除（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**レスポンス (200 OK):**
```json
{
  "message": "アイテムを削除しました"
}
```

---

## 5. レシピ管理API

### POST /api/recipes

レシピ追加（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "itemId": "uuid",
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
```

**レスポンス (201 Created):**
```json
{
  "id": "uuid",
  "itemId": "uuid",
  "craftTime": 60,
  "outputCount": 1,
  "requiredFacilityId": "uuid",
  "materials": [
    {
      "id": "uuid",
      "materialItemId": "uuid",
      "quantity": 2
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### GET /api/recipes/:recipeId

レシピ詳細取得（認証不要）

**レスポンス (200 OK):**
```json
{
  "id": "uuid",
  "itemId": "uuid",
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
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### PUT /api/recipes/:recipeId

レシピ更新（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**リクエスト:**
```json
{
  "craftTime": 120,
  "outputCount": 2,
  "requiredFacilityId": "uuid",
  "materials": [
    {
      "materialItemId": "uuid",
      "quantity": 4
    }
  ]
}
```

---

### DELETE /api/recipes/:recipeId

レシピ削除（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
```

**レスポンス (200 OK):**
```json
{
  "message": "レシピを削除しました"
}
```

---

## 6. レシピツリーAPI

### GET /api/recipes/:recipeId/tree

再帰的レシピツリー取得（認証不要）

**クエリパラメータ:**
| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| depth | number | 10 | 最大展開深度 |
| quantity | number | 1 | 必要数 |

**レスポンス (200 OK):**
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
        "recipe": null,
        "children": [],
        "requiredQuantity": 2,
        "totalRequiredQuantity": 2
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

---

## 7. インポートAPI

### POST /api/recipes/import

CSV/JSONインポート（管理者のみ）

**ヘッダー:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**リクエスト:**
```
file: [ファイル]
gameId: uuid
format: csv | json
```

**CSV形式:**
```csv
アイテム名,時間(秒),施設,アイテム種別,作成個数,素材1,個数1,素材2,個数2
鉄板,60,製錬所,MATERIAL,1,鉄鉱石,2
銅板,60,製錬所,MATERIAL,1,銅鉱石,2
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

**レスポンス (200 OK):**
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

---

## 8. エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | 権限不足（管理者権限が必要） |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | バリデーションエラー |
| DUPLICATE_ERROR | 409 | 重複エラー |
| INTERNAL_ERROR | 500 | サーバーエラー |

---

## 9. 認証フロー

```
1. ユーザー登録/ログイン
   POST /api/auth/register または POST /api/auth/login
   ↓
   JWTトークンを取得

2. 認証が必要なAPIを呼び出し
   Authorization: Bearer {token}
   ↓
   サーバーでトークンを検証
   ↓
   ユーザー情報をリクエストに付加

3. 管理者専用API
   ユーザーのroleがADMINか確認
   ↓
   ADMIN以外は403エラー
```
