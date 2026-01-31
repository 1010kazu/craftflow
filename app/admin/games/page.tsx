// app/admin/games/page.tsx

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { Game } from '@/types';
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
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGamesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: games, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => apiRequest<Game[]>('/games'),
    enabled: mounted,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest<Game>('/games', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      return apiRequest<Game>(`/games/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/games/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingGame(null);
  };

  const handleOpen = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setName(game.name);
      setDescription(game.description || '');
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
    if (editingGame) {
      updateMutation.mutate({
        id: editingGame.id,
        data: { name, description },
      });
    } else {
      createMutation.mutate({ name, description });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ゲーム管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          新規追加
        </Button>
      </Box>

      <Grid container spacing={3}>
        {games?.map((game) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{game.name}</Typography>
                {game.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {game.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpen(game)}
                  >
                    編集
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      if (confirm('削除しますか？')) {
                        deleteMutation.mutate(game.id);
                      }
                    }}
                  >
                    削除
                  </Button>
                  <Button
                    size="small"
                    onClick={() => router.push(`/admin/games/${game.id}/items`)}
                  >
                    アイテム管理
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGame ? 'ゲーム編集' : 'ゲーム追加'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ゲーム名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="説明"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!name || createMutation.isPending || updateMutation.isPending}
          >
            {editingGame ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
