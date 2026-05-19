import { useEffect, useState } from 'react';
import { subsApi } from '../api/endpoints';

export function useSubscription() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subsApi
      .me()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { ...(data ?? {}), loading };
}
