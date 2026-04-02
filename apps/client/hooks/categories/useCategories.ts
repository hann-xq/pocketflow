import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiCategory } from '@/lib/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<ApiCategory[]>('/categories'),
  });
}
