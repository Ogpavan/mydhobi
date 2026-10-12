import { queryClient, requestJson } from "@/platform/query-client";
import { useQuery } from "@tanstack/react-query";
function options<T>(key: string, staleTime = 30000, refetchInterval?: number) {
  return {
    queryKey: ["admin", key],
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      (await requestJson<{ data: T }>(`/api/admin/page-data?${key}`, signal))
        .data,
    staleTime,
    ...(refetchInterval ? { refetchInterval } : {}),
  };
}
export function preloadAdminPageData<T>(key: string) {
  return queryClient.fetchQuery(options<T>(key));
}
export function invalidateAdminPageData(...keys: string[]) {
  if (!keys.length) {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    return;
  }
  for (const key of keys)
    void queryClient.invalidateQueries({ queryKey: ["admin", key] });
}
export function useAdminPageData<T>(
  key: string,
  maxAge = 30000,
  refetchInterval?: number,
) {
  const query = useQuery(options<T>(key, maxAge, refetchInterval));
  return {
    data: query.data,
    loading: query.isPending,
    refreshing: query.isFetching,
    error: query.error?.message ?? null,
    retry: () => {
      void query.refetch();
    },
  };
}
