/**
 * Fetch Israeli Securities from EOD API
 * 
 * This script fetches all securities from the Tel Aviv Stock Exchange (TA)
 * using EOD Historical Data API, translates names to Hebrew, and populates
 * the SecurityEnrichment table.
 * 
 * Usage:
 * npx ts-node scripts/fetch-ta-securities.ts
 * 
 * Options:
 * --dry-run    Only fetch and display, don't save to DB
 * --csv        Export results to CSV file
 * --types=ETF,Stock  Filter by specific types (comma-separated)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env files manually
// Check .env.local first, then .env
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

const prisma = new PrismaClient();

// ============================================================================
// TRANSLATION DICTIONARY - Inline to avoid module resolution issues
// ============================================================================

// Israeli fund management companies
const COMPANY_NAMES: Record<string, string> = {
  'TACHLIT': 'תכלית',
  'HAREL': 'הראל',
  'MIGDAL': 'מגדל',
  'PSAGOT': 'פסגות',
  'KSM': 'קסם',
  'KESEM': 'קסם',
  'FIBI': 'בנק הבינלאומי',
  'LEUMI': 'לאומי',
  'POALIM': 'הפועלים',
  'DISCOUNT': 'דיסקונט',
  'MIZRAHI': 'מזרחי',
  'ALTSHULER': 'אלטשולר שחם',
  'MEITAV': 'מיטב',
  'MORE': 'מור',
  'ANALYST': 'אנליסט',
  'EXCELLENCE': 'אקסלנס',
  'IBI': 'אי.בי.אי',
  'PHOENIX': 'הפניקס',
  'CLAL': 'כלל',
  'MENORA': 'מנורה',
  'AYALON': 'איילון',
};

// Index names
const INDICES: Record<string, string> = {
  'TA 125': 'ת"א 125',
  'TA125': 'ת"א 125',
  'TA-125': 'ת"א 125',
  'TA 35': 'ת"א 35',
  'TA35': 'ת"א 35',
  'TA-35': 'ת"א 35',
  'TA 90': 'ת"א 90',
  'TA90': 'ת"א 90',
  'TA-90': 'ת"א 90',
  'S&P 500': 'S&P 500',
  'S&P500': 'S&P 500',
  'SP500': 'S&P 500',
  'SPX': 'S&P 500',
  'NASDAQ': 'נאסד"ק',
  'NASDAQ 100': 'נאסד"ק 100',
  'NASDAQ-100': 'נאסד"ק 100',
  'QQQ': 'נאסד"ק 100',
  'MSCI WORLD': 'MSCI World',
  'MSCI ACWI': 'MSCI ACWI',
  'MSCI EUROPE': 'MSCI אירופה',
  'MSCI EM': 'שווקים מתפתחים',
  'EMERGING': 'שווקים מתפתחים',
  'EMERGING MARKETS': 'שווקים מתפתחים',
  'EUROPE': 'אירופה',
  'GOLD': 'זהב',
};

// Asset type translations
const ASSET_TYPES_MAP: Record<string, string> = {
  'SAL': 'סל',
  'ETF': 'קרן סל',
  'INDEX': 'מדד',
  'FUND': 'קרן',
  'BOND': 'אג"ח',
  'STOCK': 'מניה',
  '4D': '4D',
};

// Sector mappings
const SECTOR_MAPPINGS: Record<string, string> = {
  'ETF_TA125': 'מניות - תל אביב 125',
  'ETF_TA35': 'מניות - תל אביב 35',
  'ETF_TA90': 'מניות - תל אביב 90',
  'ETF_SP500': 'מניות - ארה"ב',
  'ETF_NASDAQ': 'מניות - טכנולוגיה',
  'ETF_WORLD': 'מניות - בינלאומי',
  'ETF_EUROPE': 'מניות - אירופה',
  'ETF_EM': 'מניות - שווקים מתפתחים',
  'ETF_GOLD': 'סחורות - זהב',
  'ETF_BOND': 'אג"ח',
  'ETF_ISRAEL': 'מניות - ישראל',
  'STOCK_BANK': 'בנקים',
  'STOCK_INSURANCE': 'ביטוח',
  'STOCK_REALESTATE': 'נדל"ן',
  'BOND_GOV': 'אג"ח ממשלתי',
  'BOND_CORP': 'אג"ח קונצרני',
};

function translateToHebrew(englishName: string): string {
  if (!englishName) return englishName;
  
  let hebrewName = englishName;
  
  // Replace company names
  for (const [english, hebrew] of Object.entries(COMPANY_NAMES)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    hebrewName = hebrewName.replace(regex, hebrew);
  }
  
  // Replace indices
  for (const [english, hebrew] of Object.entries(INDICES)) {
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    hebrewName = hebrewName.replace(regex, hebrew);
  }
  
  // Replace asset types
  for (const [english, hebrew] of Object.entries(ASSET_TYPES_MAP)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    hebrewName = hebrewName.replace(regex, hebrew);
  }
  
  return hebrewName.replace(/\s+/g, ' ').trim();
}

function determineSector(type: string, name: string): string {
  const upperName = name.toUpperCase();
  const upperType = type.toUpperCase();
  
  if (upperType === 'ETF' || upperName.includes('SAL')) {
    if (upperName.includes('TA 125') || upperName.includes('TA125')) return SECTOR_MAPPINGS['ETF_TA125'];
    if (upperName.includes('TA 35') || upperName.includes('TA35')) return SECTOR_MAPPINGS['ETF_TA35'];
    if (upperName.includes('TA 90') || upperName.includes('TA90')) return SECTOR_MAPPINGS['ETF_TA90'];
    if (upperName.includes('S&P') || upperName.includes('SP500')) return SECTOR_MAPPINGS['ETF_SP500'];
    if (upperName.includes('NASDAQ') || upperName.includes('QQQ')) return SECTOR_MAPPINGS['ETF_NASDAQ'];
    if (upperName.includes('WORLD') || upperName.includes('ACWI')) return SECTOR_MAPPINGS['ETF_WORLD'];
    if (upperName.includes('EUROPE')) return SECTOR_MAPPINGS['ETF_EUROPE'];
    if (upperName.includes('EMERGING')) return SECTOR_MAPPINGS['ETF_EM'];
    if (upperName.includes('GOLD')) return SECTOR_MAPPINGS['ETF_GOLD'];
    if (upperName.includes('BOND')) return SECTOR_MAPPINGS['ETF_BOND'];
    return SECTOR_MAPPINGS['ETF_ISRAEL'];
  }
  
  if (upperType === 'COMMON STOCK') {
    if (upperName.includes('BANK')) return SECTOR_MAPPINGS['STOCK_BANK'];
    if (upperName.includes('INSURANCE')) return SECTOR_MAPPINGS['STOCK_INSURANCE'];
    return 'מניות - ישראל';
  }
  
  if (upperType === 'BOND') {
    if (upperName.includes('GOV')) return SECTOR_MAPPINGS['BOND_GOV'];
    return SECTOR_MAPPINGS['BOND_CORP'];
  }
  
  return 'ישראל';
}

function needsReview(originalName: string, translatedName: string): boolean {
  if (originalName === translatedName) return true;
  const englishPattern = /[A-Z]{4,}/g;
  const matches = translatedName.match(englishPattern) || [];
  const knownAbbreviations = ['MSCI', 'S&P'];
  for (const match of matches) {
    if (!knownAbbreviations.includes(match)) return true;
  }
  return false;
}

function mapAssetType(eodType: string): string {
  const typeMap: Record<string, string> = {
    'ETF': 'ETF',
    'Common Stock': 'Stock',
    'Fund': 'Mutual Fund',
    'Bond': 'Bond',
    'Preferred Stock': 'Stock',
  };
  return typeMap[eodType] || eodType;
}

const EOD_API_TOKEN = process.env.EOD_API_TOKEN || '';
const EOD_BASE_URL = 'https://eodhistoricaldata.com/api';

interface EODExchangeSymbol {
  Code: string;
  Name: string;
  Country: string;
  Exchange: string;
  Currency: string;
  Type: string;
  Isin?: string;
}

interface SecurityEnrichmentData {
  symbol: string;
  nameHe: string;
  shortNameHe: string | null;
  sectorHe: string;
  assetType: string;
  needsReview?: boolean;
  originalName?: string;
}

/**
 * Fetch data from EOD API
 */
