# レシピツリーアルゴリズム詳細

## 1. 概要

レシピツリーは、アイテムの作成に必要な素材を再帰的に展開し、ツリー構造で表示する機能です。各ノードで展開/折りたたみや非表示が可能で、必要素材数の自動計算も行います。

## 2. データ構造

### 2.1 RecipeTreeNode

```typescript
interface RecipeTreeNode {
  item: Item;                    // アイテム情報
  recipe?: RecipeWithMaterials;  // レシピ情報（存在しない場合もある）
  children: RecipeTreeNode[];    // 子ノード（再帰的）
  isExpanded: boolean;           // 展開状態
  isVisible: boolean;            // 表示状態
  requiredQuantity: number;      // 親から必要な数量
  totalRequiredQuantity: number;  // 全体での必要数合計（重複考慮）
}
```

### 2.2 状態管理

```typescript
interface TreeState {
  nodes: Map<string, TreeNodeState>; // itemId -> 状態
}

interface TreeNodeState {
  isExpanded: boolean;
  isVisible: boolean;
}
```

## 3. ツリー構築アルゴリズム

### 3.1 基本アルゴリズム

```typescript
function buildRecipeTree(
  itemId: string,
  requiredQuantity: number = 1,
  depth: number = 0,
  maxDepth: number = 10,
  visited: Set<string> = new Set()
): RecipeTreeNode {
  // 無限ループ防止
  if (visited.has(itemId) || depth > maxDepth) {
    return createLeafNode(itemId, requiredQuantity);
  }

  visited.add(itemId);
  
  const item = getItem(itemId);
  const recipe = getRecipe(itemId);
  
  const node: RecipeTreeNode = {
    item,
    recipe,
    children: [],
    isExpanded: true,
    isVisible: true,
    requiredQuantity,
    totalRequiredQuantity: requiredQuantity
  };

  // レシピがない場合は葉ノード
  if (!recipe) {
    visited.delete(itemId);
    return node;
  }

  // 各素材について再帰的にツリーを構築
  for (const material of recipe.materials) {
    const childQuantity = calculateChildQuantity(
      requiredQuantity,
      material.quantity,
      recipe.outputCount
    );
    
    const childNode = buildRecipeTree(
      material.materialItemId,
      childQuantity,
      depth + 1,
      maxDepth,
      visited
    );
    
    node.children.push(childNode);
  }

  visited.delete(itemId);
  return node;
}
```

### 3.2 必要数計算

```typescript
function calculateChildQuantity(
  parentQuantity: number,    // 親アイテムの必要数
  materialQuantity: number,   // レシピでの必要数
  outputCount: number         // レシピでの作成個数
): number {
  // 親の必要数に対して、レシピの比率を適用
  // 例: 親が2個必要で、レシピが1個作成に素材3個必要なら
  //     子は 2 * 3 / 1 = 6個必要
  return Math.ceil((parentQuantity * materialQuantity) / outputCount);
}
```

## 4. 必要数合計の計算

### 4.1 問題

同じアイテムが複数の箇所で使用される場合、合計を計算する必要があります。

例:
```
アイテムA (必要数: 1)
├─ アイテムB × 2
└─ アイテムC × 1
    └─ アイテムB × 3
```

この場合、アイテムBは 2 + 3 = 5個必要です。

### 4.2 アルゴリズム

```typescript
function calculateMaterialSummary(
  tree: RecipeTreeNode
): Map<string, number> {
  const summary = new Map<string, number>();
  
  function traverse(node: RecipeTreeNode) {
    // このノード自体が素材として必要
    if (node.requiredQuantity > 0) {
      const current = summary.get(node.item.id) || 0;
      summary.set(node.item.id, current + node.requiredQuantity);
    }
    
    // 子ノードを再帰的に処理
    for (const child of node.children) {
      if (child.isVisible) {
        traverse(child);
      }
    }
  }
  
  traverse(tree);
  return summary;
}
```

### 4.3 最適化版（重複排除）

ツリー内で同じアイテムが複数回出現する場合、より効率的に計算:

```typescript
function calculateMaterialSummaryOptimized(
  tree: RecipeTreeNode
): Map<string, number> {
  const summary = new Map<string, number>();
  const itemPaths = new Map<string, Set<string>>(); // itemId -> パスの集合
  
  function traverse(node: RecipeTreeNode, path: string = '') {
    const currentPath = path ? `${path}.${node.item.id}` : node.item.id;
    
    // パスを記録（同じアイテムでも異なるパスなら別カウント）
    if (!itemPaths.has(node.item.id)) {
      itemPaths.set(node.item.id, new Set());
    }
    itemPaths.get(node.item.id)!.add(currentPath);
    
    // 必要数を加算
    if (node.requiredQuantity > 0) {
      const current = summary.get(node.item.id) || 0;
      summary.set(node.item.id, current + node.requiredQuantity);
    }
    
    // 子ノードを処理
    for (const child of node.children) {
      if (child.isVisible) {
        traverse(child, currentPath);
      }
    }
  }
  
  traverse(tree);
  return summary;
}
```

## 5. 展開/折りたたみ機能

