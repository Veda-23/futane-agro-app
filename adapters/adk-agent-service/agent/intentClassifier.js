/**
 * Multilingual Intent Classifier (English, Hindi, Marathi)
 * Strictly separates Conversational Intents, Multi-turn Contextual Follow-ups, and ERP Domain Tools.
 */

function classifyIntent(message, currentContext = null) {
  const raw = (message || '').trim().toLowerCase();
  const q = raw.replace(/[?.,!]/g, '').trim();

  // 1. Security / Malicious Detection
  const dangerousPatterns = [
    'delete all', 'delete from', 'drop table', 'drop database', 'truncate table', 'truncate ',
    'rm -rf', 'ignore previous instructions', 'bypass authentication',
    'show all passwords', 'dump database', 'exec(', 'eval('
  ];
  for (const pattern of dangerousPatterns) {
    if (raw.includes(pattern)) {
      return { intent: 'SECURITY_THREAT', confidence: 1.0, keyword: pattern };
    }
  }

  // 2. Exact Greetings (No Tools)
  const greetingRegex = /^(hi|hello|hey|greetings|good\s+morning|good\s+evening|good\s+afternoon|namaste|namaskar|hola|howdy|नमस्कार|नमस्ते|हाय|हॅलो)$/i;
  if (greetingRegex.test(q) || q === 'hi' || q === 'hello' || q === 'hey' || q === 'good morning' || q === 'good evening') {
    return { intent: 'GREETING', confidence: 1.0 };
  }

  // 3. Gratitude (No Tools)
  const gratitudeRegex = /^(thanks|thank\s+you|thanku|thx|dhanyawad|shukriya|धन्यवाद|शुक्रिया|आभार|थँक्स)$/i;
  if (gratitudeRegex.test(q) || q === 'thanks' || q === 'thank you') {
    return { intent: 'GRATITUDE', confidence: 1.0 };
  }

  // 4. Farewell (No Tools)
  const farewellRegex = /^(bye|goodbye|cya|see\s+you|exit|quit|अलविदा|बाय)$/i;
  if (farewellRegex.test(q) || q === 'bye' || q === 'goodbye') {
    return { intent: 'FAREWELL', confidence: 1.0 };
  }

  // 5. Help / Capabilities
  if (q.includes('what can you do') || q === 'help' || q === 'who are you' || q.includes('help me') || q.includes('मदत')) {
    return { intent: 'HELP', confidence: 0.95 };
  }

  // 6. Memory Recall: "What did I ask you first?" / "What was my previous question?"
  if (q.includes('first question') || q.includes('ask you first') || q.includes('first ask') || q.includes('previous question') || q.includes('आधी काय विचारले') || q.includes('पहिला प्रश्न')) {
    return { intent: 'MEMORY_FIRST_QUESTION', confidence: 0.98 };
  }

  // 7. Contextual Follow-up in RECEIVABLES domain
  if (currentContext && currentContext.domain === 'receivables') {
    if (q.includes('how much') || q.includes('total overdue') || q.includes('total amount') || q.includes('एकूण किती')) {
      return { intent: 'RECEIVABLES_FOLLOWUP_TOTAL', confidence: 0.95 };
    }
    if (q.includes('who owes the most') || q.includes('owes the most') || q.includes('highest') || q.includes('top customer') || q.includes('सर्वात जास्त')) {
      return { intent: 'RECEIVABLES_FOLLOWUP_HIGHEST', confidence: 0.95 };
    }
  }

  // 8. Contextual Follow-up in PRODUCTION domain
  if (currentContext && currentContext.domain === 'production') {
    if (q.includes('compare') || q.includes('yesterday') || q.includes('कालशी तुलना') || q.includes('कल से तुलना')) {
      return { intent: 'PRODUCTION_FOLLOWUP_COMPARE', confidence: 0.95 };
    }
    if (q.includes('which machine') || q.includes('highest') || q.includes('most') || q.includes('top machine') || q.includes('कोणत्या मशीनने')) {
      return { intent: 'PRODUCTION_FOLLOWUP_MACHINE', confidence: 0.95 };
    }
  }

  // 9. Action Requests (Write Operations requiring confirmation)
  if (q.includes('create dispatch') || q.includes('create sale') || q.includes('send reminder') || q.includes('generate invoice')) {
    return { intent: 'ACTION_WRITE_REQUEST', confidence: 0.95 };
  }

  // 10. Receivables / Overdue Accounts (English, Hindi, Marathi)
  if (
    q.includes('overdue') || q.includes('due') || q.includes('unpaid') || q.includes('debt') ||
    q.includes('उधारी') || q.includes('बाकी') || q.includes('बकाया') || q.includes('पैसे')
  ) {
    if (q.includes('owes the most') || q.includes('highest')) {
      return { intent: 'RECEIVABLES_FOLLOWUP_HIGHEST', confidence: 0.95 };
    }
    return { intent: 'RECEIVABLES', confidence: 0.9 };
  }

  // 11. Production Today
  if (
    q.includes('production') || q.includes('output') || q.includes('ppd') || q.includes('crate') ||
    q.includes('उत्पादन') || q.includes('क्रेट') || q.includes('माल')
  ) {
    if (q.includes('machine') && (q.includes('which') || q.includes('most') || q.includes('highest'))) {
      return { intent: 'PRODUCTION_FOLLOWUP_MACHINE', confidence: 0.95 };
    }
    if (q.includes('compare') || q.includes('yesterday')) {
      return { intent: 'PRODUCTION_FOLLOWUP_COMPARE', confidence: 0.95 };
    }
    return { intent: 'PRODUCTION_TODAY', confidence: 0.9 };
  }

  // 12. Raw Materials / Low Stock
  if (
    q.includes('raw material') || q.includes('stock') || q.includes('granule') || q.includes('polymer') ||
    q.includes('hdpe') || q.includes('कच्चा माल') || q.includes('साठा') || q.includes('मटेरियल')
  ) {
    return { intent: 'RAW_MATERIALS', confidence: 0.9 };
  }

  // 13. Invoices & Billing
  if (q.includes('invoice') || q.includes('bill') || q.includes('बिल') || q.includes('पावती') || q.includes('चलान')) {
    return { intent: 'INVOICES', confidence: 0.9 };
  }

  // 14. Machines & Maintenance
  if (q.includes('machine') || q.includes('breakdown') || q.includes('downtime') || q.includes('मशीन') || q.includes('बिघाड')) {
    return { intent: 'MACHINES', confidence: 0.9 };
  }

  // 15. Dispatches & Logistics
  if (q.includes('dispatch') || q.includes('delivery') || q.includes('vehicle') || q.includes('truck') || q.includes('गाडी') || q.includes('डिलिव्हरी')) {
    return { intent: 'DISPATCH', confidence: 0.9 };
  }

  // 16. Sales & Revenue
  if (q.includes('sales') || q.includes('revenue') || q.includes('income') || q.includes('कमाई') || q.includes('विक्री')) {
    return { intent: 'SALES', confidence: 0.9 };
  }

  // 17. Infrastructure & Server Telemetry
  if (q.includes('health') || q.includes('server') || q.includes('latency') || q.includes('status') || q.includes('grafana') || q.includes('prometheus') || q.includes('5xx')) {
    return { intent: 'OBSERVABILITY', confidence: 0.9 };
  }

  // 18. Default Conversational Fallback
  return { intent: 'CONVERSATIONAL_FALLBACK', confidence: 0.5 };
}

module.exports = { classifyIntent };