async function fetchEOD<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${EOD_BASE_URL}/${endpoint}`);
  url.searchParams.set('api_token', EOD_API_TOKEN);
  url.searchParams.set('fmt', 'json');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  console.log(`📡 Fetching: ${endpoint}...`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`EOD API error: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  
  if (text.startsWith('<!DOCTYPE') || text.startsWith('Error')) {
    throw new Error(`EOD API returned error: ${text.substring(0, 100)}`);
  }
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`EOD API returned invalid JSON: ${text.substring(0, 100)}`);
  }
}

/**
 * Fetch all securities from Tel Aviv exchange
 */
async function fetchTASecurities(): Promise<EODExchangeSymbol[]> {
  try {
    const securities = await fetchEOD<EODExchangeSymbol[]>('exchange-symbol-list/TA');
    console.log(`✅ Fetched ${securities.length} securities from TA exchange`);
    return securities;
  } catch (error) {
    console.error('❌ Failed to fetch TA securities:', error);
    throw error;
  }
}

/**
 * Filter securities by relevant types
 */
function filterSecurities(
  securities: EODExchangeSymbol[],
  types?: string[]
): EODExchangeSymbol[] {
  const defaultTypes = ['ETF', 'Fund', 'Common Stock', 'Preferred Stock'];
  const filterTypes = types || defaultTypes;
  
  const filtered = securities.filter(s => filterTypes.includes(s.Type));
  
  console.log(`📊 Filtered to ${filtered.length} securities (types: ${filterTypes.join(', ')})`);
  
  // Log breakdown by type
  const breakdown = filtered.reduce((acc, s) => {
    acc[s.Type] = (acc[s.Type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('   Breakdown:');
  Object.entries(breakdown).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });
  
  return filtered;
}

/**
 * Transform EOD securities to our enrichment format
 */
function transformSecurities(securities: EODExchangeSymbol[]): SecurityEnrichmentData[] {
  return securities.map(s => {
    const symbol = `${s.Code}.TA`.toUpperCase();
    const translatedName = translateToHebrew(s.Name);
    const sectorHe = determineSector(s.Type, s.Name);
    const assetType = mapAssetType(s.Type);
    const review = needsReview(s.Name, translatedName);
    
    // Create short name (first 30 chars or until first parenthesis)
    let shortName = translatedName;
    const parenIndex = shortName.indexOf('(');
    if (parenIndex > 0) {
      shortName = shortName.substring(0, parenIndex).trim();
    }
    if (shortName.length > 30) {
      shortName = shortName.substring(0, 30).trim();
    }
    
    return {
      symbol,
      nameHe: translatedName,
      shortNameHe: shortName !== translatedName ? shortName : null,
      sectorHe,
      assetType,
      needsReview: review,
      originalName: s.Name,
    };
  });
}

/**
 * Save securities to database
 */
async function saveToDatabase(securities: SecurityEnrichmentData[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  
  console.log(`\n💾 Saving ${securities.length} securities to database...`);
  
  for (const data of securities) {
    try {
      const existing = await prisma.securityEnrichment.findUnique({
        where: { symbol: data.symbol },
      });
      
      if (existing) {
        await prisma.securityEnrichment.update({
          where: { symbol: data.symbol },
          data: {
            nameHe: data.nameHe,
            shortNameHe: data.shortNameHe,
            sectorHe: data.sectorHe,
            assetType: data.assetType,
          },
        });
        updated++;
      } else {
        await prisma.securityEnrichment.create({
          data: {
            symbol: data.symbol,
            nameHe: data.nameHe,
            shortNameHe: data.shortNameHe,
            sectorHe: data.sectorHe,
            assetType: data.assetType,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`   ❌ Error saving ${data.symbol}:`, error);
    }
  }
  
  return { created, updated };
}

/**
 * Export securities to CSV file
 */
function exportToCSV(securities: SecurityEnrichmentData[], filename: string): void {
  const outputDir = path.join(__dirname, 'output');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filepath = path.join(outputDir, filename);
  
  // CSV header
  const header = 'Symbol,Original Name,Hebrew Name,Short Name,Sector,Type,Needs Review\n';
  
  // CSV rows
  const rows = securities.map(s => {
    const escapeCsv = (str: string | null) => {
      if (!str) return '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [
      escapeCsv(s.symbol),
      escapeCsv(s.originalName || ''),
      escapeCsv(s.nameHe),
      escapeCsv(s.shortNameHe),
      escapeCsv(s.sectorHe),
      escapeCsv(s.assetType),
      s.needsReview ? 'Yes' : 'No',
    ].join(',');
  }).join('\n');
  
  fs.writeFileSync(filepath, header + rows, 'utf-8');
  
  console.log(`\n📄 Exported to: ${filepath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Fetch TA Securities Script\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const exportCsv = args.includes('--csv');
  
  // Parse types filter
  const typesArg = args.find(a => a.startsWith('--types='));
  const types = typesArg ? typesArg.split('=')[1].split(',') : undefined;
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved to database\n');
  }
  
  // Check API token
  if (!EOD_API_TOKEN) {
    console.error('❌ Error: EOD_API_TOKEN environment variable is required');
    console.log('\nSet it in your .env file or export it:');
    console.log('export EOD_API_TOKEN=your_token_here');
    process.exit(1);
  }
  
  try {
    // 1. Fetch all TA securities
    const allSecurities = await fetchTASecurities();
    
    // 2. Filter by relevant types
    const filteredSecurities = filterSecurities(allSecurities, types);
    
    // 3. Transform to our format with Hebrew translation
    const transformedSecurities = transformSecurities(filteredSecurities);
    
    // Count needs review
    const needsReviewCount = transformedSecurities.filter(s => s.needsReview).length;
    console.log(`\n⚠️  ${needsReviewCount} securities need manual review`);
    
    // 4. Show sample of translations
    console.log('\n📋 Sample translations:');
    transformedSecurities.slice(0, 10).forEach(s => {
      const reviewFlag = s.needsReview ? ' ⚠️' : ' ✅';
      console.log(`   ${s.symbol}: ${s.originalName} → ${s.nameHe}${reviewFlag}`);
    });
    
    // 5. Export to CSV if requested
    if (exportCsv) {
      const timestamp = new Date().toISOString().split('T')[0];
      exportToCSV(transformedSecurities, `ta-securities-${timestamp}.csv`);
    }
    
    // 6. Save to database (unless dry run)
    if (!dryRun) {
      const { created, updated } = await saveToDatabase(transformedSecurities);
      
      console.log('\n✅ Database update complete!');
      console.log(`   - Created: ${created}`);
      console.log(`   - Updated: ${updated}`);
      console.log(`   - Total: ${transformedSecurities.length}`);
    } else {
      console.log('\n⏭️  Skipping database save (dry run mode)');
    }
    
    // 7. Show final statistics
    const stats = await prisma.securityEnrichment.groupBy({
      by: ['assetType'],
      _count: true,
    });
    
    if (stats.length > 0) {
      console.log('\n📈 Database statistics:');
      stats.forEach(({ assetType, _count }) => {
        console.log(`   - ${assetType}: ${_count}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { fetchTASecurities, filterSecurities, transformSecurities, saveToDatabase };

