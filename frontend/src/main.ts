import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

if (typeof (window as any) !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// Enterprise Anti-Tampering & Self-XSS Security Banner
if (typeof window !== 'undefined') {
  console.log(
    '%c⛔ STOP! ENTERPRISE SECURITY DIRECTIVE',
    'color: #ff3344; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 2.2rem; font-weight: 900; -webkit-text-stroke: 1px black;'
  );
  console.log(
    '%cThis console is an internal browser debugging environment. Pasting scripts, malicious tokens, or automated commands here will compromise your Futane Agro ERP credentials and violate company data security policy. Zero-Trust audit monitors all execution.',
    'color: #e6edf3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 1.1rem; line-height: 1.5; background: #161b22; padding: 10px; border-radius: 6px; border-left: 4px solid #ff3344;'
  );
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

