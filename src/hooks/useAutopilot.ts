'use client';

import { useCallback, useRef } from 'react';
import { useOnboarding, WizardData } from '@/context/OnboardingContext';
import { getStepById } from '@/components/onboarding/stepsConfig';

/**
 * Element position relative to viewport
 */
interface ElementPosition {
  x: number;
  y: number;
  found: boolean;
}

/**
 * Autopilot sequence result
 */
interface AutopilotResult {
  success: boolean;
  stepId: string;
  error?: string;
}

// ============================================
// Timing Constants (in ms) - SLOW for demo effect
// ============================================
const TIMING = {
  CURSOR_TRAVEL: 1200,        // Time for cursor to move to target
  PAUSE_BEFORE_CLICK: 400,    // Pause before clicking
  PAUSE_AFTER_CLICK: 600,     // Pause after clicking
  MODAL_OPEN_WAIT: 800,       // Wait for modal to open
  TYPING_CHAR_DELAY: 60,      // Delay per character when typing
  PAUSE_BETWEEN_FIELDS: 600,  // Pause between form fields
  PAUSE_BEFORE_SAVE: 500,     // Pause before clicking save
  SUCCESS_DISPLAY: 1800,      // How long to show success message
  SEQUENCE_END_PAUSE: 1200,   // Pause at end of sequence
  DROPDOWN_OPEN_WAIT: 400,    // Wait for dropdown to open
};

/**
 * useAutopilot - The "Engine" that drives the SmartGhostCursor
 *
 * Provides choreographed cursor animations with REAL DOM interaction:
 * - Opens actual modals by clicking buttons
 * - Types in real input fields
 * - Selects options from dropdowns
 * - Clicks save buttons
 */
// Global refs shared across all hook instances
const globalIsRunningRef = { current: false };
const globalAbortedRef = { current: false };

