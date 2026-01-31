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
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useState, useEffect } from 'react';

interface MaterialRow {
  materialItemId: string;
  quantity: number;
}

const defaultMaterialRow = (): MaterialRow => ({
  materialItemId: '',
  quantity: 1,
});

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
  const [addRecipe, setAddRecipe] = useState(false);
  const [craftTime, setCraftTime] = useState(0);
  const [outputCount, setOutputCount] = useState(1);
  const [requiredFacilityId, setRequiredFacilityId] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialRow[]>([defaultMaterialRow()]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['items', gameId],
    queryFn: () => apiRequest<{ items: Item[] }>(`/games/${gameId}/items?limit=1000`),
    enabled: mounted && !!gameId,
  });

  const items = data?.items || [];
  const facilityItems = items.filter((i) => i.itemType === ItemType.FACILITY);

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      itemType: ItemType;
      recipe?: {
        craftTime: number;
        outputCount: number;
        requiredFacilityId?: string;
        materials: { materialItemId: string; quantity: number }[];
      };
    }) => {
      return apiRequest<Item>(`/games/${gameId}/items`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', gameId] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { itemId: string; name: string; itemType: ItemType }) => {
      return apiRequest<Item>(`/games/${gameId}/items/${payload.itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: payload.name, itemType: payload.itemType }),
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
    setAddRecipe(false);
    setCraftTime(0);
    setOutputCount(1);
    setRequiredFacilityId('');
    setMaterials([defaultMaterialRow()]);
  };

  const handleOpen = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setItemType(item.itemType);
      setAddRecipe(false);
      setCraftTime(0);
      setOutputCount(1);
      setRequiredFacilityId('');
      setMaterials([defaultMaterialRow()]);
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const addMaterialRow = () => {
    setMaterials((prev) => [...prev, defaultMaterialRow()]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterials((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateMaterialRow = (index: number, field: 'materialItemId' | 'quantity', value: string | number) => {
    setMaterials((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: field === 'quantity' ? Number(value) || 0 : value } : row
      )
    );
  };

  const buildRecipePayload = (): {
    craftTime: number;
    outputCount: number;
    requiredFacilityId?: string;
    materials: { materialItemId: string; quantity: number }[];
  } | undefined => {
    if (!addRecipe) return undefined;
    const validMaterials = materials.filter((m) => m.materialItemId && m.quantity >= 1);
    if (validMaterials.length === 0) return undefined;
    return {
      craftTime: Math.max(0, craftTime),
      outputCount: Math.max(1, outputCount),
      requiredFacilityId: requiredFacilityId || undefined,
      materials: validMaterials.map((m) => ({ materialItemId: m.materialItemId, quantity: m.quantity })),
    };
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ itemId: editingItem.id, name, itemType });
      return;
    }
    const recipe = buildRecipePayload();
    createMutation.mutate({
      name,
      itemType,
      recipe,
    });
  };

  const canSubmitRecipe = addRecipe && materials.some((m) => m.materialItemId && m.quantity >= 1);
  const isSubmitDisabled =
    !name ||
    createMutation.isPending ||
    updateMutation.isPending ||
    (!editingItem && addRecipe && (!canSubmitRecipe || materials.some((m) => m.quantity < 1)));

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

          {!editingItem && (
            <>
              <Divider sx={{ my: 2 }} />
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addRecipe}
                      onChange={(e) => setAddRecipe(e.target.checked)}
                    />
                  }
                  label="レシピを追加する"
                />
              </FormGroup>

              {addRecipe && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    レシピ情報
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="作成時間（秒）"
                    value={craftTime}
                    onChange={(e) => setCraftTime(Number(e.target.value) || 0)}
                    margin="normal"
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="作成個数"
                    value={outputCount}
                    onChange={(e) => setOutputCount(Number(e.target.value) || 1)}
                    margin="normal"
                    inputProps={{ min: 1 }}
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>必要施設（任意）</InputLabel>
                    <Select
                      value={requiredFacilityId}
                      label="必要施設（任意）"
                      onChange={(e) => setRequiredFacilityId(e.target.value)}
                    >
                      <MenuItem value="">なし</MenuItem>
                      {facilityItems.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      レシピを追加するには、先にこのゲームにアイテムを1つ以上追加してください（レシピなしで作成可能）。
                    </Typography>
                  ) : (
                    <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    必要素材（1つ以上）
                  </Typography>
                  {materials.map((row, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <FormControl sx={{ flex: 2, minWidth: 0 }}>
                        <InputLabel>素材</InputLabel>
                        <Select
                          value={row.materialItemId}
                          label="素材"
                          onChange={(e) => updateMaterialRow(index, 'materialItemId', e.target.value)}
                        >
                          {items.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        type="number"
                        label="数量"
                        value={row.quantity}
                        onChange={(e) => updateMaterialRow(index, 'quantity', e.target.value)}
                        sx={{ width: 100 }}
                        inputProps={{ min: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeMaterialRow(index)}
                        disabled={materials.length <= 1}
                        aria-label="素材を削除"
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addMaterialRow}
                    sx={{ mt: 1 }}
                  >
                    素材を追加
                  </Button>
                    </>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitDisabled}
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