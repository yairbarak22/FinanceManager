/**
 * גלאי ארביטראז' - נכסים נזילים מול חוב בריבית גבוהה
 * 
 * תנאי: יש נכסים נזילים וגם חוב בריבית גבוהה
 * עדיפות: גבוהה
 */

import { createRule } from '../ruleFactory';
import { 
  hasLiquidAssets, 
  hasHighInterestDebt, 
  getLiquidAssetsValue,
  getHighInterestDebtAmount,
  getHighestInterestRate
} from '../helpers';
import { INTEREST_THRESHOLDS } from '../constants';

export default createRule({
  id: 'arbitrage-detector',
  name: 'גלאי ארביטראז\' - חיסכון מול חוב',
  
  condition: (ctx) => {
    // Must have both liquid assets AND high interest debt
    if (!hasLiquidAssets(ctx) || !hasHighInterestDebt(ctx)) {
      return false;
    }
    
    const liquidValue = getLiquidAssetsValue(ctx);
    const debtAmount = getHighInterestDebtAmount(ctx);
    
    // Only recommend if liquid assets can cover at least 20% of the debt
    return liquidValue >= debtAmount * 0.2;
  },
  
  recommendation: {
    title: 'הזדמנות לחסוך בריבית',
    description: 'יש לך חסכונות נזילים ובמקביל חובות בריבית גבוהה. שקול/י להשתמש בחלק מהחסכונות לסגירת החובות - החיסכון בריבית גבוה מהרווח על החסכונות.',
    type: 'savings',
    priority: 'high',
  },
});