export function useAutopilot() {
  const {
    moveCursorTo,
    setCursorLabel,
    clearCursor,
    simulateClick,
    openWizard,
    setCurrentStepIndex,
    setAutopilotInModal,
  } = useOnboarding();

  // Use global refs so all components share the same state
  const isRunningRef = globalIsRunningRef;
  const abortedRef = globalAbortedRef;

  // ============================================
  // Helper Functions
  // ============================================

  const wait = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const shouldAbort = useCallback((): boolean => {
    return abortedRef.current;
  }, []);

  /**
   * Wait for an element to appear in the DOM
   */
  const waitForElement = useCallback(async (selector: string, timeout: number = 5000): Promise<HTMLElement | null> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
      await wait(100);
    }
    console.warn(`[Autopilot] Timeout waiting for: ${selector}`);
    return null;
  }, [wait]);

  /**
   * Get element center coordinates
   */
  const getElementCenter = useCallback((element: HTMLElement): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  // ============================================
  // Core Actions
  // ============================================

  /**
   * Move cursor to element and show label
   */
  const moveToElement = useCallback(
    async (element: HTMLElement, label: string): Promise<boolean> => {
      if (shouldAbort()) return false;
      const { x, y } = getElementCenter(element);
      moveCursorTo(x, y, label);
      await wait(TIMING.CURSOR_TRAVEL);
      return !shouldAbort();
    },
    [moveCursorTo, getElementCenter, wait, shouldAbort]
  );

  /**
   * Move cursor to element by ID
   */
  const moveTo = useCallback(
    async (elementId: string, label: string): Promise<boolean> => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`[Autopilot] Element not found: #${elementId}`);
        return false;
      }
      return moveToElement(element, label);
    },
    [moveToElement]
  );

  /**
   * Click with visual feedback
   */
  const clickElement = useCallback(
    async (element: HTMLElement): Promise<boolean> => {
      if (shouldAbort()) return false;
      await wait(TIMING.PAUSE_BEFORE_CLICK);
      await simulateClick();
      element.click();
      await wait(TIMING.PAUSE_AFTER_CLICK);
      return !shouldAbort();
    },
    [simulateClick, wait, shouldAbort]
  );

  /**
   * Type text into an input field character by character
   * Uses native value setter to properly trigger React's change detection
   */
  const typeInInput = useCallback(
    async (input: HTMLInputElement, value: string, label: string): Promise<boolean> => {
      if (shouldAbort()) return false;

      // Move to input
      await moveToElement(input, `מקליד: ${label}...`);

      // Click to focus
      await simulateClick();
      input.focus();
      await wait(200);

      // Get the native value setter to bypass React's tracking
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (!nativeInputValueSetter) {
        // Fallback if native setter not available
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // Clear existing value
      nativeInputValueSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Type character by character
      let currentValue = '';
      for (let i = 0; i < value.length; i++) {
        if (shouldAbort()) return false;
        currentValue += value[i];
        nativeInputValueSetter.call(input, currentValue);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(TIMING.TYPING_CHAR_DELAY);
      }

      // Final change event to ensure React state is updated
      input.dispatchEvent(new Event('change', { bubbles: true }));

      setCursorLabel(`✓ ${label}: ${value}`);
      await wait(TIMING.PAUSE_BETWEEN_FIELDS);

      return !shouldAbort();
    },
    [moveToElement, simulateClick, setCursorLabel, wait, shouldAbort]
  );

  /**
   * Select option from StyledSelect dropdown (ProfileModal)
   */
  const selectStyledOption = useCallback(
    async (container: HTMLElement, optionValue: string, label: string): Promise<boolean> => {
      if (shouldAbort()) return false;

      // Find the trigger button
      const trigger = container.querySelector('button') as HTMLElement;
      if (!trigger) {
        console.warn('[Autopilot] Dropdown trigger not found');
        return false;
      }

      // Move to and click trigger to open dropdown
      await moveToElement(trigger, `בוחר: ${label}...`);
      await clickElement(trigger);
      await wait(TIMING.DROPDOWN_OPEN_WAIT);

      // Find the option with matching value
      const options = container.querySelectorAll('.category-option, [class*="option"]');
      for (const option of options) {
        const btn = option as HTMLElement;
        // Check if this option matches the value we want
        if (btn.textContent?.includes(optionValue) || btn.getAttribute('data-value') === optionValue) {
          await moveToElement(btn, optionValue);
          await clickElement(btn);
          setCursorLabel(`✓ ${label}: ${optionValue}`);
          await wait(TIMING.PAUSE_BETWEEN_FIELDS);
          return true;
        }
      }

      // If exact match not found, click the first visible option
      const firstOption = options[1] as HTMLElement; // Skip placeholder
      if (firstOption) {
        await moveToElement(firstOption, firstOption.textContent || '');
        await clickElement(firstOption);
      }

      return !shouldAbort();
    },
    [moveToElement, clickElement, setCursorLabel, wait, shouldAbort]
  );

  /**
   * Show success message
   */
  const showSuccess = useCallback(
    async (message: string): Promise<void> => {
      setCursorLabel(`✅ ${message}`);
      await wait(TIMING.SUCCESS_DISPLAY);
    },
    [setCursorLabel, wait]
  );

  /**
   * Scroll element into view
   */
  const scrollToElement = useCallback(async (elementId: string): Promise<boolean> => {
    const element = document.getElementById(elementId);
    if (!element) return false;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(600);
    return true;
  }, [wait]);

  /**
   * Scroll element into view within a container (like a modal)
   * This ensures the cursor doesn't go off-screen when targeting elements inside scrollable containers
   */
  const scrollElementIntoViewWithinContainer = useCallback(async (element: HTMLElement, container?: HTMLElement): Promise<void> => {
    // First scroll the element into view within the page
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(300);

    // If there's a scrollable container (like modal-body), scroll within it too
    if (container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if element is below the visible area of the container
      if (elementRect.bottom > containerRect.bottom) {
        container.scrollBy({
          top: elementRect.bottom - containerRect.bottom + 50,
          behavior: 'smooth'
        });
        await wait(300);
      }
      // Check if element is above the visible area
      else if (elementRect.top < containerRect.top) {
        container.scrollBy({
          top: elementRect.top - containerRect.top - 50,
          behavior: 'smooth'
        });
        await wait(300);
      }
    }
  }, [wait]);

  // ============================================
  // Step Sequences
  // ============================================

  /**
   * Select from ProfileModal's StyledSelect (uses .category-select-trigger)
   */
  const selectProfileDropdown = useCallback(
    async (dropdownIndex: number, optionText: string, label: string): Promise<boolean> => {
      if (shouldAbort()) return false;

      // Find all dropdown triggers in the modal
      const triggers = document.querySelectorAll('.category-select-trigger');
      const trigger = triggers[dropdownIndex] as HTMLElement;

      if (!trigger) {
        console.warn(`[Autopilot] Dropdown trigger ${dropdownIndex} not found`);
        return false;
      }

      // Move to and click trigger
      await moveToElement(trigger, `בוחר: ${label}...`);
      await clickElement(trigger);
      await wait(TIMING.DROPDOWN_OPEN_WAIT);

      // Find and click the option
      const options = document.querySelectorAll('.category-option');
      for (const option of options) {
        if (option.textContent?.includes(optionText)) {
          await moveToElement(option as HTMLElement, optionText);
          await clickElement(option as HTMLElement);
          setCursorLabel(`✓ ${label}: ${optionText}`);
          await wait(TIMING.PAUSE_BETWEEN_FIELDS);
          return true;
        }
      }

      // Click outside to close if option not found
      document.body.click();
      return false;
    },
    [moveToElement, clickElement, setCursorLabel, wait, shouldAbort]
  );

  /**
   * PROFILE: Open profile modal, fill fields, save
   */
  const runProfileSequence = useCallback(
    async (data: WizardData): Promise<boolean> => {
      // 1. Move to and click profile button
      setCursorLabel('פותח את התפריט...');
      if (!(await moveTo('nav-profile-btn', 'לחץ כאן לפתיחת התפריט'))) return false;

      const profileBtn = document.getElementById('nav-profile-btn');
      if (!profileBtn) return false;
      await clickElement(profileBtn);
      await wait(TIMING.MODAL_OPEN_WAIT);

      // 2. Find and click "פרטים אישיים" in dropdown
      const buttons = document.querySelectorAll('button');
      let profileItemBtn: HTMLElement | null = null;
      for (const btn of buttons) {
        if (btn.textContent?.includes('פרטים אישיים')) {
          profileItemBtn = btn as HTMLElement;
          break;
        }
      }

      if (profileItemBtn) {
        await moveToElement(profileItemBtn, 'פותח פרטים אישיים...');
        await clickElement(profileItemBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      // 3. Wait for modal
      const modal = await waitForElement('.modal-content');
      if (!modal) {
        await showSuccess('לא נמצא מודל - ממשיכים הלאה');
        return true;
      }

      // Modal is now open - show backdrop blur
      setAutopilotInModal(true);

      // Map wizard values to ProfileModal labels
      const ageLabels: Record<string, string> = {
        '18-25': '18-25 שנים',
        '26-35': '26-35 שנים',
        '36-45': '36-45 שנים',
        '46-55': '46-55 שנים',
        '56-65': '56-65 שנים',
        '65+': '65+ שנים',
      };

      const employmentLabels: Record<string, string> = {
        'employee': 'שכיר/ה',
        'self_employed': 'עצמאי/ת',
        'both': 'שכיר/ה + עצמאי/ת',
        'student': 'סטודנט',
      };

      const militaryLabels: Record<string, string> = {
        'none': 'ללא שירות צבאי',
        'reserve': 'מילואימניק/ית',
        'career': 'קבע',
      };

      // 4. Fill Age Range dropdown (index 0)
      if (data.ageRange) {
        await selectProfileDropdown(0, ageLabels[data.ageRange] || data.ageRange, 'טווח גיל');
      }

      // 5. Fill Employment Type dropdown (index 2)
      if (data.employmentType) {
        await selectProfileDropdown(2, employmentLabels[data.employmentType] || data.employmentType, 'סוג תעסוקה');
      }

      // 6. Fill Military Status dropdown (index 3)
      if (data.militaryStatus) {
        await selectProfileDropdown(3, militaryLabels[data.militaryStatus] || data.militaryStatus, 'סטטוס צבאי');
      }

      // 7. Click Save button - scroll it into view first
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const saveBtn = modal.querySelector('button[type="submit"]') as HTMLElement;
      if (saveBtn) {
        // The modal-content itself is scrollable (max-h-[90vh] overflow-y-auto)
        // Scroll the save button into view within the modal
        await scrollElementIntoViewWithinContainer(saveBtn, modal as HTMLElement);

        await moveToElement(saveBtn, 'שומר את הפרטים...');
        await clickElement(saveBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      await showSuccess('הפרטים האישיים נשמרו!');
      return true;
    },
    [moveTo, moveToElement, clickElement, selectProfileDropdown, waitForElement, showSuccess, setCursorLabel, wait, scrollElementIntoViewWithinContainer, setAutopilotInModal]
  );

  /**
   * ASSETS: Open add asset modal, fill fields, save
   */
  const runAssetsSequence = useCallback(
    async (data: WizardData): Promise<boolean> => {
      // 1. Scroll to and click Add Asset button
      await scrollToElement('btn-add-asset');
      setCursorLabel('הוספת נכס חדש');
      if (!(await moveTo('btn-add-asset', 'לחץ להוספת נכס'))) return false;

      const addBtn = document.getElementById('btn-add-asset');
      if (!addBtn) return false;
      await clickElement(addBtn);
      await wait(TIMING.MODAL_OPEN_WAIT);

      // 2. Wait for modal
      const modal = await waitForElement('.modal-content');
      if (!modal) {
        await showSuccess('לא נמצא מודל - ממשיכים הלאה');
        return true;
      }

      // Modal is now open - show backdrop blur
      setAutopilotInModal(true);

      // 3. Fill Asset Name (use user input from wizard)
      const nameInput = modal.querySelector('input[type="text"]') as HTMLInputElement;
      if (nameInput) {
        const assetName = data.assetName || 'נכס חדש';
        await typeInInput(nameInput, assetName, 'שם הנכס');
      }

      // 4. Select Asset Category using CategorySelect
      const categoryTrigger = modal.querySelector('.category-select-trigger') as HTMLElement;
      if (categoryTrigger && data.assetCategory) {
        // Map wizard values to CategorySelect labels
        const categoryLabels: Record<string, string> = {
          'cash': 'מזומן',
          'savings': 'חסכונות',
          'investments': 'השקעות',
          'pension': 'פנסיה',
          'keren_hishtalmut': 'קרן השתלמות',
          'real_estate': 'נדל"ן',
          'vehicle': 'רכב',
          'other': 'אחר',
        };
        const categoryLabel = categoryLabels[data.assetCategory] || data.assetCategory;

        await moveToElement(categoryTrigger, `בוחר סוג: ${categoryLabel}...`);
        await clickElement(categoryTrigger);
        await wait(TIMING.DROPDOWN_OPEN_WAIT);

        // Find the dropdown container (rendered via portal, has overflow-y-auto)
        const dropdownContainer = document.querySelector('.fixed.overflow-y-auto[dir="rtl"]') as HTMLElement;

        // Find and click the matching option
        const options = document.querySelectorAll('.category-option');
        for (const option of options) {
          if (option.textContent?.includes(categoryLabel)) {
            // Scroll the option into view within the dropdown container
            if (dropdownContainer) {
              const optionEl = option as HTMLElement;
              const optionRect = optionEl.getBoundingClientRect();
              const containerRect = dropdownContainer.getBoundingClientRect();

              // Check if option is outside visible area of dropdown
              if (optionRect.bottom > containerRect.bottom || optionRect.top < containerRect.top) {
                // Scroll the option into view within the dropdown
                const scrollTop = optionEl.offsetTop - dropdownContainer.offsetTop - 50;
                dropdownContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
                await wait(300);
              }
            }

            await moveToElement(option as HTMLElement, categoryLabel);
            await clickElement(option as HTMLElement);
            setCursorLabel(`✓ סוג: ${categoryLabel}`);
            await wait(TIMING.PAUSE_BETWEEN_FIELDS);
            break;
          }
        }
      }

      // 5. Fill Value (use assetValue from wizard)
      const valueInput = modal.querySelector('input[type="number"]') as HTMLInputElement;
      if (valueInput && data.assetValue) {
        // Clean the value (remove commas)
        const cleanValue = data.assetValue.replace(/,/g, '');
        await typeInInput(valueInput, cleanValue, 'שווי הנכס');
      }

      // 6. Click Save button - scroll it into view first
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const saveBtn = modal.querySelector('button[type="submit"]') as HTMLElement;
      if (saveBtn) {
        await scrollElementIntoViewWithinContainer(saveBtn, modal as HTMLElement);
        await moveToElement(saveBtn, 'שומר את הנכס...');
        await clickElement(saveBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      await showSuccess('הנכס נוסף בהצלחה!');
      return true;
    },
    [moveTo, scrollToElement, clickElement, typeInInput, moveToElement, waitForElement, showSuccess, setCursorLabel, wait, scrollElementIntoViewWithinContainer, setAutopilotInModal]
  );

  /**
   * LIABILITIES: Open liability modal, fill mortgage/loan data, calculate, save
   */
  const runLiabilitiesSequence = useCallback(
    async (data: WizardData): Promise<boolean> => {
      // Check if user has any liabilities
      const liabilityType = data.liabilityType;

      if (!liabilityType || liabilityType === 'none') {
        // Just show the net worth card if no liabilities
        setCursorLabel('מציג את השווי הנקי');
        if (!(await moveTo('card-net-worth', 'כרטיס השווי הנקי'))) return false;
        await wait(1200);
        setCursorLabel('💡 אין לך התחייבויות - מצוין!');
        await wait(1500);
        await showSuccess('סיימנו עם ההתחייבויות!');
        return true;
      }

      // 1. Scroll to and click Add Liability button
      await scrollToElement('btn-add-liability');
      setCursorLabel('הוספת התחייבות חדשה');
      if (!(await moveTo('btn-add-liability', 'לחץ להוספת התחייבות'))) {
        // Fallback to net worth card if button not found
        if (!(await moveTo('card-net-worth', 'כרטיס השווי הנקי'))) return false;
        setCursorLabel(`💡 התחייבות של ${data.liabilityAmount || '---'}₪`);
        await wait(2000);
        await showSuccess('סיימנו עם ההתחייבויות!');
        return true;
      }

      const addBtn = document.getElementById('btn-add-liability');
      if (!addBtn) return false;
      await clickElement(addBtn);
      await wait(TIMING.MODAL_OPEN_WAIT);

      // 2. Wait for modal
      const modal = await waitForElement('.modal-content');
      if (!modal) {
        await showSuccess('לא נמצא מודל - ממשיכים הלאה');
        return true;
      }

      // Modal is now open - show backdrop blur
      setAutopilotInModal(true);

      // Determine liability details
      const isMortgage = liabilityType === 'mortgage';
      const liabilityName = isMortgage ? 'משכנתא' : 'הלוואה';

      // 3. Fill Name
      const nameInput = modal.querySelector('input[type="text"]') as HTMLInputElement;
      if (nameInput) {
        await typeInInput(nameInput, liabilityName, 'שם ההתחייבות');
      }

      // 4. Select liability type using CategorySelect
      const categoryTrigger = modal.querySelector('.category-select-trigger') as HTMLElement;
      if (categoryTrigger) {
        await moveToElement(categoryTrigger, `בוחר סוג: ${liabilityName}...`);
        await clickElement(categoryTrigger);
        await wait(TIMING.DROPDOWN_OPEN_WAIT);

        // Find the dropdown container (rendered via portal)
        const dropdownContainer = document.querySelector('.fixed.overflow-y-auto[dir="rtl"]') as HTMLElement;

        // Find and click the appropriate option
        const options = document.querySelectorAll('.category-option');
        for (const option of options) {
          const optionText = option.textContent || '';
          if (optionText.includes(liabilityName)) {
            // Scroll option into view if needed
            if (dropdownContainer) {
              const optionEl = option as HTMLElement;
              const optionRect = optionEl.getBoundingClientRect();
              const containerRect = dropdownContainer.getBoundingClientRect();
              if (optionRect.bottom > containerRect.bottom || optionRect.top < containerRect.top) {
                const scrollTop = optionEl.offsetTop - dropdownContainer.offsetTop - 50;
                dropdownContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
                await wait(300);
              }
            }
            await moveToElement(option as HTMLElement, liabilityName);
            await clickElement(option as HTMLElement);
            setCursorLabel(`✓ סוג: ${liabilityName}`);
            await wait(TIMING.PAUSE_BETWEEN_FIELDS);
            break;
          }
        }
      }

      // 5. Fill Total Amount
      const numberInputs = modal.querySelectorAll('input[type="number"]');
      if (numberInputs.length > 0 && data.liabilityAmount) {
        const amountInput = numberInputs[0] as HTMLInputElement;
        const cleanValue = data.liabilityAmount.replace(/,/g, '');
        await typeInInput(amountInput, cleanValue, 'סכום ההתחייבות');
      }

      // 6. Fill Interest Rate
      if (numberInputs.length > 1 && data.liabilityInterest) {
        const interestInput = numberInputs[1] as HTMLInputElement;
        await typeInInput(interestInput, data.liabilityInterest, 'ריבית');
      }

      // 7. Fill Term (months)
      if (numberInputs.length > 2 && data.liabilityTerm) {
        const termInput = numberInputs[2] as HTMLInputElement;
        await typeInInput(termInput, data.liabilityTerm, 'תקופה');
      }

      // 8. Click Calculate button to compute monthly payment
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const buttons = modal.querySelectorAll('button[type="button"]');
      let calculateBtn: HTMLElement | null = null;
      for (const btn of buttons) {
        if (btn.textContent?.includes('חשב')) {
          calculateBtn = btn as HTMLElement;
          break;
        }
      }
      if (calculateBtn) {
        await scrollElementIntoViewWithinContainer(calculateBtn, modal as HTMLElement);
        await moveToElement(calculateBtn, 'מחשב תשלום חודשי...');
        await clickElement(calculateBtn);
        setCursorLabel('✓ התשלום החודשי חושב');
        await wait(TIMING.PAUSE_BETWEEN_FIELDS);
      }

      // 9. Click Save button - scroll it into view first
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const saveBtn = modal.querySelector('button[type="submit"]') as HTMLElement;
      if (saveBtn) {
        await scrollElementIntoViewWithinContainer(saveBtn, modal as HTMLElement);
        await moveToElement(saveBtn, 'שומר את ההתחייבות...');
        await clickElement(saveBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      await showSuccess('ההתחייבות נוספה בהצלחה!');
      return true;
    },
    [moveTo, scrollToElement, clickElement, typeInInput, moveToElement, waitForElement, showSuccess, setCursorLabel, wait, scrollElementIntoViewWithinContainer, setAutopilotInModal]
  );

  /**
   * INCOME: Open recurring transaction modal, fill income data, save
   */
  const runIncomeSequence = useCallback(
    async (data: WizardData): Promise<boolean> => {
      // 1. Scroll to and click Add Recurring button
      await scrollToElement('btn-add-recurring');
      setCursorLabel('הוספת הכנסה קבועה');
      if (!(await moveTo('btn-add-recurring', 'לחץ להוספת עסקה קבועה'))) {
        // Fallback to cash flow card
        if (!(await moveTo('card-cash-flow', 'כרטיס התזרים'))) return false;
        if (data.incomeAmount) {
          setCursorLabel(`💰 הכנסה חודשית: ${data.incomeAmount}₪`);
          await wait(2000);
        }
        await showSuccess('סיימנו עם העסקאות הקבועות!');
        return true;
      }

      const addBtn = document.getElementById('btn-add-recurring');
      if (!addBtn) return false;
      await clickElement(addBtn);
      await wait(TIMING.MODAL_OPEN_WAIT);

      // 2. Wait for modal
      const modal = await waitForElement('.modal-content');
      if (!modal) {
        await showSuccess('לא נמצא מודל - ממשיכים הלאה');
        return true;
      }

      // Modal is now open - show backdrop blur
      setAutopilotInModal(true);

      // 3. Click Income type button (second button in the type toggle)
      const typeButtons = modal.querySelectorAll('.grid.grid-cols-2 button');
      const incomeBtn = typeButtons[1] as HTMLElement; // Income is second button
      if (incomeBtn) {
        await moveToElement(incomeBtn, 'בוחר סוג: הכנסה');
        await clickElement(incomeBtn);
        await wait(TIMING.PAUSE_BETWEEN_FIELDS);
      }

      // 4. Fill Name
      const nameInput = modal.querySelector('input[type="text"]') as HTMLInputElement;
      if (nameInput && data.incomeName) {
        await typeInInput(nameInput, data.incomeName, 'שם ההכנסה');
      }

      // 5. Fill Amount
      const amountInput = modal.querySelector('input[type="number"]') as HTMLInputElement;
      if (amountInput && data.incomeAmount) {
        const cleanValue = data.incomeAmount.replace(/,/g, '');
        await typeInInput(amountInput, cleanValue, 'סכום ההכנסה');
      }

      // 6. Select category using CategorySelect
      const categoryTrigger = modal.querySelector('.category-select-trigger') as HTMLElement;
      if (categoryTrigger && data.incomeCategory) {
        // Map wizard values to category labels
        const categoryLabels: Record<string, string> = {
          'salary': 'משכורת',
          'freelance': 'פרילנס',
          'rental': 'שכירות',
          'pension': 'קצבה',
          'other': 'אחר',
        };
        const categoryLabel = categoryLabels[data.incomeCategory] || data.incomeCategory;

        await moveToElement(categoryTrigger, `בוחר קטגוריה: ${categoryLabel}...`);
        await clickElement(categoryTrigger);
        await wait(TIMING.DROPDOWN_OPEN_WAIT);

        // Find the dropdown container
        const dropdownContainer = document.querySelector('.fixed.overflow-y-auto[dir="rtl"]') as HTMLElement;

        // Find and click the matching option
        const options = document.querySelectorAll('.category-option');
        for (const option of options) {
          if (option.textContent?.includes(categoryLabel)) {
            // Scroll option into view if needed
            if (dropdownContainer) {
              const optionEl = option as HTMLElement;
              const optionRect = optionEl.getBoundingClientRect();
              const containerRect = dropdownContainer.getBoundingClientRect();
              if (optionRect.bottom > containerRect.bottom || optionRect.top < containerRect.top) {
                const scrollTop = optionEl.offsetTop - dropdownContainer.offsetTop - 50;
                dropdownContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
                await wait(300);
              }
            }
            await moveToElement(option as HTMLElement, categoryLabel);
            await clickElement(option as HTMLElement);
            setCursorLabel(`✓ קטגוריה: ${categoryLabel}`);
            await wait(TIMING.PAUSE_BETWEEN_FIELDS);
            break;
          }
        }
      }

      // 7. Click Save button
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const saveBtn = modal.querySelector('button[type="submit"]') as HTMLElement;
      if (saveBtn) {
        await scrollElementIntoViewWithinContainer(saveBtn, modal as HTMLElement);
        await moveToElement(saveBtn, 'שומר את ההכנסה הקבועה...');
        await clickElement(saveBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      await showSuccess('ההכנסה הקבועה נוספה בהצלחה!');
      return true;
    },
    [moveTo, scrollToElement, clickElement, typeInInput, moveToElement, waitForElement, showSuccess, setCursorLabel, wait, scrollElementIntoViewWithinContainer, setAutopilotInModal]
  );

  /**
   * EXPENSES: Open transaction modal, fill expense data, save
   */
  const runExpensesSequence = useCallback(
    async (data: WizardData): Promise<boolean> => {
      // Check if we have expense data
      if (!data.expenseName || !data.expenseAmount) {
        // Just show the transaction area if no expense data
        await scrollToElement('btn-global-add');
        setCursorLabel('הוספת עסקאות');
        if (!(await moveTo('btn-global-add', 'כאן מוסיפים עסקאות'))) return false;
        await wait(1200);
        setCursorLabel('💡 תוכל להוסיף עסקאות ידנית או לייבא מקובץ');
        await wait(2000);
        await showSuccess('מעולה! עכשיו נראה לך עוד כלים שימושיים');
        return true;
      }

      // 1. Scroll to and click Add Transaction button
      await scrollToElement('btn-global-add');
      setCursorLabel('הוספת הוצאה חדשה');
      if (!(await moveTo('btn-global-add', 'לחץ להוספת עסקה'))) return false;

      const addBtn = document.getElementById('btn-global-add');
      if (!addBtn) return false;
      await clickElement(addBtn);
      await wait(TIMING.MODAL_OPEN_WAIT);

      // 2. Wait for modal
      const modal = await waitForElement('.modal-content');
      if (!modal) {
        await showSuccess('לא נמצא מודל - ממשיכים הלאה');
        return true;
      }

      // Modal is now open - show backdrop blur
      setAutopilotInModal(true);

      // 3. Expense type is already selected by default, just confirm it
      const typeButtons = modal.querySelectorAll('.grid.grid-cols-2 button');
      const expenseBtn = typeButtons[0] as HTMLElement; // Expense is first button
      if (expenseBtn) {
        await moveToElement(expenseBtn, 'סוג: הוצאה');
        await clickElement(expenseBtn);
        await wait(TIMING.PAUSE_BETWEEN_FIELDS);
      }

      // 4. Fill Amount
      const amountInput = modal.querySelector('input[type="number"]') as HTMLInputElement;
      if (amountInput && data.expenseAmount) {
        const cleanValue = data.expenseAmount.replace(/,/g, '');
        await typeInInput(amountInput, cleanValue, 'סכום ההוצאה');
      }

      // 5. Select category using CategorySelect
      const categoryTrigger = modal.querySelector('.category-select-trigger') as HTMLElement;
      if (categoryTrigger && data.expenseCategory) {
        // Map wizard values to category labels
        const categoryLabels: Record<string, string> = {
          'groceries': 'מזון',
          'dining': 'מסעדות',
          'transport': 'תחבורה',
          'entertainment': 'בילויים',
          'shopping': 'קניות',
          'health': 'בריאות',
          'other': 'אחר',
        };
        const categoryLabel = categoryLabels[data.expenseCategory] || data.expenseCategory;

        await moveToElement(categoryTrigger, `בוחר קטגוריה: ${categoryLabel}...`);
        await clickElement(categoryTrigger);
        await wait(TIMING.DROPDOWN_OPEN_WAIT);

        // Find the dropdown container
        const dropdownContainer = document.querySelector('.fixed.overflow-y-auto[dir="rtl"]') as HTMLElement;

        // Find and click the matching option
        const options = document.querySelectorAll('.category-option');
        let foundOption = false;
        for (const option of options) {
          const text = option.textContent || '';
          if (text.includes(categoryLabel)) {
            // Scroll option into view if needed
            if (dropdownContainer) {
              const optionEl = option as HTMLElement;
              const optionRect = optionEl.getBoundingClientRect();
              const containerRect = dropdownContainer.getBoundingClientRect();
              if (optionRect.bottom > containerRect.bottom || optionRect.top < containerRect.top) {
                const scrollTop = optionEl.offsetTop - dropdownContainer.offsetTop - 50;
                dropdownContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
                await wait(300);
              }
            }
            await moveToElement(option as HTMLElement, text.trim());
            await clickElement(option as HTMLElement);
            setCursorLabel(`✓ קטגוריה: ${text.trim()}`);
            await wait(TIMING.PAUSE_BETWEEN_FIELDS);
            foundOption = true;
            break;
          }
        }
        // If no match, click first available option
        if (!foundOption && options.length > 0) {
          const firstOption = options[0] as HTMLElement;
          await moveToElement(firstOption, firstOption.textContent || '');
          await clickElement(firstOption);
        }
      }

      // 6. Fill Description/Name - scroll into view and fill
      await wait(400); // Wait for category dropdown to fully close
      const descInput = modal.querySelector('input[type="text"][placeholder="תיאור העסקה"]') as HTMLInputElement;
      if (descInput && data.expenseName) {
        // Scroll the description field into view
        descInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(400);
        await typeInInput(descInput, data.expenseName, 'תיאור ההוצאה');
      }

      // 7. Click Save button
      await wait(TIMING.PAUSE_BEFORE_SAVE);
      const saveBtn = modal.querySelector('button[type="submit"]') as HTMLElement;
      if (saveBtn) {
        await scrollElementIntoViewWithinContainer(saveBtn, modal as HTMLElement);
        await moveToElement(saveBtn, 'שומר את ההוצאה...');
        await clickElement(saveBtn);
        await wait(TIMING.MODAL_OPEN_WAIT);
      }

      await showSuccess('ההוצאה נוספה בהצלחה!');
      return true;
    },
    [moveTo, scrollToElement, clickElement, typeInInput, moveToElement, waitForElement, showSuccess, setCursorLabel, wait, scrollElementIntoViewWithinContainer, setAutopilotInModal]
  );

  // ============================================
  // Feature Demo Sequences
  // ============================================

  /**
   * RECOMMENDATIONS: Demonstrate the AI recommendations feature
   */
  const runRecommendationsDemo = useCallback(
    async (): Promise<boolean> => {
      // 1. Scroll to recommendations button in asset allocation chart
      await scrollToElement('btn-get-recommendations');
      setCursorLabel('המלצות מותאמות אישית');
      if (!(await moveTo('btn-get-recommendations', 'לחץ לקבלת המלצות'))) {
        setCursorLabel('💡 כפתור ההמלצות נמצא בכרטיס פילוח הנכסים');
        await wait(2000);
        return true;
      }

      const recBtn = document.getElementById('btn-get-recommendations');
      if (!recBtn) return false;

      await wait(TIMING.PAUSE_BEFORE_CLICK);
      await simulateClick();
      setCursorLabel('✨ פותח את מודל ההמלצות...');
      recBtn.click();
      await wait(TIMING.MODAL_OPEN_WAIT);

      // Wait for AI chat modal to appear
      const chatModal = await waitForElement('[class*="AIChatModal"], .ai-chat-modal, .modal-content');
      if (chatModal) {
        // Modal is now open - show backdrop blur
        setAutopilotInModal(true);

        // Move cursor to the recommendations area
        const recArea = chatModal.querySelector('.prose, .markdown, [class*="message"]') as HTMLElement;
        if (recArea) {
          await moveToElement(recArea, 'קבל המלצות מפורטות על סמך הנתונים האישיים שלך');
          await wait(3000);
        } else {
          setCursorLabel('💡 קבל המלצות מפורטות על סמך הנתונים האישיים שלך');
          await wait(3000);
        }

        // Close the modal
        const closeBtn = chatModal.querySelector('button[aria-label="Close"], button:has(.lucide-x), [class*="close"]') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
        } else {
          // Try clicking outside to close
          document.body.click();
        }
        await wait(500);
      }

      await showSuccess('המלצות חכמות מבוססות על הנתונים שלך!');

      // Re-open onboarding wizard to features step
      await wait(600);
      setCurrentStepIndex(5); // features is the 6th step (index 5)
      openWizard();

      return true;
    },
    [moveTo, moveToElement, scrollToElement, simulateClick, waitForElement, showSuccess, setCursorLabel, wait, openWizard, setCurrentStepIndex, setAutopilotInModal]
  );

  /**
   * AI ASSISTANT: Demonstrate the AI chat feature
   */
  const runAIAssistantDemo = useCallback(
    async (): Promise<boolean> => {
      // 1. Scroll to and click AI help button next to assets
      await scrollToElement('btn-ai-help-assets');
      setCursorLabel('כפתור עזרה AI');
      if (!(await moveTo('btn-ai-help-assets', 'לחץ לפתיחת העוזר'))) {
        setCursorLabel('💡 כפתור עזרת ה-AI נמצא ליד כותרת הנכסים');
        await wait(2000);
        return true;
      }

      // Explain that this button appears everywhere
      setCursorLabel('💡 כפתור זה מופיע בכל מקום במערכת - לחץ עליו לקבלת עזרה');
      await wait(2500);

      const aiBtn = document.getElementById('btn-ai-help-assets');
      if (!aiBtn) return false;

      await wait(TIMING.PAUSE_BEFORE_CLICK);
      await simulateClick();
      setCursorLabel('✨ פותח את עוזר ה-AI...');
      aiBtn.click();
      await wait(TIMING.MODAL_OPEN_WAIT + 300);

      // Wait for AI chat modal - look for the modal with z-[10002]
      const chatModal = await waitForElement('.animate-scale-in, [class*="z-[10002]"]');
      if (chatModal) {
        // Modal is now open - show backdrop blur
        setAutopilotInModal(true);

        setCursorLabel('💬 שואל שאלה על הנכסים...');
        await wait(800);

        // Find the chat input - it's an input with placeholder
        const chatInput = chatModal.querySelector('input[placeholder="שאל שאלה..."]') as HTMLInputElement;
        if (chatInput) {
          const sampleQuestion = 'איך כדאי לפזר את הנכסים שלי?';

          // Focus on the input first
          await moveToElement(chatInput, 'מקליד שאלה...');
          await simulateClick();
          chatInput.focus();
          await wait(300);

          // Type the question using native value setter
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            // Type character by character
            let currentValue = '';
            for (let i = 0; i < sampleQuestion.length; i++) {
              if (shouldAbort()) return false;
              currentValue += sampleQuestion[i];
              nativeInputValueSetter.call(chatInput, currentValue);
              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
              await wait(TIMING.TYPING_CHAR_DELAY);
            }
            chatInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          setCursorLabel('✓ ' + sampleQuestion);
          await wait(600);

          // Find and click the send button - it's the button[type="submit"] in the form
          const sendBtn = chatModal.querySelector('form button[type="submit"]') as HTMLElement;
          if (sendBtn) {
            await moveToElement(sendBtn, 'שולח שאלה...');
            await wait(TIMING.PAUSE_BEFORE_CLICK);
            await simulateClick();
            sendBtn.click();
            await wait(500);
          }

          // Wait for response - look for the loading indicator to disappear and messages to appear
          setCursorLabel('⏳ ממתין לתשובה...');
          let responseReceived = false;
          const startTime = Date.now();
          const timeout = 20000; // 20 seconds max wait

          while (!responseReceived && Date.now() - startTime < timeout) {
            await wait(500);
            // Check for AI response - look for messages with bg-slate-100 (assistant message)
            const assistantMessages = chatModal.querySelectorAll('.bg-slate-100');
            const loadingIndicator = chatModal.querySelector('.animate-bounce');

            // We have a response when there's an assistant message and no loading indicator
            if (assistantMessages.length > 0 && !loadingIndicator) {
              // Also check if the typing animation is done (no animate-pulse cursor)
              const typingCursor = chatModal.querySelector('.animate-pulse');
              if (!typingCursor) {
                responseReceived = true;
              }
            }
          }

          if (responseReceived) {
            setCursorLabel('✅ קיבלנו תשובה!');
            await wait(2500);
          } else {
            setCursorLabel('💡 התשובה בדרך...');
            await wait(1500);
          }
        }

        // Close the modal - find the close button in the header (it's the button with X icon)
        const headerCloseBtn = chatModal.querySelector('.bg-gradient-to-r button') as HTMLElement;
        if (headerCloseBtn) {
          await moveToElement(headerCloseBtn, 'סוגר את החלון');
          await wait(TIMING.PAUSE_BEFORE_CLICK);
          await simulateClick();
          headerCloseBtn.click();
          await wait(500);
        } else {
          // Fallback - click the backdrop
          const backdrop = document.querySelector('.bg-black\\/50');
          if (backdrop) {
            (backdrop as HTMLElement).click();
          }
          await wait(500);
        }
      }

      await showSuccess('עוזר AI מותאם למצבך הפיננסי!');
      await wait(800);

      // Re-open onboarding wizard to features step
      clearCursor();
      await wait(400);
      setCurrentStepIndex(5); // features is the 6th step (index 5)
      openWizard();

      return true;
    },
    [moveTo, moveToElement, scrollToElement, simulateClick, waitForElement, showSuccess, setCursorLabel, wait, shouldAbort, openWizard, setCurrentStepIndex, clearCursor, setAutopilotInModal]
  );

  /**
   * IMPORT: Demonstrate the import transactions feature
   */
  const runImportDemo = useCallback(
    async (): Promise<boolean> => {
      // 1. Scroll to import button
      await scrollToElement('btn-import-transactions');
      setCursorLabel('ייבוא עסקאות');
      if (!(await moveTo('btn-import-transactions', 'לחץ לייבוא עסקאות'))) {
        setCursorLabel('💡 כפתור הייבוא נמצא בכרטיס העסקאות האחרונות');
        await wait(2000);
        return true;
      }

      const importBtn = document.getElementById('btn-import-transactions');
      if (!importBtn) return false;

      await wait(TIMING.PAUSE_BEFORE_CLICK);
      await simulateClick();
      setCursorLabel('✨ פותח את מודל הייבוא...');
      importBtn.click();
      await wait(TIMING.MODAL_OPEN_WAIT);

      // Wait for import modal
      const importModal = await waitForElement('.modal-content');
      if (importModal) {
        // Modal is now open - show backdrop blur
        setAutopilotInModal(true);

        setCursorLabel('📂 כאן תוכל לייבא קובץ אקסל או CSV');
        await wait(2000);
        setCursorLabel('💡 המערכת תזהה אוטומטית את העמודות');
        await wait(2000);

        // Close the modal
        const closeBtn = importModal.querySelector('button[aria-label="Close"], button:has(.lucide-x), [class*="close"]') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
        } else {
          // Try clicking outside to close
          document.body.click();
        }
        await wait(500);
      }

      await showSuccess('ייבוא עסקאות בקליק אחד!');

      // Re-open onboarding wizard to features step
      await wait(600);
      setCurrentStepIndex(5); // features is the 6th step (index 5)
      openWizard();

      return true;
    },
    [moveTo, scrollToElement, simulateClick, waitForElement, showSuccess, setCursorLabel, wait, openWizard, setCurrentStepIndex, setAutopilotInModal]
  );

  /**
   * Run a feature demo by ID
   */
  const runFeatureDemo = useCallback(
    async (demoId: string): Promise<boolean> => {
      if (isRunningRef.current) {
        console.warn('[Autopilot] Already running, cannot start demo');
        return false;
      }

      isRunningRef.current = true;
      abortedRef.current = false;

      console.log(`[Autopilot] Starting feature demo: ${demoId}`);

      try {
        await wait(300);

        let success = false;
        switch (demoId) {
          case 'recommendations':
            success = await runRecommendationsDemo();
            break;
          case 'ai-assistant':
            success = await runAIAssistantDemo();
            break;
          case 'import':
            success = await runImportDemo();
            break;
          default:
            console.warn(`[Autopilot] Unknown demo: ${demoId}`);
            return false;
        }

        await wait(TIMING.SEQUENCE_END_PAUSE);
        clearCursor();
        return success;
      } catch (error) {
        console.error('[Autopilot] Demo error:', error);
        clearCursor();
        return false;
      } finally {
        isRunningRef.current = false;
      }
    },
    [wait, clearCursor, runRecommendationsDemo, runAIAssistantDemo, runImportDemo]
  );

  // ============================================
  // Main Runner
  // ============================================

  const runAutopilotSequence = useCallback(
    async (stepId: string, data: WizardData): Promise<AutopilotResult> => {
      if (isRunningRef.current) {
        return { success: false, stepId, error: 'Autopilot already running' };
      }

      isRunningRef.current = true;
      abortedRef.current = false;

      console.log(`[Autopilot] Starting: ${stepId}`, data);

      try {
        const step = getStepById(stepId);
        if (!step) throw new Error(`Unknown step: ${stepId}`);

        await wait(400);

        let success = false;
        switch (stepId) {
          case 'profile':
            success = await runProfileSequence(data);
            break;
          case 'assets':
            success = await runAssetsSequence(data);
            break;
          case 'liabilities':
            success = await runLiabilitiesSequence(data);
            break;
          case 'income':
            success = await runIncomeSequence(data);
            break;
          case 'expenses':
            success = await runExpensesSequence(data);
            break;
          default:
            success = await moveTo(step.autopilotTargetId, step.title);
        }

        await wait(TIMING.SEQUENCE_END_PAUSE);
        clearCursor();

        // Move to next step (unless last - features)
        if (success && stepId !== 'features') {
          await wait(800);
          const stepIndex = ['profile', 'assets', 'liabilities', 'income', 'expenses', 'features'].indexOf(stepId);
          if (stepIndex !== -1 && stepIndex < 5) {
            setCurrentStepIndex(stepIndex + 1);
            openWizard();
          }
        }

        return { success, stepId };
      } catch (error) {
        console.error('[Autopilot] Error:', error);
        clearCursor();
        openWizard();
        return { success: false, stepId, error: error instanceof Error ? error.message : 'Unknown error' };
      } finally {
        isRunningRef.current = false;
      }
    },
    [moveTo, clearCursor, wait, openWizard, setCurrentStepIndex, runProfileSequence, runAssetsSequence, runLiabilitiesSequence, runIncomeSequence, runExpensesSequence]
  );

  const abortAutopilot = useCallback(() => {
    abortedRef.current = true;
    isRunningRef.current = false; // Reset running state so next autopilot can start
    clearCursor();
  }, [clearCursor]);

  const isAutopilotRunning = useCallback(() => isRunningRef.current, []);

  return {
    runAutopilotSequence,
    runFeatureDemo,
    abortAutopilot,
    isAutopilotRunning,
    moveTo,
    moveToElement,
    clickElement,
    typeInInput,
    selectStyledOption,
    showSuccess,
    scrollToElement,
  };
}

export default useAutopilot;
