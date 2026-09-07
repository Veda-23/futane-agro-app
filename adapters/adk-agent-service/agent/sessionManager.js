/**
 * Per-Session & Per-User Isolated Conversational Memory Manager
 * Ensures User A and User B never share chat history, tool results, or context.
 */

class SessionManager {
  constructor() {
    this.sessions = new Map();
    // Cleanup sessions older than 2 hours
    setInterval(() => this.cleanupExpiredSessions(), 30 * 60 * 1000);
  }

  getSessionKey(userId, conversationId) {
    const uId = userId || 'anonymous';
    const cId = conversationId || 'default-session';
    return `${uId}:${cId}`;
  }

  getSession(userId, conversationId) {
    const key = this.getSessionKey(userId, conversationId);
    if (!this.sessions.has(key)) {
      this.sessions.set(key, {
        userId,
        conversationId,
        messages: [],
        firstUserQuestion: null,
        lastContext: null, // Stores { domain: 'production' | 'sales' | 'receivables' | 'machines' | 'inventory', data: ... }
        lastActivity: Date.now()
      });
    }
    const session = this.sessions.get(key);
    session.lastActivity = Date.now();
    return session;
  }

  addMessage(userId, conversationId, role, content, tool = null, actionProposal = null) {
    const session = this.getSession(userId, conversationId);

    if (role === 'user' && !session.firstUserQuestion) {
      session.firstUserQuestion = content;
    }

    session.messages.push({
      role,
      content,
      tool,
      actionProposal,
      timestamp: new Date().toISOString()
    });

    // Bound memory to last 10 messages to avoid token blowup & preserve relevance
    if (session.messages.length > 10) {
      session.messages = session.messages.slice(-10);
    }
  }

  setContext(userId, conversationId, domain, data) {
    const session = this.getSession(userId, conversationId);
    session.lastContext = {
      domain,
      data,
      timestamp: Date.now()
    };
  }

  getContext(userId, conversationId) {
    const session = this.getSession(userId, conversationId);
    return session.lastContext;
  }

  clearSession(userId, conversationId) {
    const key = this.getSessionKey(userId, conversationId);
    this.sessions.delete(key);
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActivity > TWO_HOURS) {
        this.sessions.delete(key);
      }
    }
  }
}

module.exports = new SessionManager();
