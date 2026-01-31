// app/(user)/games/[gameId]/items/[itemId]/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { ItemWithRecipe } from '@/types';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RecipeTree from '@/components/recipes/RecipeTree';
import { useState, useEffect } from 'react';

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  const itemId = params.itemId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: item, isLoading } = useQuery<ItemWithRecipe>({
    queryKey: ['item', gameId, itemId],
    queryFn: () => apiRequest<ItemWithRecipe>(`/games/${gameId}/items/${itemId}`),
    enabled: mounted && !!gameId && !!itemId,
  });

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'FACILITY':
        return 'success';
      case 'MATERIAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'FACILITY':
        return '施設';
      case 'MATERIAL':
        return '素材';
      default:
        return 'その他';
    }
  };

  if (!mounted || isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">アイテムが見つかりません</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/games/${gameId}/items`)}
        sx={{ mb: 2 }}
      >
        戻る
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {item.name}
          </Typography>
          <Chip
            label={getItemTypeLabel(item.itemType)}
            color={getItemTypeColor(item.itemType) as any}
          />
        </Box>

        {item.recipe && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              レシピ情報
            </Typography>
            <Typography variant="body2" color="text.secondary">
              作成時間: {item.recipe.craftTime}秒
            </Typography>
            <Typography variant="body2" color="text.secondary">
              作成個数: {item.recipe.outputCount}個
            </Typography>
            {item.recipe.requiredFacility && (
              <Typography variant="body2" color="text.secondary">
                必要施設: {item.recipe.requiredFacility.name}
              </Typography>
            )}
            {item.recipe.materials.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  必要素材:
                </Typography>
                <List>
                  {item.recipe.materials.map((material) => (
                    <ListItem key={material.id}>
                      <ListItemText
                        primary={`${material.materialItem.name} × ${material.quantity}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        <RecipeTree item={item} />
      </Paper>
    </Container>
  );
}
