/**
 * Translation Dictionary for Israeli Securities
 * 
 * Maps English terms from EOD API to Hebrew equivalents
 * Used by the enrichment system to auto-translate security names
 */

// Israeli fund management companies
export const COMPANY_NAMES: Record<string, string> = {
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

// Asset type translations
export const ASSET_TYPES: Record<string, string> = {
  'SAL': 'סל',
  'ETF': 'קרן סל',
  'INDEX': 'מדד',
  'FUND': 'קרן',
  'BOND': 'אג"ח',
  'STOCK': 'מניה',
  'TRACKER': 'עוקב',
  '4D': '4D',
};

// Index names
export const INDICES: Record<string, string> = {
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
  'ASIA': 'אסיה',
  'JAPAN': 'יפן',
  'CHINA': 'סין',
  'GOLD': 'זהב',
  'SILVER': 'כסף',
  'OIL': 'נפט',
  'REAL ESTATE': 'נדל"ן',
  'TECH': 'טכנולוגיה',
  'TECHNOLOGY': 'טכנולוגיה',
  'HEALTHCARE': 'בריאות',
  'FINANCE': 'פיננסים',
  'ENERGY': 'אנרגיה',
  'GOVERNMENT': 'ממשלתי',
  'CORPORATE': 'קונצרני',
  'SHEKEL': 'שקלי',
  'DOLLAR': 'דולרי',
  'LINKED': 'צמוד',
  'UNLINKED': 'לא צמוד',
};

// Sector mappings based on security type and name patterns
export const SECTOR_MAPPINGS: Record<string, string> = {
  // ETF sectors
  'ETF_TA125': 'מניות - תל אביב 125',
  'ETF_TA35': 'מניות - תל אביב 35',
  'ETF_TA90': 'מניות - תל אביב 90',
  'ETF_SP500': 'מניות - ארה"ב',
  'ETF_NASDAQ': 'מניות - טכנולוגיה',
  'ETF_WORLD': 'מניות - בינלאומי',
  'ETF_EUROPE': 'מניות - אירופה',
  'ETF_EM': 'מניות - שווקים מתפתחים',
  'ETF_ASIA': 'מניות - אסיה',
  'ETF_GOLD': 'סחורות - זהב',
  'ETF_BOND': 'אג"ח',
  'ETF_TECH': 'מניות - טכנולוגיה',
  'ETF_ISRAEL': 'מניות - ישראל',
  
  // Stock sectors
  'STOCK_BANK': 'בנקים',
  'STOCK_INSURANCE': 'ביטוח',
  'STOCK_REALESTATE': 'נדל"ן',
  'STOCK_TECH': 'טכנולוגיה',
  'STOCK_PHARMA': 'תרופות',
  'STOCK_TELECOM': 'תקשורת',
  'STOCK_ENERGY': 'אנרגיה',
  'STOCK_RETAIL': 'קמעונאות',
  'STOCK_FOOD': 'מזון',
  'STOCK_INDUSTRIAL': 'תעשייה',
  
  // Bond sectors
  'BOND_GOV': 'אג"ח ממשלתי',
  'BOND_CORP': 'אג"ח קונצרני',
  'BOND_LINKED': 'אג"ח צמוד',
  'BOND_UNLINKED': 'אג"ח לא צמוד',
};

/**
 * Translate an English security name to Hebrew
 * Uses pattern matching and dictionary lookups
 */
export function translateToHebrew(englishName: string): string {
  if (!englishName) return englishName;
  
  let hebrewName = englishName.toUpperCase();
  
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
  for (const [english, hebrew] of Object.entries(ASSET_TYPES)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    hebrewName = hebrewName.replace(regex, hebrew);
  }
  
  // Clean up and format
  hebrewName = hebrewName
    .replace(/\s+/g, ' ')
    .trim();
  
  // If nothing was translated, return original
  if (hebrewName === englishName.toUpperCase()) {
    return englishName;
  }
  
  return hebrewName;
}

/**
 * Determine sector based on security type and name
 */
export function determineSector(type: string, name: string): string {
  const upperName = name.toUpperCase();
  const upperType = type.toUpperCase();
  
  // ETF sector detection
  if (upperType === 'ETF' || upperName.includes('SAL') || upperName.includes('סל')) {
    if (upperName.includes('TA 125') || upperName.includes('TA125') || upperName.includes('ת"א 125')) {
      return SECTOR_MAPPINGS['ETF_TA125'];
    }
    if (upperName.includes('TA 35') || upperName.includes('TA35') || upperName.includes('ת"א 35')) {
      return SECTOR_MAPPINGS['ETF_TA35'];
    }
    if (upperName.includes('TA 90') || upperName.includes('TA90') || upperName.includes('ת"א 90')) {
      return SECTOR_MAPPINGS['ETF_TA90'];
    }
    if (upperName.includes('S&P') || upperName.includes('SP500') || upperName.includes('SPX')) {
      return SECTOR_MAPPINGS['ETF_SP500'];
    }
    if (upperName.includes('NASDAQ') || upperName.includes('QQQ') || upperName.includes('נאסד')) {
      return SECTOR_MAPPINGS['ETF_NASDAQ'];
    }
    if (upperName.includes('WORLD') || upperName.includes('ACWI')) {
      return SECTOR_MAPPINGS['ETF_WORLD'];
    }
    if (upperName.includes('EUROPE') || upperName.includes('אירופה')) {
      return SECTOR_MAPPINGS['ETF_EUROPE'];
    }
    if (upperName.includes('EMERGING') || upperName.includes('מתפתחים')) {
      return SECTOR_MAPPINGS['ETF_EM'];
    }
    if (upperName.includes('ASIA') || upperName.includes('אסיה')) {
      return SECTOR_MAPPINGS['ETF_ASIA'];
    }
    if (upperName.includes('GOLD') || upperName.includes('זהב')) {
      return SECTOR_MAPPINGS['ETF_GOLD'];
    }
    if (upperName.includes('BOND') || upperName.includes('אג"ח')) {
      return SECTOR_MAPPINGS['ETF_BOND'];
    }
    if (upperName.includes('TECH') || upperName.includes('טכנולוגיה')) {
      return SECTOR_MAPPINGS['ETF_TECH'];
    }
    // Default Israeli ETF
    return SECTOR_MAPPINGS['ETF_ISRAEL'];
  }
  
  // Stock sector detection
  if (upperType === 'COMMON STOCK' || upperType === 'STOCK') {
    if (upperName.includes('BANK') || upperName.includes('בנק')) {
      return SECTOR_MAPPINGS['STOCK_BANK'];
    }
    if (upperName.includes('INSURANCE') || upperName.includes('ביטוח')) {
      return SECTOR_MAPPINGS['STOCK_INSURANCE'];
    }
    if (upperName.includes('REAL ESTATE') || upperName.includes('נדל"ן')) {
      return SECTOR_MAPPINGS['STOCK_REALESTATE'];
    }
    if (upperName.includes('PHARMA') || upperName.includes('תרופות')) {
      return SECTOR_MAPPINGS['STOCK_PHARMA'];
    }
    if (upperName.includes('TELECOM') || upperName.includes('תקשורת')) {
      return SECTOR_MAPPINGS['STOCK_TELECOM'];
    }
    // Default stock sector
    return 'מניות - ישראל';
  }
  
  // Bond sector detection
  if (upperType === 'BOND' || upperName.includes('BOND') || upperName.includes('אג"ח')) {
    if (upperName.includes('GOV') || upperName.includes('ממשלתי')) {
      return SECTOR_MAPPINGS['BOND_GOV'];
    }
    if (upperName.includes('CORP') || upperName.includes('קונצרני')) {
      return SECTOR_MAPPINGS['BOND_CORP'];
    }
    return 'אג"ח';
  }
  
  // Default
  return 'ישראל';
}

/**
 * Check if translation needs manual review
 * Returns true if the auto-translation is uncertain
 */
export function needsReview(originalName: string, translatedName: string): boolean {
  // If nothing was translated
  if (originalName === translatedName) {
    return true;
  }
  
  // If still has English characters (except known abbreviations)
  const englishPattern = /[A-Z]{3,}/g;
  const matches = translatedName.match(englishPattern) || [];
  const knownAbbreviations = ['MSCI', 'ETF', 'S&P', '4D'];
  
  for (const match of matches) {
    if (!knownAbbreviations.includes(match)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Map EOD asset type to Hebrew
 */
export function mapAssetType(eodType: string): string {
  const typeMap: Record<string, string> = {
    'ETF': 'ETF',
    'Common Stock': 'Stock',
    'Fund': 'Mutual Fund',
    'Bond': 'Bond',
    'Preferred Stock': 'Stock',
  };
  
  return typeMap[eodType] || eodType;
}

