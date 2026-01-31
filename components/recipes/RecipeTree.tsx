// components/recipes/RecipeTree.tsx

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { RecipeTreeNode, ItemWithRecipe } from '@/types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface RecipeTreeProps {
  item: ItemWithRecipe;
}

interface RecipeTreeResponse {
  tree: RecipeTreeNode;
  materialSummary: Array<{
    itemId: string;
    itemName: string;
    totalQuantity: number;
  }>;
}

export default function RecipeTree({ item }: RecipeTreeProps) {
  const [showTree, setShowTree] = useState(false);
  const [nodeStates, setNodeStates] = useState<Map<string, { isExpanded: boolean; isVisible: boolean }>>(
    new Map()
  );

  const { data, isLoading } = useQuery<RecipeTreeResponse>({
    queryKey: ['recipe-tree', item.id],
    queryFn: () => apiRequest<RecipeTreeResponse>(`/recipes/${item.recipe!.id}/tree`),
    enabled: showTree && !!item.recipe,
  });

  const updateNodeState = (nodeId: string, updates: Partial<{ isExpanded: boolean; isVisible: boolean }>) => {
    setNodeStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(nodeId) || { isExpanded: true, isVisible: true };
      newMap.set(nodeId, { ...current, ...updates });
      return newMap;
    });
  };

  const renderTreeNode = (node: RecipeTreeNode, depth: number = 0): React.ReactNode => {
    const nodeState = nodeStates.get(node.item.id) || { isExpanded: true, isVisible: true };
    const isExpanded = nodeState.isExpanded;
    const isVisible = nodeState.isVisible;

    if (!isVisible) {
      return null;
    }

    return (
      <Box key={node.item.id} sx={{ ml: depth * 2 }}>
        <Accordion
          expanded={isExpanded}
          onChange={() => updateNodeState(node.item.id, { isExpanded: !isExpanded })}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                {node.item.name} (必要数: {node.requiredQuantity})
              </Typography>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  updateNodeState(node.item.id, { isVisible: false });
                  // 子ノードも非表示にする
                  const hideChildren = (n: RecipeTreeNode) => {
                    updateNodeState(n.item.id, { isVisible: false });
                    n.children.forEach(hideChildren);
                  };
                  node.children.forEach(hideChildren);
                }}
              >
                <VisibilityOffIcon fontSize="small" />
              </Button>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {node.recipe && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  作成時間: {node.recipe.craftTime}秒
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  作成個数: {node.recipe.outputCount}個
                </Typography>
                {node.recipe.requiredFacility && (
                  <Typography variant="body2" color="text.secondary">
                    必要施設: {node.recipe.requiredFacility.name}
                  </Typography>
                )}
                {node.recipe.materials.length > 0 && (
                  <List dense>
                    {node.recipe.materials.map((material) => (
                      <ListItem key={material.id}>
                        <ListItemText
                          primary={`${material.materialItem.name} × ${material.quantity}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            {node.children.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {node.children.map((child) => renderTreeNode(child, depth + 1))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  if (!item.recipe) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          このアイテムにはレシピがありません
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={() => setShowTree(!showTree)}
        sx={{ mb: 2 }}
      >
        {showTree ? 'レシピツリーを非表示' : 'レシピツリーを表示'}
      </Button>

      {showTree && (
        <>
          {isLoading ? (
            <Typography>読み込み中...</Typography>
          ) : data ? (
            <>
              <Paper sx={{ p: 2 }}>
                {renderTreeNode(data.tree)}
              </Paper>

              {data.materialSummary.length > 0 && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    必要数合計
                  </Typography>
                  <List>
                    {data.materialSummary.map((item) => (
                      <ListItem key={item.itemId}>
                        <ListItemText
                          primary={`${item.itemName}: ${item.totalQuantity}個`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </>
          ) : (
            <Typography color="error">レシピツリーの取得に失敗しました</Typography>
          )}
        </>
      )}
    </Box>
  );
}
