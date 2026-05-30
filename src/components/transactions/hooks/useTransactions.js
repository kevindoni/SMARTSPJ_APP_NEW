import { useState, useEffect, useCallback, useRef } from 'react';

export default function useTransactions({
  year,
  fundSource,
  search,
  selectedMonth,
  selectedFilters,
  paymentType,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isMonthView = selectedMonth !== 'SEMUA';
  const cancelledRef = useRef(false);

  const fetchTransactions = useCallback(
    async (currentOffset, isReset = false) => {
      if (loading && !isReset) return;
      setLoading(true);

      const limit = isMonthView ? 10000 : 5000;

      try {
        const res = await window.arkas.getTransactions({
          year,
          fundSource,
          search,
          month: selectedMonth,
          filterType: selectedFilters,
          paymentType: paymentType || undefined,
          limit: limit,
          offset: currentOffset,
        });

        if (cancelledRef.current) return;

        if (res.success) {
          if (isReset) {
            setData(res.data);
          } else {
            setData((prev) => [...prev, ...res.data]);
          }
          setHasMore(res.data.length === limit && !isMonthView);
        }
      } catch (error) {
        if (cancelledRef.current) return;
        console.error('[useTransactions] Error:', error);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    },
    [year, fundSource, search, selectedMonth, selectedFilters, paymentType, loading, isMonthView]
  );

  useEffect(() => {
    cancelledRef.current = false;
    setData([]);
    setOffset(0);
    setHasMore(true);
    fetchTransactions(0, true);
    return () => { cancelledRef.current = true; };
  }, [year, fundSource, search, selectedMonth, selectedFilters, paymentType]);

  const handleLoadMore = useCallback(() => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    fetchTransactions(newOffset);
  }, [offset, fetchTransactions]);

  return {
    data,
    loading,
    hasMore,
    fetchTransactions,
    handleLoadMore,
    refetch: () => fetchTransactions(0, true),
  };
}
