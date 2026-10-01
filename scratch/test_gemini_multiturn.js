import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleSavingsConversation, getOrCreateSavingsSession } from '../backend/savingsService.js';

dotenv.config({ path: './backend/.env' });

const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function runMultiTurnTest() {
  console.log('====================================================');
  console.log('🧪 TESTING SAVINGS GUIDE MULTI-TURN GEMINI CONVERSATION');
  console.log('====================================================\n');

  const convId = 'multiturn-test-' + Date.now();
  console.log(`Session ID: ${convId}\n`);

  const turns = [
    {
      step: 1,
      input: 'আমি মাসে ৫০০০ টাকা save করতে চাই',
      expectedLang: 'bn',
      check: (res) => res.savingsState.monthlySavingsGoal === 5000 && res.nextField === 'income'
    },
    {
      step: 2,
      input: '20000',
      expectedLang: 'bn',
      check: (res) => res.savingsState.income === 20000 && res.nextField === 'expenses'
    },
    {
      step: 3,
      input: 'same',
      expectedLang: 'bn',
      check: (res) => res.nextField === 'expenses' && (res.reply.includes('২০,০০০') || res.reply.includes('20,000') || res.reply.includes('আগের'))
    },
    {
      step: 4,
      input: '15000',
      expectedLang: 'bn',
      check: (res) => res.savingsState.expenses === 15000 && res.nextField === 'commitments'
    },
    {
      step: 5,
      input: 'না',
      expectedLang: 'bn',
      check: (res) => res.savingsState.commitments === 0 && res.nextField === null && res.plan.availableMonthlyAmount === 5000
    },
    {
      step: 6,
      input: 'What if I save 6000?',
      expectedLang: 'en',
      check: (res) => res.savingsState.monthlySavingsGoal === 6000 && 
                      res.plan.deficit === 1000 && 
                      (res.reply.includes('6,000') || res.reply.includes('6000')) &&
                      (res.reply.includes('5,000') || res.reply.includes('5000'))
    }
  ];

  let allPassed = true;

  for (const t of turns) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Turn ${t.step}: User -> "${t.input}"`);
    console.log(`----------------------------------------------------`);

    const result = await handleSavingsConversation({
      conversationId: convId,
      message: t.input,
      genAI,
      candidateModels: ['gemini-3.8-flash', 'gemini-3.5-flash-lite']
    });

    console.log(`Response: "${result.reply}"`);
    console.log(`State:`, {
      monthlySavingsGoal: result.savingsState.monthlySavingsGoal,
      income: result.savingsState.income,
      expenses: result.savingsState.expenses,
      commitments: result.savingsState.commitments,
      nextField: result.nextField,
      geminiInteractionId: result.geminiInteractionId,
      previousInteractionId: result.previousInteractionId,
      usedGemini: result.meta?.usedGemini,
      preferredLang: result.meta?.preferredLang
    });

    const passed = t.check(result);
    if (passed) {
      console.log(`✅ Turn ${t.step} PASSED`);
    } else {
      console.log(`❌ Turn ${t.step} FAILED`);
      allPassed = false;
    }
  }

  console.log('\n====================================================');
  console.log(`MULTI-TURN TEST RESULT: ${allPassed ? 'ALL 6 TURNS PASSED! 🚀' : 'SOME TURNS FAILED ⚠️'}`);
  console.log('====================================================');

  const finalSession = getOrCreateSavingsSession(convId);
  console.log('\nFinal Session History Length:', finalSession.history.length, 'messages');
  console.log('Final Interaction ID:', finalSession.geminiInteractionId);
}

runMultiTurnTest().catch(console.error);
