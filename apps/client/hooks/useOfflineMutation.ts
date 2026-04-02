import { useMutation, onlineManager } from '@tanstack/react-query';

type OfflineMutationConfig<TInput, TApiResult, TContext> = {
  onMutate: (input: TInput) => Promise<TContext>;
  apiFn: (input: TInput) => Promise<TApiResult>;
  onApiSuccess: (data: TApiResult, input: TInput, context: TContext) => void;
  onOfflineSuccess: (input: TInput, context: TContext) => Promise<void>;
  onError: (err: unknown, input: TInput, context: TContext | undefined) => void;
};

export function useOfflineMutation<TInput, TApiResult, TContext>(
  config: OfflineMutationConfig<TInput, TApiResult, TContext>,
) {
  return useMutation<{ source: 'api'; data: TApiResult } | { source: 'offline' }, unknown, TInput, TContext>({
    networkMode: 'always',
    onMutate: config.onMutate,
    mutationFn: async (input) => {
      if (onlineManager.isOnline()) {
        const data = await config.apiFn(input);
        return { source: 'api' as const, data };
      }

      return { source: 'offline' as const };
    },
    onSuccess: async (result, input, context) => {
      if (result.source === 'api') {
        config.onApiSuccess(result.data, input, context!);
      } else {
        await config.onOfflineSuccess(input, context!);
      }
    },
    onError: config.onError,
  });
}
