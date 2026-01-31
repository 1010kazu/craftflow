// app/(user)/games/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { useGameStore } from '@/store/game-store';
import { Game } from '@/types';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';

export default function GamesPage() {
  const router = useRouter();
  const { setSelectedGame } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: games, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => apiRequest<Game[]>('/games'),
    enabled: mounted, // クライアントサイドでのみ実行
  });

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    router.push(`/games/${game.id}/items`);
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
      <Typography variant="h4" component="h1" gutterBottom>
        ゲーム選択
      </Typography>

      <Grid container spacing={3}>
        {games?.map((game) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.id}>
            <Card>
              <CardActionArea onClick={() => handleGameSelect(game)}>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {game.name}
                  </Typography>
                  {game.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {game.description}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {games && games.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            ゲームが登録されていません
          </Typography>
        </Box>
      )}
    </Container>
  );
}
