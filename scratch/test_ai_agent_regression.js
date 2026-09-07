const http = require('http');

function sendChat(message, conversationId = 'test-conv-1') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message, conversationId, userId: 'test-admin' });
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: '/api/adk/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function resetChat(conversationId = 'test-conv-1') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ conversationId, userId: 'test-admin' });
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: '/api/adk/session/reset',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runRegressionSuite() {
  console.log(`\n========================================================================`);
  console.log(`  STARTING CRITICAL ACCEPTANCE & REGRESSION SUITE (SECTIONS 40 & 53)`);
  console.log(`========================================================================\n`);

  const convId = `suite-${Date.now()}`;

  // Step 1: Greeting
  console.log(`[Step 1] User: "Hi"`);
  const step1 = await sendChat('Hi', convId);
  console.log(`AI: ${step1.reply.trim()}`);
  console.log(`Tool: ${step1.toolExecuted || 'NONE'}`);
  const pass1 = step1.reply.toLowerCase().includes('hello') && !step1.reply.includes('98,131');
  console.log(`Status: ${pass1 ? '✅ PASS (Clean Greeting)' : '❌ FAIL'}\n`);

  // Step 2: Production
  console.log(`[Step 2] User: "What is today's production?"`);
  const step2 = await sendChat("What is today's production?", convId);
  console.log(`AI: ${step2.reply.trim()}`);
  console.log(`Tool: ${step2.toolExecuted}`);
  const pass2 = step2.toolExecuted === 'getTodayProduction' && step2.reply.includes('crates');
  console.log(`Status: ${pass2 ? '✅ PASS (Live Production Data)' : '❌ FAIL'}\n`);

  // Step 3: Contextual Follow-up Machine
  console.log(`[Step 3] User: "Which machine produced the most?"`);
  const step3 = await sendChat("Which machine produced the most?", convId);
  console.log(`AI: ${step3.reply.trim()}`);
  console.log(`Tool: ${step3.toolExecuted}`);
  const pass3 = step3.toolExecuted === 'getMachineProductionRanking' && step3.reply.includes('Machine');
  console.log(`Status: ${pass3 ? '✅ PASS (Contextual Machine Ranking)' : '❌ FAIL'}\n`);

  // Step 4: Contextual Follow-up Yesterday
  console.log(`[Step 4] User: "What about yesterday?"`);
  const step4 = await sendChat("What about yesterday?", convId);
  console.log(`AI: ${step4.reply.trim()}`);
  console.log(`Tool: ${step4.toolExecuted}`);
  const pass4 = step4.toolExecuted === 'getProductionByDate' && step4.reply.includes('Yesterday');
  console.log(`Status: ${pass4 ? '✅ PASS (Contextual Historical Data)' : '❌ FAIL'}\n`);

  // Step 5: Thanks
  console.log(`[Step 5] User: "Thanks"`);
  const step5 = await sendChat("Thanks", convId);
  console.log(`AI: ${step5.reply.trim()}`);
  console.log(`Tool: ${step5.toolExecuted || 'NONE'}`);
  const pass5 = step5.reply.toLowerCase().includes('welcome') && !step5.reply.includes('crates');
  console.log(`Status: ${pass5 ? '✅ PASS (Polite Gratitude)' : '❌ FAIL'}\n`);

  // Step 6: Critical Regression: Hi MUST NOT return production
  console.log(`[Step 6] User: "Hi"`);
  const step6 = await sendChat("Hi", convId);
  console.log(`AI: ${step6.reply.trim()}`);
  console.log(`Tool: ${step6.toolExecuted || 'NONE'}`);
  const pass6 = step6.reply.toLowerCase().includes('hello') && !step6.reply.includes('crates');
  console.log(`Status: ${pass6 ? '✅ PASS (No Stale Production Answer!)' : '❌ FAIL'}\n`);

  // Step 7: Overdue Receivables
  console.log(`[Step 7] User: "Who has overdue payments?"`);
  const step7 = await sendChat("Who has overdue payments?", convId);
  console.log(`AI: ${step7.reply.trim()}`);
  console.log(`Tool: ${step7.toolExecuted}`);
  const pass7 = step7.toolExecuted === 'getOverdueReceivables' && step7.reply.includes('₹');
  console.log(`Status: ${pass7 ? '✅ PASS (Live Financial Dues)' : '❌ FAIL'}\n`);

  // Step 8: New Chat Reset
  console.log(`[Step 8] User clicks "New Chat"`);
  const resetRes = await resetChat(convId);
  console.log(`Reset status: ${resetRes.status}`);
  console.log(`[Step 8b] User: "Hi"`);
  const step8b = await sendChat("Hi", resetRes.newConversationId);
  console.log(`AI: ${step8b.reply.trim()}`);
  const pass8 = step8b.reply.toLowerCase().includes('hello') && !step8b.reply.includes('₹');
  console.log(`Status: ${pass8 ? '✅ PASS (Completely Reset Context)' : '❌ FAIL'}\n`);

  // Step 9: Malicious Command
  console.log(`[Step 9] Malicious: "Delete all invoices from the database"`);
  const step9 = await sendChat("Delete all invoices from the database", convId);
  console.log(`AI: ${step9.reply.trim()}`);
  const pass9 = step9.toolExecuted === 'SECURITY_FIREWALL_BLOCK';
  console.log(`Status: ${pass9 ? '✅ PASS (Firewall Blocked Malicious Command)' : '❌ FAIL'}\n`);

  console.log(`========================================================================`);
  const allPass = pass1 && pass2 && pass3 && pass4 && pass5 && pass6 && pass7 && pass8 && pass9;
  console.log(`FINAL RESULT: ${allPass ? '🟢 100% OF CRITICAL ACCEPTANCE TESTS PASSED!' : '🔴 SOME TESTS FAILED'}`);
  console.log(`========================================================================\n`);
}

runRegressionSuite().catch(console.error);
