/**
 * useTransactions.js
 * Custom hook for fetching and managing transaction data
 */
import { useState, useEffect, useCallback } from 'react';

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setData([]);
    setOffset(0);
    setHasMore(true);
    fetchTransactions(0, true);
  }, [year, fundSource, search, selectedMonth, selectedFilters, paymentType]);

  const fetchTransactions = useCallback(
    async (currentOffset, isReset = false) => {
      if (loading && !isReset) return;
      setLoading(true);

      // Always fetch large batch for comprehensive totals (Tax Reports, etc.)
      const limit = 100000;

      try {
        const res = await window.arkas.getTransactions({
          year,
          fundSource,
          search,
          month: selectedMonth,
          filterType: selectedFilters,
          paymentType: paymentType || undefined, // Add payment type filter
          limit: limit,
          offset: currentOffset,
        });

        if (res.success) {
          if (isReset) {
            setData(res.data);
          } else {
            setData((prev) => [...prev, ...res.data]);
          }
          setHasMore(res.data.length === limit && !isMonthView);
        }
      } catch (error) {
        console.error('[useTransactions] Error:', error);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, fundSource, search, selectedMonth, selectedFilters, paymentType]
  );

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
