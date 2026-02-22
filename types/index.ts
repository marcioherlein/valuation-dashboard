export type Recommendation = "BUY" | "AVOID" | "HOLD" | "SELL";

export interface CompanyIndex {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  sector: string;
  country: string;
  recommendation: Recommendation;
  price: number;
  baseValue: number;
  upsideValue: number;
  upsideToBase: number;
  asOfDate: string;
  currency: string;
}

export interface ForecastRow {
  year: number;
  deliveries: number;
  revenue: number;
  ebit: number;
  fcff: number;
  pvFCFF: number;
}

export interface Scenario {
  label: string;
  intrinsicValue: number;
  deliveryGrowthPath: number[];
  ebitMarginPath: number[];
  salestoCapital: number;
  forecast: ForecastRow[];
}

export interface CompanyDetail {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  instrument: string;
  adrRatio: string;
  sector: string;
  country: string;
  asOfDate: string;
  currency: string;
  price: number;
  sharesOutstanding: number;
  marketCap: number;
  recommendation: Recommendation;
  thesis: string;
  valuation: {
    base: number;
    upside: number;
    bear: number | null;
    currentPrice: number;
    upsideToBase: number;
    upsideToBull: number;
    terminalPVShareBase: number;
    terminalPVShareBull: number;
    method: string;
    horizon: number;
  };
  reverseDCF: {
    impliedTerminalEBITMargin: number;
    impliedScaleFactor: number;
    interpretation: string;
  };
  discountRate: {
    rf: number;
    erp: number;
    beta: number;
    costOfEquity: number;
    terminalGrowth: number;
    fxRMBtoUSD?: number;
  };
  bridge: {
    cash: number;
    borrowings: number;
    netCash: number;
    mezzanine: number;
  };
  multiples: {
    evSales2025E?: number;
    pSales2025E?: number;
    pBook?: number;
  };
  keyDrivers: {
    deliveries2025: number;
    deliveriesGrowthYoY: number;
    q4Deliveries: number;
    jan2026Deliveries: number;
    jan2026GrowthYoY: number;
    revenuePerVehicle2025E: number;
    fy2025RevenueProxy: number;
  };
  financials: {
    fy2024: {
      revenue: number;
      grossProfit: number;
      ebit: number;
      rd: number;
      sga: number;
    };
    quarterly: { period: string; revenue: number }[];
  };
  breakeven: {
    q3PositiveOpCashFlow: boolean;
    q4GAAPOpProfitRangeLow: number;
    q4GAAPOpProfitRangeHigh: number;
    q4NonGAAPOpProfitRangeLow: number;
    q4NonGAAPOpProfitRangeHigh: number;
  };
  scenarios: {
    base: Scenario;
    upside: Scenario;
  };
  risks: { rank: number; title: string; detail: string }[];
  catalysts: string[];
  managementQuestions: string[];
}
