// app/(user)/games/[gameId]/items/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { Item, PaginationResponse } from '@/types';
import {
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { ItemType } from '@/types';

export default function ItemsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['items', gameId, search, sort, page],
    queryFn: () =>
      apiRequest<PaginationResponse<Item>>(
        `/games/${gameId}/items?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}&limit=20`
      ),
    enabled: mounted && !!gameId,
  });

  const handleItemClick = (item: Item) => {
    router.push(`/games/${gameId}/items/${item.id}`);
  };

  const getItemTypeColor = (itemType: ItemType) => {
    switch (itemType) {
      case ItemType.FACILITY:
        return 'success';
      case ItemType.MATERIAL:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getItemTypeLabel = (itemType: ItemType) => {
    switch (itemType) {
      case ItemType.FACILITY:
        return '施設';
      case ItemType.MATERIAL:
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="検索"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>並び替え</InputLabel>
          <Select value={sort} label="並び替え" onChange={(e) => setSort(e.target.value)}>
            <MenuItem value="name_asc">名前順（昇順）</MenuItem>
            <MenuItem value="name_desc">名前順（降順）</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {data?.items.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card>
              <CardActionArea onClick={() => handleItemClick(item)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" component="h2">
                      {item.name}
                    </Typography>
                    <Chip
                      label={getItemTypeLabel(item.itemType)}
                      color={getItemTypeColor(item.itemType) as any}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {data && data.items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            アイテムが見つかりません
          </Typography>
        </Box>
      )}

      {data && data.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            前へ
          </Button>
          <Typography sx={{ alignSelf: 'center' }}>
            {page} / {data.pagination.totalPages}
          </Typography>
          <Button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            次へ
          </Button>
        </Box>
      )}
    </Container>
  );
}
