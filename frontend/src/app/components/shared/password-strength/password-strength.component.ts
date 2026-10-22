import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Password Entropy & Complexity Feedback Bar (`app-password-strength`).
 *
 * Evaluates password entropy against enterprise security policies:
 * - Minimum 8 characters (and bonus for 12+ characters).
 * - Uppercase letters (`[A-Z]`), numeric digits (`[0-9]`), and special symbols.
 * - Displays a multi-stage colored progress bar (Weak/Red, Fair/Amber, Good/Blue, Strong/Emerald)
 *   with actionable hints for operator credential updates.
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="password" class="password-strength-container">
      <div class="strength-bar">
        <div class="strength-fill"
             [style.width]="strength.width"
             [style.background]="strength.color"></div>
      </div>
      <div class="strength-labels">
        <span [style.color]="strength.color" style="font-size:11px; font-weight:600;">
          {{ strength.level }}
        </span>
        <span style="font-size:11px; color:var(--text-secondary);">
          {{ strength.tips }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .password-strength-container { margin-top: 6px; }
    .strength-bar {
      height: 5px; border-radius: 3px;
      background: rgba(255,255,255,0.1); overflow: hidden; margin-bottom: 4px;
    }
    .strength-fill {
      height: 100%; border-radius: 3px;
      transition: width 0.3s ease, background 0.3s ease;
    }
    .strength-labels { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class PasswordStrengthComponent {
  @Input() password = '';

  get strength(): { level: string; color: string; width: string; tips: string } {
    if (!this.password) return { level: '', color: 'transparent', width: '0%', tips: '' };
    let score = 0;
    const tips: string[] = [];
    if (this.password.length >= 8) score++; else tips.push('8+ chars');
    if (this.password.length >= 12) score++;
    if (/[A-Z]/.test(this.password)) score++; else tips.push('uppercase');
    if (/[0-9]/.test(this.password)) score++; else tips.push('number');
    if (/[^A-Za-z0-9]/.test(this.password)) score++; else tips.push('symbol');
    const tipStr = tips.length ? `Add: ${tips.join(', ')}` : 'Strong password';
    if (score <= 2) return { level: 'Weak', color: '#ef4444', width: '25%', tips: tipStr };
    if (score === 3) return { level: 'Fair', color: '#f59e0b', width: '55%', tips: tipStr };
    if (score === 4) return { level: 'Good', color: '#3b82f6', width: '80%', tips: tipStr };
    return { level: 'Strong', color: '#10b981', width: '100%', tips: tipStr };
  }
}
