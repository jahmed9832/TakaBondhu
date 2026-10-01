import { handleSavingsConversation, parseNumberWithWords, resetSavingsSession } from '../backend/savingsService.js';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING SAVINGS GUIDE STATE MACHINE TESTS 1-8');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 8;

  // Test Natural Language number parser
  console.log('--- Checking Number Parsers ---');
  console.log('২০,০০০ ->', parseNumberWithWords('২০,০০০'));
  console.log('২২ হাজার ->', parseNumberWithWords('২২ হাজার'));
  console.log('৫ হাজার ->', parseNumberWithWords('৫ হাজার'));
  console.log('৩০k ->', parseNumberWithWords('৩০k'));
  console.log('১৫ হাজার ->', parseNumberWithWords('১৫ হাজার'));
  console.log('--------------------------------\n');

  // TEST 1
  console.log('🔹 TEST 1: User says: "আমি প্রতি মাসে ৫০০০ টাকা save করতে চাই"');
  const conv1 = 'test-session-' + Date.now();
  const res1 = await handleSavingsConversation({
    conversationId: conv1,
    message: 'আমি প্রতি মাসে ৫০০০ টাকা save করতে চাই'
  });
  console.log('Result 1:', {
    monthlySavingsGoal: res1.state.monthlySavingsGoal,
    nextField: res1.nextField,
    reply: res1.reply
  });

  const t1Passed = res1.state.monthlySavingsGoal === 5000 && res1.nextField === 'income';
  if (t1Passed) {
    console.log('✅ TEST 1 PASSED: monthlySavingsGoal = 5000, next question = income\n');
    passedCount++;
  } else {
    console.error('❌ TEST 1 FAILED\n');
  }

  // TEST 2
  console.log('🔹 TEST 2: User says: "20000"');
  const res2 = await handleSavingsConversation({
    conversationId: conv1,
    message: '20000'
  });
  console.log('Result 2:', {
    income: res2.state.income,
    monthlySavingsGoal: res2.state.monthlySavingsGoal,
    nextField: res2.nextField,
    reply: res2.reply
  });

  const t2Passed = res2.state.income === 20000 && res2.nextField === 'expenses' && !res2.reply.includes('মাসিক আয় কত');
  if (t2Passed) {
    console.log('✅ TEST 2 PASSED: income = 20000, next question = expenses (DID NOT ask income again!)\n');
    passedCount++;
  } else {
    console.error('❌ TEST 2 FAILED\n');
  }

  // TEST 3
  console.log('🔹 TEST 3: User says: "15000"');
  const res3 = await handleSavingsConversation({
    conversationId: conv1,
    message: '15000'
  });
  console.log('Result 3:', {
    expenses: res3.state.expenses,
    income: res3.state.income,
    nextField: res3.nextField,
    reply: res3.reply
  });

  const t3Passed = res3.state.expenses === 15000 && res3.nextField === 'commitments';
  if (t3Passed) {
    console.log('✅ TEST 3 PASSED: expenses = 15000, next question = commitments\n');
    passedCount++;
  } else {
    console.error('❌ TEST 3 FAILED\n');
  }

  // TEST 4
  console.log('🔹 TEST 4: User says: "আমার কোনো EMI নেই"');
  const res4 = await handleSavingsConversation({
    conversationId: conv1,
    message: 'আমার কোনো EMI নেই'
  });
  console.log('Result 4:', {
    commitments: res4.state.commitments,
    nextField: res4.nextField,
    reply: res4.reply
  });

  const t4Passed = res4.state.commitments === 0 && res4.nextField === null;
  if (t4Passed) {
    console.log('✅ TEST 4 PASSED: commitments = 0\n');
    passedCount++;
  } else {
    console.error('❌ TEST 4 FAILED\n');
  }

  // TEST 5
  console.log('🔹 TEST 5: User says: "আমার income 30000, expense 22000, আর আমি মাসে 5000 save করতে চাই"');
  const conv5 = 'test-session-5-' + Date.now();
  const res5 = await handleSavingsConversation({
    conversationId: conv5,
    message: 'আমার income 30000, expense 22000, আর আমি মাসে 5000 save করতে চাই'
  });
  console.log('Result 5:', {
    income: res5.state.income,
    expenses: res5.state.expenses,
    monthlySavingsGoal: res5.state.monthlySavingsGoal,
    nextField: res5.nextField,
    reply: res5.reply
  });

  const t5Passed = res5.state.income === 30000 && 
                   res5.state.expenses === 22000 && 
                   res5.state.monthlySavingsGoal === 5000 && 
                   res5.nextField === 'commitments';
  if (t5Passed) {
    console.log('✅ TEST 5 PASSED: Extracted all 3 values in one message, skipped questions, asks commitments\n');
    passedCount++;
  } else {
    console.error('❌ TEST 5 FAILED\n');
  }

  // TEST 6
  console.log('🔹 TEST 6: User says ambiguous: "same"');
  // Setup a session with income=20000 asking for expenses
  const conv6 = 'test-session-6-' + Date.now();
  await handleSavingsConversation({ conversationId: conv6, message: 'আমি ৫০০০ save করতে চাই' });
  await handleSavingsConversation({ conversationId: conv6, message: '20000' });
  const res6 = await handleSavingsConversation({
    conversationId: conv6,
    message: 'same'
  });
  console.log('Result 6:', {
    reply: res6.reply,
    nextField: res6.nextField
  });

  const t6Passed = !res6.reply.includes('মাসিক আয় কত') && (res6.reply.includes('২০,০০০') || res6.reply.includes('20,000') || res6.reply.includes('আগের'));
  if (t6Passed) {
    console.log('✅ TEST 6 PASSED: Did not repeat income question blindly; asked contextual clarification\n');
    passedCount++;
  } else {
    console.error('❌ TEST 6 FAILED\n');
  }

  // TEST 7
  console.log('🔹 TEST 7: Feasible Plan Summary');
  // State: income=20000, expenses=15000, commitments=0, monthlySavingsGoal=5000
  console.log('Plan metrics for Test 7:');
  console.log('availableMonthlyAmount =', res4.plan.availableMonthlyAmount);
  console.log('isFeasible =', res4.plan.isFeasible);
  console.log('Reply preview:\n', res4.reply);

  const t7Passed = res4.plan.availableMonthlyAmount === 5000 && 
                   res4.plan.isFeasible === true && 
                   res4.reply.includes('20,000') && 
                   res4.reply.includes('15,000') && 
                   res4.reply.includes('5,000');
  if (t7Passed) {
    console.log('✅ TEST 7 PASSED: availableMonthlyAmount = 5000, showed income/expense/available/planned breakdown\n');
    passedCount++;
  } else {
    console.error('❌ TEST 7 FAILED\n');
  }

  // TEST 8
  console.log('🔹 TEST 8: Aggressive Goal (income=25000, expenses=22000, commitments=0, goal=5000)');
  const conv8 = 'test-session-8-' + Date.now();
  await handleSavingsConversation({ conversationId: conv8, message: 'আমার income 25000, expense 22000, আর আমি মাসে 5000 save করতে চাই' });
  const res8 = await handleSavingsConversation({ conversationId: conv8, message: 'আমার কোনো ঋণ নেই' });
  
  console.log('Result 8 Plan:');
  console.log('availableMonthlyAmount =', res8.plan.availableMonthlyAmount);
  console.log('isFeasible =', res8.plan.isFeasible);
  console.log('Reply:\n', res8.reply);

  const t8Passed = res8.plan.availableMonthlyAmount === 3000 && 
                   res8.plan.isFeasible === false && 
                   res8.reply.includes('3,000') && 
                   res8.reply.includes('5,000') &&
                   !res8.reply.includes('মানানসই');
  if (t8Passed) {
    console.log('✅ TEST 8 PASSED: available = 3000, warned not currently feasible, presented options without deciding for user\n');
    passedCount++;
  } else {
    console.error('❌ TEST 8 FAILED\n');
  }

  console.log('====================================================');
  console.log(`FINAL RESULT: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('====================================================');
}

runTests().catch(console.error);
