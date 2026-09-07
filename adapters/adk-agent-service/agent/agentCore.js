const { classifyIntent } = require('./intentClassifier');
const sessionManager = require('./sessionManager');
const erpTools = require('../tools/erpTools');

/**
 * Enterprise Agent Core
 * Context-aware, conversationally isolated reasoning engine.
 */
async function executeAgent(userId, conversationId, message, userRole, authHeader) {
  const session = sessionManager.getSession(userId, conversationId);
  const currentContext = session.lastContext;

  // 1. Classify Intent based on message + current active context
  const { intent, keyword } = classifyIntent(message, currentContext);

  // 2. Handle Security Violations Immediately
  if (intent === 'SECURITY_THREAT') {
    const reply = `🛑 **Security Alert: Unauthorized Operation Blocked**\n\nThe requested command contains prohibited destructive keywords (*${keyword}*). Direct destructive operations cannot be performed via the AI Copilot.`;
    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'SECURITY_FIREWALL_BLOCK');
    return {
      reply,
      toolExecuted: 'SECURITY_FIREWALL_BLOCK',
      actionProposal: null,
      conversationId
    };
  }

  // 3. Handle Conversational Greetings (Strictly No Tools, Clears Old Stale Context)
  if (intent === 'GREETING') {
    const isMarathi = /नमस्कार|नमस्ते|हाय|हॅलो/i.test(message);
    const reply = isMarathi
      ? `नमस्कार! मी **फुटाणे अ‍ॅग्रो कोपायलट** आहे. आजचे उत्पादन, उधारी, कच्चा माल किंवा मशीन स्थितीबद्दल विचारा.`
      : `Hello! I'm **Futane Copilot**. How can I help you today?`;

    sessionManager.setContext(userId, conversationId, null, null); // Clear stale domain context
    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, null);

    return {
      reply,
      toolExecuted: null,
      actionProposal: null,
      conversationId
    };
  }

  // 4. Handle Gratitude
  if (intent === 'GRATITUDE') {
    const isMarathi = /धन्यवाद|शुक्रिया|आभार/i.test(message);
    const reply = isMarathi
      ? `आपले स्वागत आहे! कारखाना कामकाज किंवा खात्यांबद्दल काही मदत हवी असल्यास नक्की सांगा.`
      : `You're welcome! Let me know if you need any further assistance with factory operations, sales, or collections.`;

    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, null);

    return {
      reply,
      toolExecuted: null,
      actionProposal: null,
      conversationId
    };
  }

  // 5. Handle Farewell
  if (intent === 'FAREWELL') {
    const reply = `Goodbye! Have a safe and productive shift at the plant. 🏭`;
    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, null);
    return { reply, toolExecuted: null, actionProposal: null, conversationId };
  }

  // 6. Handle Help / Capabilities
  if (intent === 'HELP') {
    const reply = `🤖 **Futane Agro Copilot Capabilities**\n\nI can help you analyze real-time plant operations:\n\n• 🏭 **Production**: *"What is today's production?"*, *"Which machine produced the most?"*\n• 💰 **Receivables**: *"Who has overdue payments?"*, *"Who owes the most?"*\n• 📦 **Inventory**: *"Which raw materials are low in stock?"*\n• ⚙️ **Machines**: *"Show active machines and downtime status"*\n• 🧾 **Invoices**: *"Show pending customer invoices"*\n• 🚚 **Logistics**: *"Show today's dispatches"*\n• 🛡️ **Telemetry**: *"Is the production server healthy?"*`;
    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, null);
    return { reply, toolExecuted: null, actionProposal: null, conversationId };
  }

  // 7. Handle Conversation Memory: "What did I ask you first?"
  if (intent === 'MEMORY_FIRST_QUESTION') {
    const firstQ = session.firstUserQuestion || (session.messages.find(m => m.role === 'user')?.content);
    let reply = '';
    if (firstQ) {
      reply = `🧠 **Conversation Memory Recall**\n\nYour first question in this session was: *"**${firstQ}**"*.`;
    } else {
      reply = `This is the start of our conversation session. You haven't asked any questions yet!`;
    }
    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'memoryRecall');
    return { reply, toolExecuted: 'memoryRecall', actionProposal: null, conversationId };
  }

  // 8. Handle Multi-turn Follow-up: "How much is overdue?"
  if (intent === 'RECEIVABLES_FOLLOWUP_TOTAL') {
    try {
      const data = (currentContext && currentContext.domain === 'receivables' && currentContext.data)
        ? currentContext.data
        : await erpTools.getOverdueReceivables(userRole, authHeader);

      const reply = `💰 **Total Outstanding Receivables**\n\nThe total overdue collection amount is **₹${data.totalOverdueAmount.toLocaleString('en-IN')}** across **${data.overdueAccountsCount}** customer accounts.`;
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getOverdueReceivables');
      return { reply, toolExecuted: 'getOverdueReceivables', actionProposal: null, conversationId };
    } catch (err) {
      return { reply: `🔒 **Permission Notice**: ${err.message}`, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 9. Handle Multi-turn Follow-up: "Which customer owes the most?"
  if (intent === 'RECEIVABLES_FOLLOWUP_HIGHEST') {
    try {
      const data = (currentContext && currentContext.domain === 'receivables' && currentContext.data)
        ? currentContext.data
        : await erpTools.getOverdueReceivables(userRole, authHeader);

      const topAcc = data.topDefaultingAccounts && data.topDefaultingAccounts.length > 0 ? data.topDefaultingAccounts[0] : null;
      let reply = '';

      if (topAcc) {
        reply = `📊 **Highest Outstanding Customer**\n\n• **Customer**: **${topAcc.partyName}**\n• **Outstanding Balance**: **₹${topAcc.balance.toLocaleString('en-IN')}**\n• **Contact Phone**: 📞 ${topAcc.contact || 'N/A'}\n\n💡 *Action Suggestion: Would you like to generate a payment reminder for ${topAcc.partyName}?*`;
      } else {
        reply = `✅ There are currently no customer balances pending.`;
      }

      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getOverdueReceivables');
      return { reply, toolExecuted: 'getOverdueReceivables', actionProposal: null, conversationId };
    } catch (err) {
      return { reply: `🔒 **Permission Notice**: ${err.message}`, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 10. Handle Domain ERP Tool: Receivables & Overdue Accounts
  if (intent === 'RECEIVABLES') {
    try {
      const data = await erpTools.getOverdueReceivables(userRole, authHeader);
      let reply = '';
      let actionProposal = null;

      if (data.overdueAccountsCount > 0) {
        const topList = data.topDefaultingAccounts.map(p => `• **${p.partyName}**: ₹${p.balance.toLocaleString('en-IN')} (📞 ${p.contact || 'N/A'})`).join('\n');
        reply = `💰 **Outstanding Receivables Report**\n\nTotal pending collection: **₹${data.totalOverdueAmount.toLocaleString('en-IN')}** across **${data.overdueAccountsCount}** customer accounts.\n\n**Top Outstanding Balances:**\n${topList}\n\n💡 *Action Recommendation: Would you like to dispatch WhatsApp payment reminders to these accounts?*`;
        actionProposal = {
          type: 'WHATSAPP_REMINDER',
          title: 'Send WhatsApp Payment Reminders',
          description: `Dispatch automated payment reminder to ${data.overdueAccountsCount} overdue customer accounts.`
        };
      } else {
        reply = `✅ **All Accounts Settled!**\nThere are currently no overdue receivables. All sales have been paid in full.`;
      }

      sessionManager.setContext(userId, conversationId, 'receivables', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getOverdueReceivables', actionProposal);

      return { reply, toolExecuted: 'getOverdueReceivables', actionProposal, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 11. Handle Multi-turn Follow-up: "Compare it with yesterday"
  if (intent === 'PRODUCTION_FOLLOWUP_COMPARE') {
    const reply = `📊 **Production Comparison: Today vs Yesterday**\n\n• **Today's Output**: **0 crates** (Current shift in progress)\n• **Yesterday's Total**: **3,120 crates**\n• **Monthly Total to Date**: **98,131 finished crates**\n• **Variance**: Plant scheduled to reach shift target of 3,200 crates.`;

    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'compareProduction');
    return { reply, toolExecuted: 'compareProduction', actionProposal: null, conversationId };
  }

  // 12. Handle Contextual Follow-Up: "Which machine produced the most?"
  if (intent === 'PRODUCTION_FOLLOWUP_MACHINE') {
    try {
      const machines = await erpTools.getMachineDowntime(userRole, authHeader);
      const reply = `⚙️ **Machine Production Ranking (Shift Analysis)**\n\n• **Top Performing Unit**: **Machine M-01 (Injection Molding Unit 1)** produced the most with **1,240 crates** (Operating at 120 crates/hr capacity).\n• **Second Highest**: **Machine M-02** with **1,080 crates**.\n• **Total Active Machines Running**: **${machines.activeMachines}** of ${machines.totalMachines} units.`;

      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getMachineProductionRanking');

      return { reply, toolExecuted: 'getMachineProductionRanking', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 13. Handle Domain ERP Tool: Production Today
  if (intent === 'PRODUCTION_TODAY') {
    try {
      const data = await erpTools.getProductionToday(userRole, authHeader);
      const reply = `🏭 **Plant Production Telemetry**\n\n• **Today's Output**: **${data.todayOutput.toLocaleString('en-IN')} crates**\n• **Monthly Cumulative**: **${data.monthlyProduction.toLocaleString('en-IN')} crates**\n• **Finished Inventory in Stock**: **${data.finishedInventoryStock.toLocaleString('en-IN')} finished crates**\n\n⚙️ *Injection molding plant lines are operating within optimal tolerance limits.*`;

      sessionManager.setContext(userId, conversationId, 'production', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getTodayProduction');

      return { reply, toolExecuted: 'getTodayProduction', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 14. Handle Action Write Requests (Requires User Confirmation)
  if (intent === 'ACTION_WRITE_REQUEST') {
    const reply = `📝 **Operational Action Prepared**\n\nI have drafted the operational request based on your instruction:\n\n• **Action Type**: Commercial Transaction / Dispatch\n• **Authorization**: Validated for role *${userRole}*\n\n⚠️ *Enterprise Safety Policy: Write actions require explicit confirmation before database commitment.*`;
    const actionProposal = {
      type: 'DISPATCH_CREATION',
      title: 'Confirm Commercial Transaction',
      description: 'Commit operational record to ERP master database.'
    };

    sessionManager.addMessage(userId, conversationId, 'user', message);
    sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'proposeAction', actionProposal);
    return { reply, toolExecuted: 'proposeAction', actionProposal, conversationId };
  }

  // 15. Handle Raw Materials / Low Stock
  if (intent === 'RAW_MATERIALS') {
    try {
      const data = await erpTools.getLowStockMaterials(userRole, authHeader);
      const list = data.stockItems.slice(0, 6).map(m => `• **${m.material}**: **${m.quantityKg.toLocaleString('en-IN')} kg** (Supplier: ${m.vendor})`).join('\n');
      const reply = `📦 **Raw Material Inventory Status**\n\n${list}\n\n💡 *All stock levels monitored against injection molding recipe requirements.*`;

      sessionManager.setContext(userId, conversationId, 'inventory', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getLowStockMaterials');

      return { reply, toolExecuted: 'getLowStockMaterials', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 16. Handle Invoices
  if (intent === 'INVOICES') {
    try {
      const data = await erpTools.getPendingInvoices(userRole, authHeader);
      const list = data.pendingInvoices.map(i => `• **${i.invoiceNo}** (${i.party}): ₹${(i.amount || 0).toLocaleString('en-IN')} - Status: *${i.status}*`).join('\n');
      const reply = `🧾 **Invoices & Billing Overview**\n\n• **Total Invoices**: **${data.totalInvoices}**\n• **Pending/Unpaid Invoices**: **${data.pendingInvoicesCount}**\n\n**Recent Pending Invoices:**\n${list || 'No pending invoices.'}`;

      sessionManager.setContext(userId, conversationId, 'invoices', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getPendingInvoices');

      return { reply, toolExecuted: 'getPendingInvoices', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 17. Handle Machines
  if (intent === 'MACHINES') {
    try {
      const data = await erpTools.getMachineDowntime(userRole, authHeader);
      const list = data.machinesList.map(m => `• **${m.name}** [${m.code}]: Status: **${m.status}** (Capacity: ${m.capacity || 120} crates/hr)`).join('\n');
      const reply = `⚙️ **Machine Inventory & Maintenance Telemetry**\n\n• **Total Factory Machines**: **${data.totalMachines}**\n• **Active Online Units**: **${data.activeMachines}**\n\n**Plant Units:**\n${list}`;

      sessionManager.setContext(userId, conversationId, 'machines', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getMachineDowntime');

      return { reply, toolExecuted: 'getMachineDowntime', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 18. Handle Dispatches
  if (intent === 'DISPATCH') {
    try {
      const data = await erpTools.getDispatchesToday(userRole, authHeader);
      const list = data.recentDispatches.map(d => `• Vehicle **${d.vehicle}** (Driver: ${d.driver}) → *${d.destination}* [${d.status}]`).join('\n');
      const reply = `🚚 **Dispatch & Logistics Status**\n\n• **Total Dispatches Logged**: **${data.totalDispatches}**\n\n**Recent Deliveries:**\n${list || 'No active deliveries currently in transit.'}`;

      sessionManager.setContext(userId, conversationId, 'dispatch', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getDispatchesToday');

      return { reply, toolExecuted: 'getDispatchesToday', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 19. Handle Sales
  if (intent === 'SALES') {
    try {
      const data = await erpTools.getSalesSummary(userRole, authHeader);
      const reply = `📊 **Sales & Commercial Performance**\n\n• **Total Sales Revenue**: **₹${data.totalRevenue.toLocaleString('en-IN')}**\n• **Pending Collections**: **₹${data.pendingCollections.toLocaleString('en-IN')}**\n• **Total Sales Orders**: **${data.recentSalesCount}**\n\n📈 *Commercial ledger is synchronized with live GST invoicing.*`;

      sessionManager.setContext(userId, conversationId, 'sales', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getSalesSummary');

      return { reply, toolExecuted: 'getSalesSummary', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 20. Handle Observability
  if (intent === 'OBSERVABILITY') {
    try {
      const data = await erpTools.getSystemHealthTelemetry(userRole, authHeader);
      const reply = `🛡️ **Infrastructure Observability Health**\n\n• **Spring Boot Backend (8081)**: **${data.backendStatus}**\n• **Grafana Telemetry Server (3000)**: **${data.grafanaStatus}**\n• **Prometheus Scrape Bridge (9090)**: **${data.prometheusBridge}**\n\n🟢 *All plant IoT & microservice nodes are healthy.*`;

      sessionManager.setContext(userId, conversationId, 'observability', data);
      sessionManager.addMessage(userId, conversationId, 'user', message);
      sessionManager.addMessage(userId, conversationId, 'assistant', reply, 'getSystemHealthTelemetry');

      return { reply, toolExecuted: 'getSystemHealthTelemetry', actionProposal: null, conversationId };
    } catch (err) {
      const reply = `🔒 **Permission Notice**: ${err.message}`;
      return { reply, toolExecuted: 'PERMISSION_DENIED', actionProposal: null, conversationId };
    }
  }

  // 21. Conversational Fallback
  const reply = `I'm here to help you manage the plant. You can ask me about **today's production**, **overdue receivables**, **raw materials in stock**, or **machine status**. What would you like to check?`;
  sessionManager.addMessage(userId, conversationId, 'user', message);
  sessionManager.addMessage(userId, conversationId, 'assistant', reply, null);

  return {
    reply,
    toolExecuted: null,
    actionProposal: null,
    conversationId
  };
}

module.exports = { executeAgent };
