import { queryClient, requestJson } from "@/platform/query-client";
import { useQuery } from "@tanstack/react-query";
function options<T>(url: string, staleTime = 30000) {
  return {
    queryKey: ["customer", url],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      requestJson<T>(url, signal),
    staleTime,
  };
}
export function preloadCustomerData<T>(url: string) {
  return queryClient.fetchQuery(options<T>(url));
}
export function invalidateCustomerData(...urls: string[]) {
  if (!urls.length) {
    void queryClient.invalidateQueries({ queryKey: ["customer"] });
    return;
  }
  for (const url of urls)
    void queryClient.invalidateQueries({ queryKey: ["customer", url] });
}
export function useCustomerData<T>(url: string, maxAge = 30000) {
  const query = useQuery(options<T>(url, maxAge));
  return {
    data: query.data,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error: query.error?.message ?? null,
    retry: () => {
      void query.refetch();
    },
  };
}
