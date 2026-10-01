/**
 * TakaBachao - Conversational Savings Assistant Service
 * Multi-Turn Gemini AI Conversational Flow + Deterministic State Machine & Financial Arithmetic
 * 
 * Preserves multi-turn conversation context across every turn.
 * Tracks conversationId, geminiInteractionId, previousInteractionId, and structuredSavingsState.
 * Arithmetic is strictly deterministic in JavaScript; Gemini provides the contextual natural language explanation.
 */

// Server-side session store keyed by conversationId
const savingsSessions = new Map();

export const CANDIDATE_SAVINGS_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

/**
 * Normalizes Bengali numerals (০-৯) to standard digits (0-9)
 */
export function normalizeBengaliDigits(text) {
  if (!text || typeof text !== 'string') return '';
  const bnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return text.replace(/[০-৯]/g, (d) => bnMap[d] || d);
}

/**
 * Converts Bengali and English number words (e.g. "২০ হাজার", "১৫k", "দেড় লাখ", "৩০,০০০") to numeric values
 */
export function parseNumberWithWords(phrase) {
  if (!phrase) return null;
  let norm = normalizeBengaliDigits(phrase.toString().toLowerCase().trim());
  
  // Clean currency symbols & words like টাকা / taka / tk
  const cleanStr = norm.replace(/[৳$€£]|(?:taka|টাকা|tk)\b/gi, '').trim();

  // Direct number check
  const directNum = parseInt(cleanStr.replace(/,/g, ''), 10);
  if (!isNaN(directNum) && /^\d+$/.test(cleanStr.replace(/,/g, ''))) {
    return directNum;
  }

  // Bengali text words mapping
  const wordValues = {
    'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
    'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15, 'পনের': 15, 'ষোল': 16, 'সতের': 17, 'আঠার': 18, 'ঊনিশ': 19,
    'কুড়ি': 20, 'বিশ': 20, 'একুশ': 21, 'বাইশ': 22, 'তেইশ': 23, 'চব্বিশ': 24, 'পঁচিশ': 25, 'ছাব্বিশ': 26, 'সাতাশ': 27, 'আঠাশ': 28, 'উনত্রিশ': 29,
    'ত্রিশ': 30, 'চল্লিশ': 40, 'পঞ্চাশ': 50, 'ষাট': 60, 'সত্তর': 70, 'আশি': 80, 'নব্বই': 90, 'একশো': 100, 'দেড়': 1.5, 'আড়াই': 2.5
  };

  // Match: "<number or word> হাজার" or "<number>k"
  const hazarMatch = norm.match(/(?:^|[^\d\w])(\d+|[^\s\d]+)\s*(?:হাজার|k|hazar)(?!\w)/i);
  if (hazarMatch && hazarMatch[1]) {
    const rawMultiplier = hazarMatch[1].trim();
    const base = wordValues[rawMultiplier] !== undefined ? wordValues[rawMultiplier] : parseFloat(rawMultiplier);
    if (!isNaN(base)) return Math.round(base * 1000);
  }

  // Match: "<number or word> লাখ" or "<number> lakh"
  const lakhMatch = norm.match(/(?:^|[^\d\w])(\d+(?:\.\d+)?|[^\s\d]+)\s*(?:লাখ|lakh|lac)(?!\w)/i);
  if (lakhMatch && lakhMatch[1]) {
    const rawMultiplier = lakhMatch[1].trim();
    if (rawMultiplier === 'দেড়' || rawMultiplier === 'দের') return 150000;
    const base = wordValues[rawMultiplier] !== undefined ? wordValues[rawMultiplier] : parseFloat(rawMultiplier);
    if (!isNaN(base)) return Math.round(base * 100000);
  }

  // Standalone word matching
  for (const [w, val] of Object.entries(wordValues)) {
    if (norm === w) return val;
  }

  // Search for any raw digit sequence (strip commas)
  const digitsMatch = cleanStr.match(/\d[\d,]*/);
  if (digitsMatch) {
    const parsed = parseInt(digitsMatch[0].replace(/,/g, ''), 10);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Retrieve or initialize persistent session state
 */
export function getOrCreateSavingsSession(conversationId) {
  const id = conversationId && conversationId.trim() ? conversationId.trim() : `savings-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  if (!savingsSessions.has(id)) {
    savingsSessions.set(id, {
      conversationId: id,
      geminiInteractionId: `interaction_${Date.now()}_init`,
      previousInteractionId: null,
      history: [], // Multi-turn chat history [{ role: 'user'|'model', parts: [{ text }] }]
      savingsState: {
        income: null,
        expenses: null,
        currentSavings: null,
        commitments: null,
        monthlySavingsGoal: null,
        targetAmount: null,
        targetDate: null,
        goalName: null
      },
      lastAskedField: null,
      preferredLang: 'bn',
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    });
  }
  const session = savingsSessions.get(id);
  session.lastActiveAt = Date.now();
  return session;
}

/**
 * Reset a session
 */
export function resetSavingsSession(conversationId) {
  if (conversationId && savingsSessions.has(conversationId)) {
    savingsSessions.delete(conversationId);
  }
}

/**
 * DETERMINISTIC FINANCIAL CALCULATOR
 * Zero LLM hallucination for arithmetic.
 * Formulas:
 *   availableMonthlyAmount = income - expenses - commitments
 *   savingsRatio = monthlySavingsGoal / income
 *   remainingGoal = targetAmount - currentSavings
 *   requiredMonthlySaving = remainingGoal / monthsRemaining
 *   estimatedMonths = remainingGoal / plannedMonthlySaving
 */
export function calculateFinancialPlan(savingsState = {}) {
  const income = Math.max(0, Number(savingsState.income) || 0);
  const expenses = Math.max(0, Number(savingsState.expenses) || 0);
  const commitments = Math.max(0, Number(savingsState.commitments) || 0);
  const currentSavings = Math.max(0, Number(savingsState.currentSavings) || 0);
  const targetAmount = savingsState.targetAmount ? Math.max(0, Number(savingsState.targetAmount)) : null;
  const targetDurationMonths = savingsState.targetDurationMonths ? Math.max(1, Number(savingsState.targetDurationMonths)) : null;
  const monthsRemaining = targetDurationMonths;
  let monthlySavingsGoal = savingsState.monthlySavingsGoal ? Math.max(0, Number(savingsState.monthlySavingsGoal)) : null;

  // 1. availableMonthlyAmount = income - expenses - commitments
  const availableMonthlyAmount = Math.max(0, income - expenses - commitments);

  let remainingGoal = null;
  let requiredMonthlySaving = null;
  let estimatedMonths = null;

  // 2. remainingGoal = targetAmount - currentSavings
  if (targetAmount !== null) {
    remainingGoal = Math.max(0, targetAmount - currentSavings);
    // 3. requiredMonthlySaving = remainingGoal / monthsRemaining
    if (monthsRemaining !== null && monthsRemaining > 0) {
      requiredMonthlySaving = Math.ceil(remainingGoal / monthsRemaining);
      if (!monthlySavingsGoal) {
        monthlySavingsGoal = requiredMonthlySaving;
      }
    }
  }

  const plannedMonthlySaving = monthlySavingsGoal || requiredMonthlySaving || 0;

  // 4. estimatedMonths = remainingGoal / plannedMonthlySaving
  if (plannedMonthlySaving > 0 && remainingGoal !== null) {
    estimatedMonths = Math.ceil(remainingGoal / plannedMonthlySaving);
  }

  // 5. savingsRatio = monthlySavingsGoal / income
  const savingsRatio = income > 0 ? Number((plannedMonthlySaving / income).toFixed(4)) : 0;
  const savingsRate = income > 0 ? Number(((plannedMonthlySaving / income) * 100).toFixed(1)) : 0;
  const isFeasible = plannedMonthlySaving > 0 && plannedMonthlySaving <= availableMonthlyAmount;
  const deficit = Math.max(0, plannedMonthlySaving - availableMonthlyAmount);

  // Projected completion date
  let projectedCompletionDate = null;
  const monthsToUse = estimatedMonths || monthsRemaining;
  if (monthsToUse && monthsToUse > 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToUse);
    projectedCompletionDate = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Realistic trade-off options if goal is aggressive (deficit > 0)
  const tradeOffOptions = [];
  if (deficit > 0) {
    if (availableMonthlyAmount > 0) {
      const opt1Months = remainingGoal ? Math.ceil(remainingGoal / availableMonthlyAmount) : null;
      tradeOffOptions.push({
        type: 'save_available',
        title: 'Save within current surplus',
        description: `Save around ৳${availableMonthlyAmount.toLocaleString()}/month${opt1Months ? ` (reaches goal in ~${opt1Months} months)` : ''}.`
      });
    }

    tradeOffOptions.push({
      type: 'reduce_expenses',
      title: 'Trim discretionary expenses',
      description: `Reduce monthly expenses by approximately ৳${deficit.toLocaleString()} to meet your ৳${plannedMonthlySaving.toLocaleString()}/mo target.`
    });

    if (monthsRemaining && remainingGoal && availableMonthlyAmount > 0) {
      const extendedMonths = Math.ceil(remainingGoal / availableMonthlyAmount);
      const extraMonths = Math.max(1, extendedMonths - monthsRemaining);
      tradeOffOptions.push({
        type: 'extend_timeline',
        title: 'Extend target timeline',
        description: `Extend your timeline by around ${extraMonths} month${extraMonths > 1 ? 's' : ''} to lower the required monthly deposit.`
      });
    }
  }

  // Completeness check
  const hasIncome = income > 0;
  const hasExpenses = savingsState.expenses !== null && savingsState.expenses !== undefined && savingsState.expenses >= 0;
  const hasCommitments = savingsState.commitments !== null && savingsState.commitments !== undefined && savingsState.commitments >= 0;
  const hasSavingsGoal = plannedMonthlySaving > 0 || (targetAmount > 0 && monthsRemaining > 0);
  const isComplete = Boolean(hasIncome && hasExpenses && hasCommitments && hasSavingsGoal);

  return {
    income,
    expenses,
    commitments,
    currentSavings,
    targetAmount,
    targetDurationMonths,
    monthsRemaining,
    monthlySavingsGoal: plannedMonthlySaving,
    availableMonthlyAmount,
    remainingGoal,
    requiredMonthlySaving,
    estimatedMonths,
    savingsRatio,
    savingsRate,
    isFeasible,
    deficit,
    projectedCompletionDate,
    tradeOffOptions,
    isComplete,
    goalName: savingsState.goalName || 'General Savings'
  };
}

/**
 * Determine the next missing required field in priority order:
 * 1. monthlySavingsGoal
 * 2. income
 * 3. expenses
 * 4. commitments
 */
export function getNextMissingField(savingsState = {}) {
  // 1. Savings Goal
  const hasGoal = (savingsState.monthlySavingsGoal !== null && savingsState.monthlySavingsGoal !== undefined && savingsState.monthlySavingsGoal > 0) ||
                  (savingsState.targetAmount !== null && savingsState.targetAmount !== undefined && savingsState.targetAmount > 0);
  if (!hasGoal) {
    return 'monthlySavingsGoal';
  }

  // 2. Income
  if (savingsState.income === null || savingsState.income === undefined || savingsState.income <= 0) {
    return 'income';
  }

  // 3. Expenses
  if (savingsState.expenses === null || savingsState.expenses === undefined) {
    return 'expenses';
  }

  // 4. Commitments
  if (savingsState.commitments === null || savingsState.commitments === undefined) {
    return 'commitments';
  }

  return null; // All required fields collected!
}

/**
 * Context-aware NLP & Rule-based extraction engine
 */
export function extractFinancialData(text, currentState = {}) {
  const rawText = text.toString();
  const norm = normalizeBengaliDigits(rawText.toLowerCase().trim());
  const extracted = {};

  // Check for What-if questions (e.g. "What if I save 6000?", "যদি ৬০০০ save করি?")
  const whatIfMatch = norm.match(/(?:what\s*if\s*i\s*save|if\s*i\s*save|যদি\s*(?:আমি\s*)?)(\d+|[^\s\d]+)\s*(?:হাজার|k|save)?/i) ||
                      norm.match(/(?:save|সঞ্চয়|জমাতে)\s*(\d+|[^\s\d]+)\s*(?:হাজার|k)?\s*(?:\?|করলে|হলে)/i);
  if (whatIfMatch && whatIfMatch[1]) {
    const parsedWhatIf = parseNumberWithWords(whatIfMatch[1]);
    if (parsedWhatIf !== null && parsedWhatIf > 0) {
      extracted.monthlySavingsGoal = parsedWhatIf;
      extracted.isWhatIf = true;
    }
  }

  // Check for Negation / Zero for Commitments
  // e.g. "আমার কোনো EMI নেই", "ঋণ নেই", "না", "নেই", "no emi", "none", "0", "zero"
  const isNegation = /^(?:না|নেই|নাই|no|none|0|zero|nothing|na|nei|nai)$/i.test(norm) ||
                     /(?:কোনো\s*emi\s*নেই|কোনো\s*ঋণ\s*নেই|ঋণ\s*নেই|emi\s*নেই|no\s*emi|no\s*loan|no\s*commitments?|kono\s*emi\s*nai)/i.test(norm);

  if (isNegation) {
    if (currentState.lastAskedField === 'commitments' || /(?:emi|loan|ঋণ|commitment)/i.test(norm)) {
      extracted.commitments = 0;
    }
  }

  // Handling "same"
  if (/^(?:same|একই|আগেরটাই|same as before|আগের মতো)$/i.test(norm)) {
    extracted.isAmbiguousSame = true;
  }

  // Goal name extraction
  if (/laptop|ল্যাপটপ/i.test(norm)) extracted.goalName = 'Laptop';
  else if (/phone|mobile|ফোন|মোবাইল/i.test(norm)) extracted.goalName = 'Phone';
  else if (/emergency|জরুরি|ইমার্জেন্সি/i.test(norm)) extracted.goalName = 'Emergency Fund';
  else if (/education|পড়াশোনা|study|টিউশন/i.test(norm)) extracted.goalName = 'Education';
  else if (/travel|ভ্রমণ|ট্যুর|tour/i.test(norm)) extracted.goalName = 'Travel';
  else if (/business|ব্যবসা/i.test(norm)) extracted.goalName = 'Business';

  // Duration in months (e.g. "৬ মাস", "6 months", "৬ মাসে", "6 mo")
  const durationMatch = norm.match(/(\d+|[^\s\d]+)\s*(?:months?|মাস|মাসে|mo)\b/i);
  if (durationMatch && durationMatch[1]) {
    const dVal = parseNumberWithWords(durationMatch[1]);
    if (dVal && dVal <= 120) {
      extracted.targetDurationMonths = dVal;
    }
  }

  // Existing savings (e.g. "আমার ১০ হাজার টাকা already saved আছে", "current savings 10000")
  const existingSavingsMatch = norm.match(/(?:already\s*saved|saved|জমানো|জমা\s*আছে|current\s*savings?)[^\d]{0,15}(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার)/i) ||
                               norm.match(/(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার)[^\d]{0,15}(?:already\s*saved|জমানো|জমা\s*আছে)/i);
  if (existingSavingsMatch && existingSavingsMatch[1]) {
    const sVal = parseNumberWithWords(existingSavingsMatch[1]);
    if (sVal !== null) extracted.currentSavings = sVal;
  }

  // Explicit Income labeling (e.g. "আমার income ৩০ হাজার", "আয় 20000", "বেতন 30k", "salary 30,000", "30000 টাকা আয় করি")
  const incomeMatch = norm.match(/(?:income|salary|earn|বেতন|আয়|কামাই|মাসে\s*পাই)[^\d]{0,10}(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)/i) ||
                      norm.match(/(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)[^\d]{0,10}(?:income|salary|বেতন|আয়)/i);
  if (incomeMatch && incomeMatch[1]) {
    const incVal = parseNumberWithWords(incomeMatch[1]);
    if (incVal !== null) extracted.income = incVal;
  }

  // Explicit Expense labeling (e.g. "খরচ প্রায় ২২ হাজার", "expense 22000", "খরচ 15000", "ব্যয় 15000")
  const expenseMatch = norm.match(/(?:expense|spend|cost|খরচ|ব্যয়)[^\d]{0,10}(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)/i) ||
                       norm.match(/(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)[^\d]{0,10}(?:expense|cost|খরচ|ব্যয়)/i);
  if (expenseMatch && expenseMatch[1]) {
    const expVal = parseNumberWithWords(expenseMatch[1]);
    if (expVal !== null) extracted.expenses = expVal;
  }

  // Explicit Savings Goal labeling (e.g. "আমি ৫ হাজার save করতে চাই", "প্রতি মাসে ৫০০০ টাকা", "save 5000", "মাসে 5000 save")
  if (!extracted.monthlySavingsGoal) {
    const saveGoalMatch = norm.match(/(?:save|target|জমাতে|রাখতে|সঞ্চয়)[^\d]{0,10}(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)/i) ||
                          norm.match(/(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)[^\d]{0,10}(?:save|target|জমাতে|সঞ্চয়)/i);
    if (saveGoalMatch && saveGoalMatch[1]) {
      const gVal = parseNumberWithWords(saveGoalMatch[1]);
      if (gVal !== null) {
        if (extracted.targetDurationMonths || gVal >= 50000 || /(?:target|মোট|টাকা\s*জমাতে)/i.test(norm)) {
          extracted.targetAmount = gVal;
        } else {
          extracted.monthlySavingsGoal = gVal;
        }
      }
    }
  }

  // Explicit Commitments labeling (e.g. "EMI 3000", "ঋণ ২০০০", "কিস্তি ১৫০০")
  const commitmentMatch = norm.match(/(?:emi|loan|debt|ঋণ|কিস্তি)[^\d]{0,10}(\d[\d,]*|\d+\s*হাজার|[^\s\d]+\s*হাজার|\d+k)/i);
  if (commitmentMatch && commitmentMatch[1]) {
    const cVal = parseNumberWithWords(commitmentMatch[1]);
    if (cVal !== null) extracted.commitments = cVal;
  }

  // Context-aware bare value handling
  const parsedDirect = parseNumberWithWords(norm);
  if (parsedDirect !== null && Object.keys(extracted).length === 0) {
    if (currentState.lastAskedField === 'income') {
      extracted.income = parsedDirect;
    } else if (currentState.lastAskedField === 'expenses') {
      extracted.expenses = parsedDirect;
    } else if (currentState.lastAskedField === 'commitments') {
      extracted.commitments = parsedDirect;
    } else if (currentState.lastAskedField === 'monthlySavingsGoal') {
      extracted.monthlySavingsGoal = parsedDirect;
    } else if (currentState.lastAskedField === 'targetAmount') {
      extracted.targetAmount = parsedDirect;
    }
  }

  return extracted;
}

/**
 * Generate high-quality contextual deterministic fallback response
 */
export function generateDeterministicResponse({
  savingsState,
  plan,
  nextField,
  isBangla,
  isAmbiguousSame,
  isWhatIf
}) {
  if (isWhatIf) {
    if (plan.isFeasible) {
      return isBangla
        ? `যদি আপনি মাসে ৳${plan.monthlySavingsGoal.toLocaleString()} সঞ্চয় করেন, আপনার মাসিক উদ্বৃত্ত ৳${plan.availableMonthlyAmount.toLocaleString()} এর মধ্যে তা সহজেই সম্ভব!`
        : `If you save ৳${plan.monthlySavingsGoal.toLocaleString()} per month, it fits comfortably within your monthly available surplus of ৳${plan.availableMonthlyAmount.toLocaleString()}.`;
    } else {
      return isBangla
        ? `যদি আপনি মাসে ৳${plan.monthlySavingsGoal.toLocaleString()} সঞ্চয় করতে চান, তবে তা আপনার বর্তমান উদ্বৃত্ত (৳${plan.availableMonthlyAmount.toLocaleString()}) থেকে প্রায় ৳${plan.deficit.toLocaleString()} বেশি হবে। আপনি চাইলে উদ্বৃত্তের মধ্যে (৳${plan.availableMonthlyAmount.toLocaleString()}) সঞ্চয় করতে পারেন অথবা খরচ কিছুটা কমাতে পারেন।`
        : `Based on your numbers, saving ৳${plan.monthlySavingsGoal.toLocaleString()} every month would exceed your estimated surplus of ৳${plan.availableMonthlyAmount.toLocaleString()} by approximately ৳${plan.deficit.toLocaleString()}. You could consider saving around ৳${plan.availableMonthlyAmount.toLocaleString()}/month, or trimming monthly expenses to bridge the gap.`;
    }
  }

  if (isAmbiguousSame) {
    const prevAmt = savingsState.income || savingsState.monthlySavingsGoal || savingsState.expenses;
    const prevAmtText = prevAmt ? `৳${prevAmt.toLocaleString()}` : '';
    return isBangla
      ? (prevAmtText 
          ? `আপনি কি আগের ${prevAmtText} টাকার কথাটাই বোঝাচ্ছেন? স্পষ্ট করার জন্য অনুগ্রহ করে একটু নিশ্চিত করুন বা সংখ্যাটি বলুন।`
          : `আপনি কি আগের হিসাবটাই রাখতে চান? স্পষ্ট করার জন্য অনুগ্রহ করে পরিমাণটি একটু উল্লেখ করুন।`)
      : (prevAmtText
          ? `Are you referring to the previous amount of ${prevAmtText}? Please confirm or specify the exact amount.`
          : `Are you referring to your previous amount? To be sure, please specify the number.`);
  }

  if (nextField === 'income') {
    const goalText = savingsState.monthlySavingsGoal ? `৳${savingsState.monthlySavingsGoal.toLocaleString()}` : '';
    return isBangla
      ? `চমৎকার! আপনি প্রতি মাসে ${goalText} সঞ্চয় করতে চান। আপনার আনুমানিক মাসিক আয় কত?`
      : `That's a clear target. What is your approximate monthly income?`;
  }

  if (nextField === 'expenses') {
    const incText = savingsState.income ? `৳${savingsState.income.toLocaleString()}` : '';
    return isBangla
      ? `ধন্যবাদ। আপনার আয় ${incText} টাকা। এবার আনুমানিক মাসিক খরচ কত?`
      : `Thank you. With an income of ${incText}, roughly how much goes toward your regular monthly expenses?`;
  }

  if (nextField === 'commitments') {
    return isBangla
      ? `বুঝেছি। বর্তমানে আপনার কোনো EMI, ঋণ বা অন্য fixed monthly commitment আছে? (না থাকলে 'নেই' বলুন)`
      : `Got it. Do you have any EMI, loan installments, or other fixed monthly commitments? (If none, just say 'none')`;
  }

  if (nextField === 'monthlySavingsGoal') {
    return isBangla
      ? `আপনি প্রতি মাসে কত টাকা সঞ্চয় করতে চান, অথবা কোনো নির্দিষ্ট লক্ষ্য ও সময় আছে কি?`
      : `How much would you like to save each month, or is there a specific goal and timeline you have in mind?`;
  }

  // All fields collected!
  if (plan.isFeasible) {
    return isBangla
      ? `দারুণ! আপনার হিসাব অনুযায়ী:\n• মাসিক আয় (Monthly income): ৳${plan.income.toLocaleString()}\n• মাসিক খরচ (Monthly expenses): ৳${plan.expenses.toLocaleString()}\n• সঞ্চয়ের জন্য উপলব্ধ (Available for saving): ৳${plan.availableMonthlyAmount.toLocaleString()}\n• পরিকল্পিত সঞ্চয় (Planned saving): ৳${plan.monthlySavingsGoal.toLocaleString()}\n\nআপনার প্রতি মাসে ৳${plan.monthlySavingsGoal.toLocaleString()} সঞ্চয়ের পরিকল্পনাটি আপনার বর্তমান হিসাবের সাথে পুরোপুরি সামঞ্জস্যপূর্ণ।`
      : `Great! Here is your summary:\n• Monthly income: ৳${plan.income.toLocaleString()}\n• Monthly expenses: ৳${plan.expenses.toLocaleString()}\n• Available for saving: ৳${plan.availableMonthlyAmount.toLocaleString()}\n• Planned saving: ৳${plan.monthlySavingsGoal.toLocaleString()}\n\nYour planned monthly saving fits comfortably within your current budget.`;
  } else {
    return isBangla
      ? `আপনার বর্তমান হিসাব অনুযায়ী মাসে প্রায় ৳${plan.availableMonthlyAmount.toLocaleString()} পর্যন্ত রাখা সম্ভব। ৳${plan.monthlySavingsGoal.toLocaleString()} লক্ষ্য করতে হলে আপনি চাইলে খরচ কমানো, লক্ষ্য পরিবর্তন বা সময় বাড়ানোর মতো বিকল্প দেখতে পারেন।`
      : `Based on your numbers, saving ৳${plan.monthlySavingsGoal.toLocaleString()} every month would be above your current estimated surplus of ৳${plan.availableMonthlyAmount.toLocaleString()}. You could consider saving around ৳${plan.availableMonthlyAmount.toLocaleString()}/month, trimming monthly expenses, or extending your timeline.`;
  }
}

/**
 * MAIN CONVERSATIONAL CONTROLLER
 * Full Gemini multi-turn conversational flow with deterministic state machine and fallback guarantee.
 */
export async function handleSavingsConversation({
  conversationId,
  message,
  history = [],
  profile = {},
  genAI = null,
  candidateModels = CANDIDATE_SAVINGS_MODELS
}) {
  // 1. Load or initialize server-side session
  const session = getOrCreateSavingsSession(conversationId);

  // Sync initial profile values if provided
  if (profile && typeof profile === 'object') {
    for (const [k, v] of Object.entries(profile)) {
      if (v !== null && v !== undefined && session.savingsState[k] === null) {
        session.savingsState[k] = v;
      }
    }
  }

  // Update interaction tracking
  const previousInteractionId = session.geminiInteractionId;
  const newInteractionId = `gemini-turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  session.geminiInteractionId = newInteractionId;
  session.previousInteractionId = previousInteractionId;

  // Language detection
  const hasBangla = /[\u0980-\u09FF]/.test(message);
  const englishTokens = (message.match(/[a-zA-Z]{2,}/g) || []).filter(w => !/^(?:same|ok|yes|no|hi|hello|tk)$/i.test(w));
  if (hasBangla) {
    session.preferredLang = 'bn';
  } else if (englishTokens.length >= 2 || (englishTokens.length === 1 && !session.preferredLang)) {
    session.preferredLang = 'en';
  }
  const isBangla = session.preferredLang === 'bn';

  // Snapshot before
  const stateBefore = { ...session.savingsState, lastAskedField: session.lastAskedField };

  // DEBUG LOG 1
  console.log('[SAVINGS STATE BEFORE]', {
    monthlySavingsGoal: stateBefore.monthlySavingsGoal,
    income: stateBefore.income,
    expenses: stateBefore.expenses,
    commitments: stateBefore.commitments
  });

  // 2. Extract structured financial data from message
  const extracted = extractFinancialData(message, stateBefore);

  // DEBUG LOG 2
  console.log('[SAVINGS EXTRACTED]', extracted);

  // 3. Merge extracted values into session state (Never overwrite valid non-null with null)
  for (const [k, v] of Object.entries(extracted)) {
    if (v !== null && v !== undefined && v !== '' && k !== 'isAmbiguousSame' && k !== 'isWhatIf') {
      session.savingsState[k] = v;
    }
  }

  const stateAfter = { ...session.savingsState };

  // DEBUG LOG 3
  console.log('[SAVINGS STATE AFTER]', {
    monthlySavingsGoal: stateAfter.monthlySavingsGoal,
    income: stateAfter.income,
    expenses: stateAfter.expenses,
    commitments: stateAfter.commitments
  });

  // 4. Determine missing required field
  const nextField = getNextMissingField(stateAfter);

  // DEBUG LOG 4
  console.log('[SAVINGS NEXT FIELD]', nextField);

  // Update session's lastAskedField
  session.lastAskedField = nextField;

  // 5. Deterministic calculation
  const plan = calculateFinancialPlan(stateAfter);

  // 6. Gemini Multi-Turn Interaction with Fallback Guarantee
  let reply = '';
  let usedGemini = false;

  if (genAI) {
    const systemPrompt = `You are TakaBachao's AI Savings Guide, an educational conversational assistant.
You guide the user step-by-step to build a realistic monthly savings plan.

CURRENT AUTHORITATIVE SAVINGS STATE (maintained by backend):
${JSON.stringify(session.savingsState, null, 2)}

CURRENT DETERMINISTIC FINANCIAL CALCULATIONS (calculated by backend, do NOT contradict):
- Monthly Income: ৳${plan.income.toLocaleString()}
- Monthly Expenses: ৳${plan.expenses.toLocaleString()}
- Monthly Commitments: ৳${plan.commitments.toLocaleString()}
- Monthly Available Surplus: ৳${plan.availableMonthlyAmount.toLocaleString()}
- Planned Monthly Saving: ৳${plan.monthlySavingsGoal.toLocaleString()}
- Is Feasible: ${plan.isFeasible ? 'YES' : 'NO (Deficit: ৳' + plan.deficit.toLocaleString() + ')'}
- All Information Complete: ${plan.isComplete ? 'YES' : 'NO'}
- Next Missing Field Needed: ${nextField || 'None'}

CONVERSATION INSTRUCTIONS:
1. LANGUAGE: Respond strictly in ${isBangla ? 'Bangla (বাংলা)' : 'English'}.
2. DO NOT recalculate or perform arithmetic. The numbers above are authoritative.
3. DO NOT re-ask for any field that already has a value in CURRENT AUTHORITATIVE SAVINGS STATE.
4. If nextField is "income", acknowledge their savings goal and ask for approximate monthly income.
5. If nextField is "expenses", acknowledge their income (৳${plan.income.toLocaleString()}) and ask for their approximate monthly expenses. Do NOT ask for income again.
6. If nextField is "commitments", acknowledge expenses and ask if they have any EMI, loan installments, or other fixed monthly commitments.
7. If the user said "same", use conversation context. If ambiguous, ask a polite short clarification (e.g. asking if they mean the previous ৳${plan.income.toLocaleString()} figure).
8. If all required fields are collected (isComplete = true):
   - If feasible: show the breakdown (Income, Expenses, Available surplus, Planned saving) and confirm that the plan fits comfortably.
   - If not feasible (deficit > 0): explain that their target exceeds their estimated monthly surplus (৳${plan.availableMonthlyAmount.toLocaleString()}), and present realistic trade-offs (saving within surplus, trimming expenses, or extending timeline) without deciding for them.
9. If user asks a what-if question (e.g. "What if I save 6000?"), contextually explain the updated comparison to their available surplus (৳${plan.availableMonthlyAmount.toLocaleString()}).
10. Be concise, encouraging, and clear (2 to 4 sentences max).`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt
        });

        // Use server-side multi-turn chat history
        const chat = model.startChat({
          history: session.history.slice(-10) // Keep recent turns for context
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini response timed out')), 5000)
        );

        const sendPromise = chat.sendMessage(message);
        const result = await Promise.race([sendPromise, timeoutPromise]);
        
        const candidateText = result?.response?.text();
        if (candidateText && candidateText.trim().length > 0) {
          reply = candidateText.trim();
          usedGemini = true;
          break;
        }
      } catch (geminiErr) {
        console.warn(`[Gemini Multi-Turn] Model ${modelName} unavailable (${geminiErr.message}).`);
      }
    }
  }

  // Fallback guarantee: If Gemini is unavailable, rate-limited, or returned empty
  if (!reply) {
    reply = generateDeterministicResponse({
      savingsState: stateAfter,
      plan,
      nextField,
      isBangla,
      isAmbiguousSame: Boolean(extracted.isAmbiguousSame),
      isWhatIf: Boolean(extracted.isWhatIf)
    });
  }

  // 7. Update multi-turn chat history server-side
  session.history.push({
    role: 'user',
    parts: [{ text: message }]
  });
  session.history.push({
    role: 'model',
    parts: [{ text: reply }]
  });

  // Limit history length to prevent memory leakage
  if (session.history.length > 24) {
    session.history = session.history.slice(-20);
  }

  return {
    conversationId: session.conversationId,
    geminiInteractionId: session.geminiInteractionId,
    previousInteractionId: session.previousInteractionId,
    reply,
    savingsState: session.savingsState,
    state: session.savingsState, // Backwards compatibility for UI
    plan,
    nextField,
    showPlanCard: plan.isComplete,
    meta: {
      usedGemini,
      preferredLang: session.preferredLang,
      turnCount: Math.floor(session.history.length / 2)
    }
  };
}
