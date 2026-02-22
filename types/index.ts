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
  deliveries?: number;
  revenue: number;
  ebit: number;
  fcff: number;
  pvFCFF: number;
}

export interface Scenario {
  label: string;
  intrinsicValue: number;
  revenueGrowthPath?: number[];
  deliveryGrowthPath?: number[];
  ebitMarginPath: number[];
  salestoCapital?: number;
  forecast: ForecastRow[];
}

export interface CompanyDetail {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  instrument?: string;
  sector?: string;
  country?: string;
  asOfDate: string;
  currency: string;
  price: number;
  sharesOutstanding?: number;
  marketCap?: number;
  recommendation: Recommendation;
  thesis?: string;

  valuation: {
    base: number;
    upside: number;
    bear?: number;
    currentPrice?: number;
    upsideToBase: number;
    upsideToBull: number;
    method?: string;
    horizon?: number;
  };

  reverseDCF?: {
    impliedTerminalEBITMargin?: number;
    impliedScaleFactor?: number;
    impliedGrowthMultiplier?: number;
    impliedEBITMarginMultiplier?: number;
    interpretation: string;
  };

  discountRate?: {
    rf: number;
    erp: number;
    beta: number;
    costOfEquity: number;
    wacc?: number;
    terminalGrowth: number;
    preTaxCostOfDebt?: number;
    taxRate?: number;
    fxRMBtoUSD?: number;
  };

  bridge?: {
    cash?: number;
    borrowings?: number;
    netCash?: number;
    mezzanine?: number;
    debt?: number;
    leases?: number;
    redeemablePreferred?: number;
    warrantLiability?: number;
    nonControllingInterests?: number;
  };

  multiples?: {
    evSales2025E?: number;
    pSales2025E?: number;
    pBook?: number;
  };

  keyDrivers?: {
    fy2025RevenueProxy?: number;
    [key: string]: unknown;
  };

  financials?: {
    fy2024?: {
      revenue?: number;
      grossProfit?: number;
      ebit?: number;
      rd?: number;
      sga?: number;
    };
    quarterly?: { period: string; revenue: number }[];
  };

  scenarios: {
    base: Scenario;
    upside: Scenario;
    downside?: Scenario;
  };

  risks?: { rank?: number; risk?: string; title?: string; detail?: string; modelLine?: string }[];
  catalysts?: string[];
  managementQuestions?: string[];
}
