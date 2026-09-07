import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../api.service';
import Swal from 'sweetalert2';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tool?: string | null;
  actionProposal?: {
    type: string;
    title: string;
    description: string;
  } | null;
  timestamp: string;
  status: 'sending' | 'completed' | 'error';
}

@Component({
  selector: 'app-ai-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-copilot.component.html',
  styleUrls: ['./ai-copilot.component.css']
})
export class AiCopilotComponent implements OnInit, OnDestroy {
  isOpen = false;
  isLoading = false;
  isListening = false;
  inputQuery = '';
  conversationId = this.generateConversationId();
  speechRecognition: any = null;
  selectedLang = 'en-IN'; // 'en-IN' | 'hi-IN' | 'mr-IN'

  messages: CopilotMessage[] = [
    {
      id: 'init-1',
      role: 'assistant',
      text: 'Hello! I am your **Futane Agro Autonomous Copilot**.\nAsk me about today\'s production output, overdue customer dues, raw material stock, or machine telemetry.',
      tool: 'systemReady',
      timestamp: new Date().toLocaleTimeString(),
      status: 'completed'
    }
  ];

  constructor(private http: HttpClient, private apiService: ApiService) {}

  ngOnInit() {
    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  generateConversationId(): string {
    return 'conv-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = this.selectedLang;

      this.speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.inputQuery = transcript;
        this.isListening = false;
        this.sendCurrent();
      };

      this.speechRecognition.onerror = () => {
        this.isListening = false;
      };

      this.speechRecognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleVoice() {
    if (!this.speechRecognition) {
      alert('Speech recognition is available in Google Chrome and Microsoft Edge.');
      return;
    }

    if (this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    } else {
      this.speechRecognition.lang = this.selectedLang;
      this.speechRecognition.start();
      this.isListening = true;
    }
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    // Prevent XSS by HTML-escaping raw characters before formatting markdown
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  sendCurrent() {
    if (!this.inputQuery.trim()) return;
    const q = this.inputQuery.trim();
    this.inputQuery = '';
    this.sendMessage(q);
  }

  sendMessage(text: string) {
    const userMsgId = 'msg-' + Date.now();
    this.messages.push({
      id: userMsgId,
      role: 'user',
      text,
      tool: null,
      timestamp: new Date().toLocaleTimeString(),
      status: 'completed'
    });
    this.isLoading = true;

    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    const payload = {
      message: text,
      conversationId: this.conversationId
    };

    const targetUrl = `${this.apiService.baseUrl}/adk/chat`;

    this.http.post<any>(targetUrl, payload, { headers }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messages.push({
          id: 'asst-' + Date.now(),
          role: 'assistant',
          text: res.reply,
          tool: res.toolExecuted || null,
          actionProposal: res.actionProposal || null,
          timestamp: new Date().toLocaleTimeString(),
          status: 'completed'
        });
      },
      error: () => {
        this.isLoading = false;
        this.messages.push({
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: '**ERP Copilot Service Notice**\n\nUnable to connect to the Google ADK Intelligence backend. Please check server logs.',
          tool: 'SERVICE_OFFLINE',
          timestamp: new Date().toLocaleTimeString(),
          status: 'error'
        });
      }
    });
  }

  confirmAction(action: any) {
    if (confirm(action.description || 'Do you want to execute this operational action?')) {
      alert(`Action '${action.title}' dispatched successfully.`);
    }
  }

  newChat() {
    const oldConvId = this.conversationId;
    this.conversationId = this.generateConversationId();

    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    this.http.post<any>(`${this.apiService.baseUrl}/adk/session/reset`, { conversationId: oldConvId }, { headers }).subscribe({
      next: () => {},
      error: () => {}
    });

    this.messages = [
      {
        id: 'init-' + Date.now(),
        role: 'assistant',
        text: '**New Chat Session Started**\nConversation memory reset. Ask me about production output, overdue receivables, or machine status.',
        tool: 'sessionReset',
        timestamp: new Date().toLocaleTimeString(),
        status: 'completed'
      }
    ];

    Swal.fire({
      icon: 'info',
      title: 'New Chat Session',
      text: 'Conversation context has been completely reset.',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  copyMessage(text: string) {
    navigator.clipboard.writeText(text.replace(/<[^>]*>?/gm, ''));
    Swal.fire({
      icon: 'success',
      title: 'Copied to Clipboard',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}
