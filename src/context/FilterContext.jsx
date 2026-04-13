import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  // Initial state from localStorage to prevent reset on refresh
  const [year, setYear] = useState(() => {
    const saved = localStorage.getItem('selected_year');
    return saved ? Number(saved) : new Date().getFullYear();
  });

  const [fundSource, setFundSource] = useState(() => {
    const saved = localStorage.getItem('selected_fund_source');
    return saved || 'SEMUA';
  });

  // Save to localStorage whenever filters change
  React.useEffect(() => {
    localStorage.setItem('selected_year', year);
    localStorage.setItem('selected_fund_source', fundSource);
  }, [year, fundSource]);

  return (
    <FilterContext.Provider value={{ year, setYear, fundSource, setFundSource }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  return useContext(FilterContext);
}
