import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import StockChart from '../ui/StockChart';
// Removed Polygon search - now using yfinance service

// --- Types for yfinance service ---
interface YFinanceStockData {
  symbol: string;
  name: string;
  current_price: number;
  currency: string;
  exchange: string;
  market_cap: number;
  sector: string;
  industry: string;
  description: string;
  logo_url: string;
  website: string;
  employees: number;
  city: string;
  state: string;
  country: string;
  phone: string;
  ceo: string;
  founded: string;
  dividend_yield: number;
  pe_ratio: number;
  eps: number;
  beta: number;
  "52_week_high": number;
  "52_week_low": number;
  volume: number;
  avg_volume: number;
  market_state: string;
}

interface YFinanceSearchResult {
  symbol: string;
  name: string;
  current_price: number;
  currency: string;
  exchange: string;
  market_cap: number;
  sector: string;
  industry: string;
  description: string;
  logo_url: string;
  website: string;
  employees: number;
  city: string;
  state: string;
  country: string;
  phone: string;
  ceo: string;
  founded: string;
  dividend_yield: number;
  pe_ratio: number;
  eps: number;
  beta: number;
  "52_week_high": number;
  "52_week_low": number;
  volume: number;
  avg_volume: number;
  market_state: string;
}

type AvailableStock = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
  marketCap: string;
  pe: number;
  sector: string;
  recommendation: string;
  sentiment: string;
};

// --- Small helpers / styles ---
const getRecommendationColor = (_recommendation: string) =>
  'bg-transparent text-slate-300 border-transparent';

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-transparent text-green-400 border-transparent';
    case 'negative': return 'bg-transparent text-red-400 border-transparent';
    default: return 'bg-transparent text-slate-400 border-transparent';
  }
};

function formatSignedPercent(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}%`;
  if (value < 0) return `${value.toFixed(1)}%`;
  return '0.0%';
}

// --- Optional row component kept for future list usage ---
function StockRow({
  stock, selectedStock, setSelectedStock
}: { stock: AvailableStock; selectedStock: string | null; setSelectedStock: (s: string | null) => void; }) {
  const [apiData, setApiData] = useState<ApiStockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/stocks/${stock.symbol}`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data: ApiStockData = await res.json();
        if (isMounted) setApiData(data);
      } catch {
        if (isMounted) setApiData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [stock.symbol]);

  const currentPrice = apiData?.current?.c ?? null;
  const chartData = apiData?.historical?.map((i) => ({ t: i.t, c: i.c })) ?? [];
  const prevClose = chartData.length >= 2 ? chartData[chartData.length - 2].c : currentPrice ?? 0;
  const effectiveCurrent = currentPrice ?? (chartData.length ? chartData[chartData.length - 1].c : 0);
  const change = effectiveCurrent - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  const sentimentLabel = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  const sentimentClass = getSentimentColor(sentimentLabel);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-white font-medium text-lg">{stock.symbol}</span>
            <p className="text-slate-400 text-sm">{stock.name}</p>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">
              {loading ? stock.price : `$${effectiveCurrent.toFixed(2)}`}
            </p>
            <p className={change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}>
              {loading ? stock.change : formatSignedPercent(changePercent)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">P/E: {stock.pe}</p>
            <p className="text-slate-400 text-sm">Vol: {stock.volume}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <Badge className={getRecommendationColor(stock.recommendation)}>{stock.recommendation}</Badge>
          <Badge className={sentimentClass}>{sentimentLabel}</Badge>
          <p className="text-slate-500 text-xs mt-1">{stock.marketCap}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-500 text-slate-300 rounded-full"
            onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}
          >
            <span className="mr-1">📊</span>
            {selectedStock === stock.symbol ? 'Hide Chart' : 'View Chart'}
          </Button>
          <Button size="sm" variant="outline" className="border-slate-500 text-slate-300 rounded-full">
            <span className="mr-1">🤖</span>
            AI Insights
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Static showcase cards (unchanged) ---
const availableStocks: AvailableStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.98', change: '+1.8%', volume: '52M', marketCap: '$2.9T', pe: 28.5, sector: 'Technology', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$875.28', change: '+5.4%', volume: '45M', marketCap: '$2.1T', pe: 65.2, sector: 'Technology', recommendation: 'Strong Buy', sentiment: 'positive' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '$242.84', change: '+3.2%', volume: '112M', marketCap: '$770B', pe: 45.8, sector: 'Consumer Discretionary', recommendation: 'Hold', sentiment: 'neutral' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$378.91', change: '+2.1%', volume: '28M', marketCap: '$2.8T', pe: 32.1, sector: 'Technology', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'META', name: 'Meta Platforms', price: '$352.96', change: '-1.2%', volume: '18M', marketCap: '$900B', pe: 24.7, sector: 'Communication Services', recommendation: 'Hold', sentiment: 'neutral' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$142.15', change: '+0.8%', volume: '22M', marketCap: '$1.8T', pe: 26.3, sector: 'Communication Services', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$155.42', change: '+1.5%', volume: '35M', marketCap: '$1.6T', pe: 52.1, sector: 'Consumer Discretionary', recommendation: 'Buy', sentiment: 'positive' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: '$158.73', change: '+0.3%', volume: '8M', marketCap: '$420B', pe: 15.2, sector: 'Healthcare', recommendation: 'Buy', sentiment: 'positive' }
];

