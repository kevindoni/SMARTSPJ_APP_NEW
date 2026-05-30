import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [year, setYear] = useState(() => {
    try {
      const saved = localStorage.getItem('selected_year');
      return saved ? Number(saved) : new Date().getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  });

  const [fundSource, setFundSource] = useState(() => {
    try {
      const saved = localStorage.getItem('selected_fund_source');
      return saved || 'SEMUA';
    } catch {
      return 'SEMUA';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('selected_year', year);
      localStorage.setItem('selected_fund_source', fundSource);
    } catch { /* localStorage unavailable in private browsing */ }
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