### 5.1 展開状態の管理

```typescript
function toggleExpand(
  nodeId: string,
  state: TreeState
): TreeState {
  const nodeState = state.nodes.get(nodeId);
  if (!nodeState) return state;
  
  return {
    ...state,
    nodes: new Map(state.nodes).set(nodeId, {
      ...nodeState,
      isExpanded: !nodeState.isExpanded
    })
  };
}
```

### 5.2 非表示機能

```typescript
function toggleVisibility(
  nodeId: string,
  state: TreeState,
  tree: RecipeTreeNode
): { state: TreeState; tree: RecipeTreeNode } {
  const node = findNode(tree, nodeId);
  if (!node) return { state, tree };
  
  const isVisible = node.isVisible;
  
  // このノードとすべての子ノードを非表示/表示
  function setVisibilityRecursive(node: RecipeTreeNode, visible: boolean) {
    node.isVisible = visible;
    for (const child of node.children) {
      setVisibilityRecursive(child, visible);
    }
  }
  
  setVisibilityRecursive(node, !isVisible);
  
  // 状態を更新
  const nodeState = state.nodes.get(nodeId);
  const newState = {
    ...state,
    nodes: new Map(state.nodes).set(nodeId, {
      ...nodeState!,
      isVisible: !isVisible
    })
  };
  
  return { state: newState, tree };
}
```

## 6. パフォーマンス最適化

### 6.1 メモ化

```typescript
const memoizedBuildTree = useMemo(
  () => buildRecipeTree(itemId, 1),
  [itemId]
);
```

### 6.2 仮想スクロール

大量のノードを表示する場合、react-windowを使用:

```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedTree({ tree }: { tree: RecipeTreeNode }) {
  const flattened = flattenTree(tree);
  
  return (
    <FixedSizeList
      height={600}
      itemCount={flattened.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          <TreeNode node={flattened[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 6.3 遅延読み込み

子ノードは展開時にのみ読み込む:

```typescript
function buildRecipeTreeLazy(
  itemId: string,
  requiredQuantity: number = 1
): RecipeTreeNode {
  const item = getItem(itemId);
  const recipe = getRecipe(itemId);
  
  return {
    item,
    recipe,
    children: [], // 初期は空
    isExpanded: false,
    isVisible: true,
    requiredQuantity,
    totalRequiredQuantity: requiredQuantity,
    isLoading: false
  };
}

async function loadChildren(node: RecipeTreeNode) {
  if (node.isLoading || node.children.length > 0) return;
  
  node.isLoading = true;
  const recipe = await fetchRecipe(node.item.id);
  
  for (const material of recipe.materials) {
    const childNode = buildRecipeTreeLazy(
      material.materialItemId,
      calculateChildQuantity(...)
    );
    node.children.push(childNode);
  }
  
  node.isLoading = false;
}
```

## 7. エッジケースの処理

### 7.1 循環参照

```typescript
function buildRecipeTree(
  itemId: string,
  requiredQuantity: number = 1,
  path: string[] = []
): RecipeTreeNode {
  // 循環参照の検出
  if (path.includes(itemId)) {
    return createCircularReferenceNode(itemId, requiredQuantity);
  }
  
  const newPath = [...path, itemId];
  // ... 通常の処理
}
```

### 7.2 レシピがないアイテム

```typescript
if (!recipe) {
  return {
    item,
    recipe: undefined,
    children: [],
    isExpanded: false,
    isVisible: true,
    requiredQuantity,
    totalRequiredQuantity: requiredQuantity
  };
}
```

### 7.3 大量のデータ

```typescript
// バッチ処理でツリーを構築
async function buildRecipeTreeBatch(
  itemId: string,
  batchSize: number = 10
): Promise<RecipeTreeNode> {
  // 最初のバッチを構築
  const root = await buildRecipeTreePartial(itemId, batchSize);
  
  // 残りを非同期で読み込み
  loadRemainingNodes(root, batchSize);
  
  return root;
}
```

## 8. 実装例（React）

```typescript
function RecipeTree({ itemId }: { itemId: string }) {
  const [tree, setTree] = useState<RecipeTreeNode | null>(null);
  const [state, setState] = useState<TreeState>({ nodes: new Map() });
  
  useEffect(() => {
    const root = buildRecipeTree(itemId);
    setTree(root);
  }, [itemId]);
  
  const handleToggleExpand = (nodeId: string) => {
    setState(prev => toggleExpand(nodeId, prev));
  };
  
  const handleToggleVisibility = (nodeId: string) => {
    if (!tree) return;
    const { state: newState, tree: newTree } = toggleVisibility(nodeId, state, tree);
    setState(newState);
    setTree(newTree);
  };
  
  const summary = useMemo(
    () => tree ? calculateMaterialSummary(tree) : new Map(),
    [tree]
  );
  
  if (!tree) return <Loading />;
  
  return (
    <div>
      <TreeNode
        node={tree}
        state={state}
        onToggleExpand={handleToggleExpand}
        onToggleVisibility={handleToggleVisibility}
      />
      <MaterialSummary summary={summary} />
    </div>
  );
}
```
