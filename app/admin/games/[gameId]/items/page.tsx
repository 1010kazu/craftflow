// app/admin/games/[gameId]/items/page.tsx

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest, apiRequestFormData } from '@/lib/api/client';
import { Item, ItemType } from '@/types';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useState, useEffect } from 'react';

export default function AdminItemsPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState<ItemType>(ItemType.MATERIAL);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['items', gameId],
    queryFn: () => apiRequest<{ items: Item[] }>(`/games/${gameId}/items`),
    enabled: mounted && !!gameId,
  });

  const items = data?.items || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest<Item>(`/games/${gameId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', gameId] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/games/${gameId}/items/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', gameId] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequestFormData(`/recipes/import`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', gameId] });
      setImportOpen(false);
    },
  });

  const resetForm = () => {
    setName('');
    setItemType(ItemType.MATERIAL);
    setEditingItem(null);
  };

  const handleOpen = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setItemType(item.itemType);
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    createMutation.mutate({
      name,
      itemType,
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', file.name.endsWith('.json') ? 'json' : 'csv');
    formData.append('gameId', gameId);

    importMutation.mutate(formData);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          アイテム管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportOpen(true)}
          >
            インポート
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            新規追加
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {items?.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography variant="h6">{item.name}</Typography>
                  <Chip
                    label={item.itemType}
                    size="small"
                    color={item.itemType === ItemType.FACILITY ? 'success' : item.itemType === ItemType.MATERIAL ? 'warning' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpen(item)}
                  >
                    編集
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      if (confirm('削除しますか？')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    削除
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'アイテム編集' : 'アイテム追加'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="アイテム名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>アイテム種別</InputLabel>
            <Select value={itemType} label="アイテム種別" onChange={(e) => setItemType(e.target.value as ItemType)}>
              <MenuItem value={ItemType.FACILITY}>施設</MenuItem>
              <MenuItem value={ItemType.MATERIAL}>素材</MenuItem>
              <MenuItem value={ItemType.OTHER}>その他</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!name || createMutation.isPending}
          >
            {editingItem ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>CSV/JSONインポート</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleImport}
            style={{ marginTop: 16 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