const sectors = ['All', 'Technology', 'Healthcare', 'Consumer Discretionary', 'Communication Services', 'Energy', 'Financials'];

export function StocksTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('marketCap'); // currently unused
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<YFinanceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 📋 Common stock symbols with company names for suggestions
  const commonStocks = {
    'A': 'Agilent Technologies Inc.',
    'AA': 'Alcoa Corporation',
    'AAA': 'AXS First Priority CLO Bond ETF',
    'AAL': 'American Airlines Group Inc.',
    'AAPL': 'Apple Inc.',
    'ABBV': 'AbbVie Inc.',
    'ABC': 'AmerisourceBergen Corporation',
    'ABT': 'Abbott Laboratories',
    'ACN': 'Accenture plc',
    'ADBE': 'Adobe Inc.',
    'ADI': 'Analog Devices Inc.',
    'ADM': 'Archer-Daniels-Midland Company',
    'ADP': 'Automatic Data Processing Inc.',
    'ADS': 'Alliance Data Systems Corporation',
    'ADSK': 'Autodesk Inc.',
    'AEE': 'Ameren Corporation',
    'AEP': 'American Electric Power Company Inc.',
    'AES': 'The AES Corporation',
    'AET': 'Aetna Inc.',
    'AFL': 'Aflac Incorporated',
    'AGN': 'Allergan plc',
    'AIG': 'American International Group Inc.',
    'AIV': 'Apartment Investment and Management Company',
    'AIZ': 'Assurant Inc.',
    'AJG': 'Arthur J. Gallagher & Co.',
    'AKAM': 'Akamai Technologies Inc.',
    'ALB': 'Albemarle Corporation',
    'ALGN': 'Align Technology Inc.',
    'ALK': 'Alaska Air Group Inc.',
    'ALL': 'The Allstate Corporation',
    'ALLE': 'Allegion plc',
    'ALXN': 'Alexion Pharmaceuticals Inc.',
    'AMAT': 'Applied Materials Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'AME': 'AMETEK Inc.',
    'AMG': 'Affiliated Managers Group Inc.',
    'AMGN': 'Amgen Inc.',
    'AMP': 'Ameriprise Financial Inc.',
    'AMT': 'American Tower Corporation',
    'AMZN': 'Amazon.com Inc.',
    'AN': 'AutoNation Inc.',
    'ANSS': 'ANSYS Inc.',
    'ANTM': 'Anthem Inc.',
    'AON': 'Aon plc',
    'AOS': 'A.O. Smith Corporation',
    'APA': 'Apache Corporation',
    'APD': 'Air Products and Chemicals Inc.',
    'APH': 'Amphenol Corporation',
    'APTV': 'Aptiv plc',
    'ARE': 'Alexandria Real Estate Equities Inc.',
    'ARNC': 'Arconic Inc.',
    'ATVI': 'Activision Blizzard Inc.',
    'AVB': 'AvalonBay Communities Inc.',
    'AVGO': 'Broadcom Inc.',
    'AVY': 'Avery Dennison Corporation',
    'AWK': 'American Water Works Company Inc.',
    'AXP': 'American Express Company',
    'AZO': 'AutoZone Inc.',
    'BA': 'The Boeing Company',
    'BAC': 'Bank of America Corporation',
    'BAX': 'Baxter International Inc.',
    'BBT': 'BB&T Corporation',
    'BBY': 'Best Buy Co. Inc.',
    'BDX': 'Becton Dickinson and Company',
    'BEN': 'Franklin Resources Inc.',
    'BF.B': 'Brown-Forman Corporation',
    'BIIB': 'Biogen Inc.',
    'BK': 'The Bank of New York Mellon Corporation',
    'BLK': 'BlackRock Inc.',
    'BLL': 'Ball Corporation',
    'BMY': 'Bristol-Myers Squibb Company',
    'BRK.B': 'Berkshire Hathaway Inc.',
    'BSX': 'Boston Scientific Corporation',
    'BWA': 'BorgWarner Inc.',
    'BXP': 'Boston Properties Inc.',
    'C': 'Citigroup Inc.',
    'CA': 'CA Inc.',
    'CAG': 'Conagra Brands Inc.',
    'CAH': 'Cardinal Health Inc.',
    'CAT': 'Caterpillar Inc.',
    'CB': 'Chubb Limited',
    'CBOE': 'Cboe Global Markets Inc.',
    'CBS': 'CBS Corporation',
    'CCI': 'Crown Castle International Corp.',
    'CCL': 'Carnival Corporation',
    'CDNS': 'Cadence Design Systems Inc.',
    'CELG': 'Celgene Corporation',
    'CERN': 'Cerner Corporation',
    'CF': 'CF Industries Holdings Inc.',
    'CFG': 'Citizens Financial Group Inc.',
    'CHD': 'Church & Dwight Co. Inc.',
    'CHRW': 'C.H. Robinson Worldwide Inc.',
    'CHTR': 'Charter Communications Inc.',
    'CI': 'Cigna Corporation',
    'CINF': 'Cincinnati Financial Corporation',
    'CL': 'Colgate-Palmolive Company',
    'CLX': 'The Clorox Company',
    'CMA': 'Comerica Incorporated',
    'CMCSA': 'Comcast Corporation',
    'CME': 'CME Group Inc.',
    'CMG': 'Chipotle Mexican Grill Inc.',
    'CMI': 'Cummins Inc.',
    'CMS': 'CMS Energy Corporation',
    'CNC': 'Centene Corporation',
    'CNP': 'CenterPoint Energy Inc.',
    'COF': 'Capital One Financial Corporation',
    'COG': 'Cabot Oil & Gas Corporation',
    'COL': 'Rockwell Collins Inc.',
    'COO': 'The Cooper Companies Inc.',
    'COP': 'ConocoPhillips',
    'COST': 'Costco Wholesale Corporation',
    'COTY': 'Coty Inc.',
    'CPB': 'Campbell Soup Company',
    'CPRT': 'Copart Inc.',
    'CRM': 'Salesforce.com Inc.',
    'CSCO': 'Cisco Systems Inc.',
    'CSX': 'CSX Corporation',
    'CTAS': 'Cintas Corporation',
    'CTL': 'CenturyLink Inc.',
    'CTSH': 'Cognizant Technology Solutions Corporation',
    'CTXS': 'Citrix Systems Inc.',
    'CVS': 'CVS Health Corporation',
    'CVX': 'Chevron Corporation',
    'CXO': 'Concho Resources Inc.',
    'D': 'Dominion Energy Inc.',
    'DAL': 'Delta Air Lines Inc.',
    'DD': 'DuPont de Nemours Inc.',
    'DE': 'Deere & Company',
    'DFS': 'Discover Financial Services',
    'DG': 'Dollar General Corporation',
    'DGX': 'Quest Diagnostics Incorporated',
    'DHI': 'D.R. Horton Inc.',
    'DHR': 'Danaher Corporation',
    'DIS': 'The Walt Disney Company',
    'DISCA': 'Discovery Inc.',
    'DISCK': 'Discovery Inc.',
    'DISH': 'DISH Network Corporation',
    'DLR': 'Digital Realty Trust Inc.',
    'DLTR': 'Dollar Tree Inc.',
    'DOV': 'Dover Corporation',
    'DPS': 'Dr Pepper Snapple Group Inc.',
    'DRE': 'Duke Realty Corporation',
    'DRI': 'Darden Restaurants Inc.',
    'DTE': 'DTE Energy Company',
    'DUK': 'Duke Energy Corporation',
    'DVA': 'DaVita Inc.',
    'DVN': 'Devon Energy Corporation',
    'EA': 'Electronic Arts Inc.',
    'EBAY': 'eBay Inc.',
    'ECL': 'Ecolab Inc.',
    'ED': 'Consolidated Edison Inc.',
    'EFX': 'Equifax Inc.',
    'EIX': 'Edison International',
    'EL': 'Estée Lauder Companies Inc.',
    'EMN': 'Eastman Chemical Company',
    'EMR': 'Emerson Electric Co.',
    'ENDP': 'Endo International plc',
    'EOG': 'EOG Resources Inc.',
    'EQIX': 'Equinix Inc.',
    'EQR': 'Equity Residential',
    'EQT': 'EQT Corporation',
    'ES': 'Eversource Energy',
    'ESRX': 'Express Scripts Holding Company',
    'ESS': 'Essex Property Trust Inc.',
    'ETFC': 'E*TRADE Financial Corporation',
    'ETN': 'Eaton Corporation plc',
    'ETR': 'Entergy Corporation',
    'EVHC': 'Envision Healthcare Corporation',
    'EW': 'Edwards Lifesciences Corporation',
    'EXC': 'Exelon Corporation',
    'EXPD': 'Expeditors International of Washington Inc.',
    'EXPE': 'Expedia Group Inc.',
    'EXR': 'Extra Space Storage Inc.',
    'F': 'Ford Motor Company',
    'FAST': 'Fastenal Company',
    'FB': 'Facebook Inc.',
    'FBHS': 'Fortune Brands Home & Security Inc.',
    'FCX': 'Freeport-McMoRan Inc.',
    'FDX': 'FedEx Corporation',
    'FE': 'FirstEnergy Corp.',
    'FFIV': 'F5 Networks Inc.',
    'FIS': 'Fidelity National Information Services Inc.',
    'FISV': 'Fiserv Inc.',
    'FITB': 'Fifth Third Bancorp',
    'FL': 'Foot Locker Inc.',
    'FLIR': 'FLIR Systems Inc.',
    'FLR': 'Fluor Corporation',
    'FLS': 'Flowserve Corporation',
    'FMC': 'FMC Corporation',
    'FOX': 'Fox Corporation',
    'FOXA': 'Fox Corporation',
    'FRT': 'Federal Realty Investment Trust',
    'FSLR': 'First Solar Inc.',
    'FTI': 'TechnipFMC plc',
    'FTV': 'Fortive Corporation',
    'GD': 'General Dynamics Corporation',
    'GE': 'General Electric Company',
    'GGP': 'GGP Inc.',
    'GILD': 'Gilead Sciences Inc.',
    'GIS': 'General Mills Inc.',
    'GLW': 'Corning Incorporated',
    'GM': 'General Motors Company',
    'GOOG': 'Alphabet Inc.',
    'GOOGL': 'Alphabet Inc.',
    'GPC': 'Genuine Parts Company',
    'GPN': 'Global Payments Inc.',
    'GPS': 'Gap Inc.',
    'GRMN': 'Garmin Ltd.',
    'GS': 'Goldman Sachs Group Inc.',
    'GT': 'The Goodyear Tire & Rubber Company',
    'GWW': 'W.W. Grainger Inc.',
    'HAL': 'Halliburton Company',
    'HAS': 'Hasbro Inc.',
    'HBAN': 'Huntington Bancshares Incorporated',
    'HBI': 'Hanesbrands Inc.',
    'HCA': 'HCA Healthcare Inc.',
    'HCP': 'HCP Inc.',
    'HD': 'The Home Depot Inc.',
    'HES': 'Hess Corporation',
    'HIG': 'The Hartford Financial Services Group Inc.',
    'HOG': 'Harley-Davidson Inc.',
    'HOLX': 'Hologic Inc.',
    'HON': 'Honeywell International Inc.',
    'HP': 'Helmerich & Payne Inc.',
    'HPE': 'Hewlett Packard Enterprise Company',
    'HPQ': 'HP Inc.',
    'HRB': 'H&R Block Inc.',
    'HRL': 'Hormel Foods Corporation',
    'HRS': 'Harris Corporation',
    'HSIC': 'Henry Schein Inc.',
    'HST': 'Host Hotels & Resorts Inc.',
    'HSY': 'The Hershey Company',
    'HUM': 'Humana Inc.',
    'IBM': 'International Business Machines Corporation',
    'ICE': 'Intercontinental Exchange Inc.',
    'IDXX': 'IDEXX Laboratories Inc.',
    'IEX': 'IDEX Corporation',
    'IFF': 'International Flavors & Fragrances Inc.',
    'ILMN': 'Illumina Inc.',
    'INCY': 'Incyte Corporation',
    'INFO': 'IHS Markit Ltd.',
    'INTC': 'Intel Corporation',
    'INTU': 'Intuit Inc.',
    'IP': 'International Paper Company',
    'IPG': 'The Interpublic Group of Companies Inc.',
    'IR': 'Ingersoll-Rand plc',
    'IRM': 'Iron Mountain Incorporated',
    'ISRG': 'Intuitive Surgical Inc.',
    'IT': 'Gartner Inc.',
    'ITW': 'Illinois Tool Works Inc.',
    'IVZ': 'Invesco Ltd.',
    'JBHT': 'J.B. Hunt Transport Services Inc.',
    'JCI': 'Johnson Controls International plc',
    'JEC': 'Jacobs Engineering Group Inc.',
    'JNJ': 'Johnson & Johnson',
    'JNPR': 'Juniper Networks Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'JWN': 'Nordstrom Inc.',
    'K': 'Kellogg Company',
    'KEY': 'KeyCorp',
    'KHC': 'The Kraft Heinz Company',
    'KIM': 'Kimco Realty Corporation',
    'KLAC': 'KLA Corporation',
    'KMB': 'Kimberly-Clark Corporation',
    'KMI': 'Kinder Morgan Inc.',
    'KMX': 'CarMax Inc.',
    'KO': 'The Coca-Cola Company',
    'KORS': 'Michael Kors Holdings Limited',
    'KR': 'The Kroger Co.',
    'KSS': 'Kohl\'s Corporation',
    'KSU': 'Kansas City Southern',
    'L': 'Loews Corporation',
    'LB': 'L Brands Inc.',
    'LEG': 'Leggett & Platt Incorporated',
    'LEN': 'Lennar Corporation',
    'LH': 'Laboratory Corporation of America Holdings',
    'LKQ': 'LKQ Corporation',
    'LLL': 'L3 Technologies Inc.',
    'LLTC': 'Linear Technology Corporation',
    'LLY': 'Eli Lilly and Company',
    'LMT': 'Lockheed Martin Corporation',
    'LNC': 'Lincoln National Corporation',
    'LNT': 'Alliant Energy Corporation',
    'LOW': 'Lowe\'s Companies Inc.',
    'LRCX': 'Lam Research Corporation',
    'LUK': 'Leucadia National Corporation',
    'LUV': 'Southwest Airlines Co.',
    'LVLT': 'Level 3 Communications Inc.',
    'LYB': 'LyondellBasell Industries N.V.',
    'M': 'Macy\'s Inc.',
    'MA': 'Mastercard Incorporated',
    'MAA': 'Mid-America Apartment Communities Inc.',
    'MAC': 'Macerich Company',
    'MAR': 'Marriott International Inc.',
    'MAS': 'Masco Corporation',
    'MAT': 'Mattel Inc.',
    'MCD': 'McDonald\'s Corporation',
    'MCHP': 'Microchip Technology Incorporated',
    'MCK': 'McKesson Corporation',
    'MCO': 'Moody\'s Corporation',
    'MDLZ': 'Mondelez International Inc.',
    'MDT': 'Medtronic plc',
    'MET': 'MetLife Inc.',
    'MHK': 'Mohawk Industries Inc.',
    'MKC': 'McCormick & Company Incorporated',
    'MLM': 'Martin Marietta Materials Inc.',
    'MMC': 'Marsh & McLennan Companies Inc.',
    'MMM': '3M Company',
    'MNST': 'Monster Beverage Corporation',
    'MO': 'Altria Group Inc.',
    'MON': 'Monsanto Company',
    'MOS': 'The Mosaic Company',
    'MPC': 'Marathon Petroleum Corporation',
    'MRK': 'Merck & Co. Inc.',
    'MRO': 'Marathon Oil Corporation',
    'MS': 'Morgan Stanley',
    'MSFT': 'Microsoft Corporation',
    'MSI': 'Motorola Solutions Inc.',
    'MTB': 'M&T Bank Corporation',
    'MU': 'Micron Technology Inc.',
    'MUR': 'Murphy Oil Corporation',
    'MYL': 'Mylan N.V.',
    'NAVI': 'Navient Corporation',
    'NBL': 'Noble Energy Inc.',
    'NDAQ': 'Nasdaq Inc.',
    'NEE': 'NextEra Energy Inc.',
    'NEM': 'Newmont Corporation',
    'NFLX': 'Netflix Inc.',
    'NFX': 'Newfield Exploration Company',
    'NI': 'NiSource Inc.',
    'NKE': 'Nike Inc.',
    'NLSN': 'Nielsen Holdings plc',
    'NOC': 'Northrop Grumman Corporation',
    'NOV': 'National Oilwell Varco Inc.',
    'NRG': 'NRG Energy Inc.',
    'NSC': 'Norfolk Southern Corporation',
    'NTAP': 'NetApp Inc.',
    'NTRS': 'Northern Trust Corporation',
    'NUE': 'Nucor Corporation',
    'NVDA': 'NVIDIA Corporation',
    'NWL': 'Newell Brands Inc.',
    'NWS': 'News Corporation',
    'NWSA': 'News Corporation',
    'O': 'Realty Income Corporation',
    'OKE': 'Oneok Inc.',
    'OMC': 'Omnicom Group Inc.',
    'ORCL': 'Oracle Corporation',
    'ORLY': 'O\'Reilly Automotive Inc.',
    'OXY': 'Occidental Petroleum Corporation',
    'PAYX': 'Paychex Inc.',
    'PBCT': 'People\'s United Financial Inc.',
    'PBI': 'Pitney Bowes Inc.',
    'PCAR': 'PACCAR Inc.',
    'PCG': 'PG&E Corporation',
    'PCLN': 'Booking Holdings Inc.',
    'PDCO': 'Patterson Companies Inc.',
    'PEG': 'Public Service Enterprise Group Incorporated',
    'PEP': 'PepsiCo Inc.',
    'PFE': 'Pfizer Inc.',
    'PFG': 'Principal Financial Group Inc.',
    'PG': 'The Procter & Gamble Company',
    'PGR': 'The Progressive Corporation',
    'PH': 'Parker-Hannifin Corporation',
    'PHM': 'PulteGroup Inc.',
    'PKI': 'PerkinElmer Inc.',
    'PLD': 'Prologis Inc.',
    'PM': 'Philip Morris International Inc.',
    'PNC': 'The PNC Financial Services Group Inc.',
    'PNR': 'Pentair plc',
    'PNW': 'Pinnacle West Capital Corporation',
    'POM': 'Pepco Holdings Inc.',
    'PPG': 'PPG Industries Inc.',
    'PPL': 'PPL Corporation',
    'PRGO': 'Perrigo Company plc',
    'PRU': 'Prudential Financial Inc.',
    'PSA': 'Public Storage',
    'PSX': 'Phillips 66',
    'PVH': 'PVH Corp.',
    'PWR': 'Quanta Services Inc.',
    'PX': 'Praxair Inc.',
    'PXD': 'Pioneer Natural Resources Company',
    'PYPL': 'PayPal Holdings Inc.',
    'QCOM': 'QUALCOMM Incorporated',
    'QRVO': 'Qorvo Inc.',
    'R': 'Ryder System Inc.',
    'RAI': 'Reynolds American Inc.',
    'RCL': 'Royal Caribbean Cruises Ltd.',
    'REGN': 'Regeneron Pharmaceuticals Inc.',
    'RF': 'Regions Financial Corporation',
    'RHI': 'Robert Half International Inc.',
    'RHT': 'Red Hat Inc.',
    'RIG': 'Transocean Ltd.',
    'RL': 'Ralph Lauren Corporation',
    'ROK': 'Rockwell Automation Inc.',
    'ROP': 'Roper Technologies Inc.',
    'ROST': 'Ross Stores Inc.',
    'RRC': 'Range Resources Corporation',
    'RSG': 'Republic Services Inc.',
    'RTN': 'Raytheon Company',
    'SBUX': 'Starbucks Corporation',
    'SCG': 'SCANA Corporation',
    'SCHW': 'The Charles Schwab Corporation',
    'SE': 'Sea Limited',
    'SEE': 'Sealed Air Corporation',
    'SHW': 'The Sherwin-Williams Company',
    'SIG': 'Signet Jewelers Limited',
    'SIRI': 'Sirius XM Holdings Inc.',
    'SJM': 'The J.M. Smucker Company',
    'SLB': 'Schlumberger Limited',
    'SLG': 'SL Green Realty Corp.',
    'SNA': 'Snap-on Incorporated',
    'SNDK': 'SanDisk Corporation',
    'SNI': 'Scripps Networks Interactive Inc.',
    'SNPS': 'Synopsys Inc.',
    'SO': 'The Southern Company',
    'SPG': 'Simon Property Group Inc.',
    'SPLS': 'Staples Inc.',
    'SRCL': 'Stericycle Inc.',
    'SRE': 'Sempra Energy',
    'STI': 'SunTrust Banks Inc.',
    'STJ': 'St. Jude Medical Inc.',
    'STT': 'State Street Corporation',
    'STX': 'Seagate Technology plc',
    'STZ': 'Constellation Brands Inc.',
    'SWK': 'Stanley Black & Decker Inc.',
    'SWKS': 'Skyworks Solutions Inc.',
    'SWN': 'Southwestern Energy Company',
    'SYF': 'Synchrony Financial',
    'SYY': 'Sysco Corporation',
    'T': 'AT&T Inc.',
    'TAP': 'Molson Coors Brewing Company',
    'TDC': 'Teradata Corporation',
    'TE': 'TECO Energy Inc.',
    'TEL': 'TE Connectivity Ltd.',
    'TGT': 'Target Corporation',
    'THC': 'Tenet Healthcare Corporation',
    'TIF': 'Tiffany & Co.',
    'TJX': 'The TJX Companies Inc.',
    'TMK': 'Torchmark Corporation',
    'TMO': 'Thermo Fisher Scientific Inc.',
    'TROW': 'T. Rowe Price Group Inc.',
    'TRV': 'The Travelers Companies Inc.',
    'TSCO': 'Tractor Supply Company',
    'TSN': 'Tyson Foods Inc.',
    'TSS': 'Total System Services Inc.',
    'TWX': 'Time Warner Inc.',
    'TXN': 'Texas Instruments Incorporated',
    'TXT': 'Textron Inc.',
    'TYC': 'Tyco International plc',
    'UA': 'Under Armour Inc.',
    'UAA': 'Under Armour Inc.',
    'UAL': 'United Airlines Holdings Inc.',
    'UDR': 'UDR Inc.',
    'UHS': 'Universal Health Services Inc.',
    'ULTA': 'Ulta Beauty Inc.',
    'UNH': 'UnitedHealth Group Incorporated',
    'UNM': 'Unum Group',
    'UNP': 'Union Pacific Corporation',
    'UPS': 'United Parcel Service Inc.',
    'URBN': 'Urban Outfitters Inc.',
    'URI': 'United Rentals Inc.',
    'USB': 'U.S. Bancorp',
    'UTX': 'United Technologies Corporation',
    'V': 'Visa Inc.',
    'VAR': 'Varian Medical Systems Inc.',
    'VFC': 'V.F. Corporation',
    'VIAB': 'Viacom Inc.',
    'VLO': 'Valero Energy Corporation',
    'VMC': 'Vulcan Materials Company',
    'VNO': 'Vornado Realty Trust',
    'VRSK': 'Verisk Analytics Inc.',
    'VRSN': 'VeriSign Inc.',
    'VRTX': 'Vertex Pharmaceuticals Incorporated',
    'VZ': 'Verizon Communications Inc.',
    'WAT': 'Waters Corporation',
    'WBA': 'Walgreens Boots Alliance Inc.',
    'WDC': 'Western Digital Corporation',
    'WEC': 'WEC Energy Group Inc.',
    'WFC': 'Wells Fargo & Company',
    'WFM': 'Whole Foods Market Inc.',
    'WHR': 'Whirlpool Corporation',
    'WLTW': 'Willis Towers Watson Public Limited Company',
    'WM': 'Waste Management Inc.',
    'WMB': 'Williams Companies Inc.',
    'WMT': 'Walmart Inc.',
    'WU': 'Western Union Company',
    'WY': 'Weyerhaeuser Company',
    'WYN': 'Wyndham Worldwide Corporation',
    'WYNN': 'Wynn Resorts Limited',
    'X': 'United States Steel Corporation',
    'XEL': 'Xcel Energy Inc.',
    'XL': 'XL Group Ltd.',
    'XLNX': 'Xilinx Inc.',
    'XOM': 'Exxon Mobil Corporation',
    'XRAY': 'DENTSPLY SIRONA Inc.',
    'XRX': 'Xerox Corporation',
    'XYL': 'Xylem Inc.',
    'YHOO': 'Yahoo! Inc.',
    'YUM': 'Yum! Brands Inc.',
    'ZBH': 'Zimmer Biomet Holdings Inc.',
    'ZION': 'Zions Bancorporation N.A.',
    'ZTS': 'Zoetis Inc.'
  };

  // 🔍 Get stock suggestions based on partial input
  const getStockSuggestions = (query: string) => {
    if (!query.trim()) return [];
    
    const upperQuery = query.trim().toUpperCase();
    return Object.keys(commonStocks)
      .filter(symbol => symbol.startsWith(upperQuery))
      .slice(0, 3) // Show top 3 matches
      .map(symbol => ({
        symbol,
        name: commonStocks[symbol as keyof typeof commonStocks]
      }));
  };

  // 🔎 Search for specific stock details
  const searchStockDetails = async (symbol: string) => {
    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/stocks/yfinance/search?q=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(errorData.error || 'Search failed');
      }
      const data = await response.json();
      
      // Check if we got valid data
      if (data && data.symbol) {
        setSearchResults([data]);
      } else {
        throw new Error('Invalid stock symbol');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search stocks';
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 🔍 Get suggestions as user types
  const suggestions = getStockSuggestions(searchQuery);

  // 🎯 Exact-match preference: if the user typed a full ticker, show only that result
  const upper = searchQuery.trim().toUpperCase();
  const looksLikeTicker = /^[A-Z\.]{1,6}$/.test(upper);
  const exact = looksLikeTicker ? searchResults.find(r => r.symbol === upper) : undefined;
  const displayResults = exact ? [exact] : searchResults;

  // Static cards filter (kept)
  const filteredStocks = availableStocks.filter(stock => {
    const matchesSearch = !searchQuery ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  // ⌨️ Enter to search for the current query
  const handleEnterToOpen = () => {
    if (searchQuery.trim()) {
      searchStockDetails(searchQuery.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-orange-400 text-xl">📊</span>
            Available Stocks
          </CardTitle>
          <CardDescription className="text-slate-400">Search and analyze stocks with AI insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL, TSLA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEnterToOpen();
                }}
                className="w-full bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-slate-500 text-xs mt-1">
                Enter a valid stock symbol to search for real-time data
              </p>
            </div>
            <Button
              className="searchButton bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (searchQuery.trim()) {
                  searchStockDetails(searchQuery.trim().toUpperCase());
                }
              }}
              disabled={!searchQuery.trim() || searching}
            >
              <span className="mr-2">🔍</span>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Suggestions panel */}
          {searchQuery && suggestions.length > 0 && (
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="p-3 border-b border-slate-700 text-slate-400 text-xs">
                Suggestions for "{searchQuery}"
              </div>
              <div className="max-h-64 overflow-auto">
                {suggestions.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700 last:border-b-0"
                    onClick={() => {
                      setSearchQuery(stock.symbol);
                      searchStockDetails(stock.symbol);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-white font-bold text-lg">{stock.symbol}</div>
                      </div>
                      <div className="text-slate-300 text-sm">{stock.name}</div>
                      <div className="text-slate-500 text-xs mt-1">Click to search for this stock</div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Search
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results panel */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="p-3 border-b border-slate-700 text-slate-400 text-xs">
                Search Results for "{searchQuery}"
              </div>
              <div className="max-h-64 overflow-auto">
                {searching && (
                  <div className="p-4 text-center">
                    <div className="text-slate-400 text-sm mb-2">🔍 Searching for {searchQuery}...</div>
                    <div className="text-slate-500 text-xs">Fetching real-time data from Yahoo Finance</div>
                  </div>
                )}
                {searchError && (
                  <div className="p-4 text-center">
                    <div className="text-red-400 text-sm mb-2">❌ {searchError}</div>
                    <div className="text-slate-500 text-xs">Please check the symbol and try again</div>
                  </div>
                )}
                {!searching && !searchError && searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700 last:border-b-0"
                    onClick={() => {
                      setActiveSymbol(r.symbol);
                      setSelectedStock(r.symbol);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-white font-bold text-lg">{r.symbol}</div>
                        <div className="text-green-400 text-sm font-medium">
                          ${r.current_price?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div className="text-slate-300 text-sm mb-1">{r.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>📊 {r.sector || 'Unknown Sector'}</span>
                        <span>•</span>
                        <span>🏢 {r.exchange || 'Unknown Exchange'}</span>
                        <span>•</span>
                        <span>💰 ${(r.market_cap / 1e9).toFixed(1)}B</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      View Chart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No suggestions found */}
          {searchQuery && suggestions.length === 0 && searchResults.length === 0 && !searching && (
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="p-4 text-center">
                <div className="text-slate-400 text-sm mb-2">No suggestions found for "{searchQuery}"</div>
                <div className="text-slate-500 text-xs">Try typing a different letter or symbol</div>
              </div>
            </div>
          )}

          {/* Popular Stock Suggestions */}
          {!searchQuery && (
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">💡 Try these popular stocks:</p>
              <div className="flex gap-2 flex-wrap">
                {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'].map((symbol) => (
                  <Button
                    key={symbol}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(symbol);
                      searchStockDetails(symbol);
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {sectors.map((sector) => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSector(sector)}
                className={selectedSector === sector ? "bg-orange-600 hover:bg-orange-700" : "border-slate-600 text-slate-400"}
              >
                {sector}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market overview cards (kept) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-green-400">Gainers</CardTitle>
            <span className="text-green-400 text-lg">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">+2.1%</div>
            <p className="text-xs text-green-400">Average gain</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-red-400">Losers</CardTitle>
            <span className="text-red-400 text-lg">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">-0.8%</div>
            <p className="text-xs text-red-400">Average loss</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-blue-400">Volume</CardTitle>
            <span className="text-blue-400 text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">42M</div>
            <p className="text-xs text-blue-400">Average volume</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-purple-400">AI Sentiment</CardTitle>
            <span className="text-purple-400 text-lg">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">Bullish</div>
            <p className="text-xs text-purple-400">75% positive</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {!activeSymbol && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-blue-400 text-lg">🏁</span>
              Search a stock to get started
            </CardTitle>
            <CardDescription className="text-slate-400">Enter a ticker like AAPL, MSFT, NVDA to view price and chart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-sm">
              No data loaded yet. Use the search box above and choose a result or press Enter.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {(activeSymbol || selectedStock) && (
        <Card className="text-white bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-white-400 text-lg">📈</span>
              {(activeSymbol || selectedStock) as string} Real-time Chart
            </CardTitle>
            <CardDescription className="text-slate-400">Live price data and 30-day historical chart (free-tier delayed)</CardDescription>
          </CardHeader>
          <CardContent>
            <StockChart symbol={(activeSymbol || selectedStock) as string} />
          </CardContent>
        </Card>
      )}

      {/* AI suggestions (kept) */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400 text-lg">🤖</span>
            AI Stock Recommendations
          </CardTitle>
          <CardDescription className="text-slate-400">Personalized recommendations powered by Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">🔥 Hot Picks</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">NVDA - NVIDIA Corp.</span>
                  <Badge className="bg-green-500/20 text-green-400">Strong Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">AAPL - Apple Inc.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">MSFT - Microsoft Corp.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h4 className="text-white font-medium mb-2">💎 Value Plays</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">JNJ - Johnson & Johnson</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">META - Meta Platforms</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">Hold</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">GOOGL - Alphabet Inc.</span>
                  <Badge className="bg-blue-500/20 text-blue-400">Buy</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-lg">💡</span>
              <span className="text-blue-400 font-medium">AI Market Insight</span>
            </div>
            <p className="text-slate-200 text-sm">
              Technology sector continues to show strong momentum with AI-related stocks leading gains. 
              Consider diversifying into healthcare and utilities for better risk-adjusted returns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
