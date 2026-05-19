import { useCallback, useEffect, useState } from 'react';
import { shortsApi } from '../api/endpoints';

export function useShorts(filters: Record<string, unknown> = {}) {
  const [data, setData] = useState<{ items: any[]; total: number; pages: number }>(
    { items: [], total: 0, pages: 1 },
  );
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(filters);

  const reload = useCallback(() => {
    setLoading(true);
    shortsApi
      .list(filters)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => reload(), [reload]);
  return { ...data, loading, reload };
}
