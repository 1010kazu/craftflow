// components/common/AdminRoute.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { Box, CircularProgress, Typography, Container, Alert } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ハイドレーション完了前はローディング表示
  if (!mounted || !_hasHydrated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // 未ログイン時はログインページへリダイレクト
  if (!user) {
    router.push('/login');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // ADMIN権限がない場合はエラー表示してリダイレクト
  if (user.role !== UserRole.ADMIN) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          このページにアクセスする権限がありません。管理者権限が必要です。
        </Alert>
        <Typography variant="body2" color="text.secondary">
          3秒後にゲーム選択ページへ移動します...
        </Typography>
        <RedirectTimer onRedirect={() => router.push('/games')} />
      </Container>
    );
  }

  // ADMIN権限がある場合は子コンポーネントを表示
  return <>{children}</>;
}

// 自動リダイレクト用のタイマーコンポーネント
function RedirectTimer({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRedirect();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onRedirect]);

  return null;
}
