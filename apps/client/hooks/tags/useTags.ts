import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ApiTag } from '@/lib/types';

export function useTags() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['tags', userId],
    queryFn: () => api.get<ApiTag[]>('/tags'),
    enabled: userId !== null,
  });
}
