import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, retry, map, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  message?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  timestamp: number;
  rawResponse?: any;
}

export interface PaymentIntent {
  saleId: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'RAZORPAY' | 'UPI' | 'CARD' | 'CASH' | 'CHEQUE';
  customerDetails?: {
    id?: string | number;
    name: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentStatusSubject = new BehaviorSubject<PaymentResult | null>(null);
  paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Process a payment through the unified payment gateway
   * @param intent Payment details
   * @returns Observable of PaymentResult
   */
  processPayment(intent: PaymentIntent): Observable<PaymentResult> {
    // Emit processing status
    this.paymentStatusSubject.next({
      success: false,
      status: 'PENDING',
      timestamp: Date.now(),
      message: 'Processing payment...'
    });

    // Determine payment method and route accordingly
    if (intent.paymentMethod === 'RAZORPAY') {
      return this.processRazorpayPayment(intent);
    } else if (intent.paymentMethod === 'UPI') {
      return this.processUpiPayment(intent);
    } else if (intent.paymentMethod === 'CARD') {
      return this.processCardPayment(intent);
    } else {
      // Default to offline payment recording
      return this.recordOfflinePayment(intent);
    }
  }

  /**
   * Process Razorpay payment
   */
  private processRazorpayPayment(intent: PaymentIntent): Observable<PaymentResult> {
    return this.http.post<any>(`${environment.apiUrl}/sales/${intent.saleId}/checkout/order`, {
      requestedAmount: intent.amount
    }).pipe(
      timeout(15000), // 15 second timeout
      retry(2),
      switchMap(orderResponse => {
        if (!orderResponse.order_id) {
          throw new Error('Invalid order response from Razorpay');
        }

        // Prepare Razorpay options
        const options = {
          "key": (environment as any).razorpayKeyId || 'rzp_test_placeholder',
          "amount": orderResponse.amount,
          "currency": orderResponse.currency,
          "name": "Futane Agro Industries",
          "description": `Payment for Sales Invoice #${intent.saleId}`,
          "order_id": orderResponse.order_id,
          "handler": (response: any) => {
            return this.verifyRazorpayPayment(response, intent.saleId, intent.amount);
          },
          "prefill": {
            "name": intent.customerDetails?.name || '',
            "email": intent.customerDetails?.email || '',
            "contact": intent.customerDetails?.phone || ''
          },
          "theme": { "color": "#D97706" },
          "modal": {
            "ondismiss": () => {
              this.paymentStatusSubject.next({
                success: false,
                status: 'FAILED',
                timestamp: Date.now(),
                message: 'Payment cancelled by user'
              });
            }
          }
        };

        // Return observable that resolves when payment is completed
        return new Observable<PaymentResult>(observer => {
          // Load Razorpay script if not already loaded
          if (typeof (window as any).Razorpay === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
              this.initializeRazorpay(options, observer, intent);
            };
            script.onerror = () => {
              observer.error(new Error('Failed to load Razorpay script'));
              observer.complete();
            };
            document.body.appendChild(script);
          } else {
            this.initializeRazorpay(options, observer, intent);
          }
        });
      }),
      catchError(error => {
        console.error('Razorpay payment error:', error);
        const failRes: PaymentResult = {
          success: false,
          status: 'FAILED',
          timestamp: Date.now(),
          message: error.message || 'Payment processing failed',
          rawResponse: error
        };
        this.paymentStatusSubject.next(failRes);
        return of(failRes);
      })
    );
  }

  /**
   * Initialize Razorpay payment modal
   */
  private initializeRazorpay(options: any, observer: any, intent: PaymentIntent) {
    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      // Clear any existing handlers
      rzp.removeAllListeners('payment.failed');
      rzp.removeAllListeners('payment.success');

      rzp.on('payment.failed', (response: any) => {
        observer.next({
          success: false,
          status: 'FAILED',
          timestamp: Date.now(),
          message: 'Payment failed',
          rawResponse: response
        });
        observer.complete();
      });

      rzp.on('payment.success', (response: any) => {
        // Verify payment with backend
        this.verifyRazorpayPayment(response, intent.saleId, intent.amount)
          .subscribe({
            next(result) {
              observer.next(result);
              observer.complete();
            },
            error(error) {
              observer.next({
                success: false,
                status: 'FAILED',
                timestamp: Date.now(),
                message: 'Payment verification failed',
                rawResponse: error.error
              });
              observer.complete();
            }
          });
      });
    } catch (error) {
      observer.error(error);
      observer.complete();
    }
  }

  /**
   * Verify Razorpay payment with backend
   */
  private verifyRazorpayPayment(razorpayResponse: any, saleId: string, amount: number): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${environment.apiUrl}/sales/checkout/verify`, {
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      saleId: saleId,
      amount: amount
    }).pipe(
      map(result => {
        this.paymentStatusSubject.next({
          ...result,
          success: result.status === 'SUCCESS',
          timestamp: Date.now()
        });
        return result;
      }),
      catchError(error => {
        console.error('Payment verification error:', error);
        const errorResult: PaymentResult = {
          success: false,
          status: 'FAILED',
          timestamp: Date.now(),
          message: error.error?.message || 'Payment verification failed'
        };
        this.paymentStatusSubject.next(errorResult);
        return of(errorResult);
      })
    );
  }

  /**
   * Process UPI payment (generates QR code and records payment manually)
   */
  private processUpiPayment(intent: PaymentIntent): Observable<PaymentResult> {
    const upiResult: PaymentResult = {
      success: true,
      status: 'PENDING',
      transactionId: `UPI_${Date.now()}`,
      amount: intent.amount,
      message: 'UPI QR generated. Please complete payment manually.',
      timestamp: Date.now()
    };
    return of(upiResult).pipe(
      tap(result => this.paymentStatusSubject.next(result))
    );
  }

  /**
   * Process card payment (placeholder for future integration)
   */
  private processCardPayment(_intent: PaymentIntent): Observable<PaymentResult> {
    const cardResult: PaymentResult = {
      success: false,
      status: 'FAILED',
      timestamp: Date.now(),
      message: 'Card payment not yet implemented'
    };
    return of(cardResult).pipe(
      tap(result => this.paymentStatusSubject.next(result))
    );
  }

  /**
   * Record offline payment (cash, cheque, etc.)
   */
  private recordOfflinePayment(intent: PaymentIntent): Observable<PaymentResult> {
    const paymentData = {
      party: { id: intent.customerDetails?.id }, // This would need to be resolved
      amountReceived: intent.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: intent.paymentMethod === 'CASH' ? 'Cash' :
                   intent.paymentMethod === 'CHEQUE' ? 'Cheque' : 'Other',
      invoiceNo: intent.saleId ? `INV-${intent.saleId}` : '',
      notes: intent.notes || `Offline ${intent.paymentMethod} payment`
    };

    return this.http.post<any>(`${environment.apiUrl}/payments`, paymentData).pipe(
      retry(2),
      map(result => {
        const paymentResult: PaymentResult = {
          success: true,
          status: 'SUCCESS',
          transactionId: result?.id ? String(result.id) : (result?.transactionId || `OFFLINE_${Date.now()}`),
          amount: intent.amount,
          message: `${intent.paymentMethod} payment recorded successfully`,
          timestamp: Date.now(),
          rawResponse: result
        };
        this.paymentStatusSubject.next(paymentResult);
        return paymentResult;
      }),
      catchError(error => {
        console.error('Offline payment recording error:', error);
        const errorResult: PaymentResult = {
          success: false,
          status: 'FAILED',
          timestamp: Date.now(),
          message: error.error?.message || 'Failed to record payment'
        };
        this.paymentStatusSubject.next(errorResult);
        return of(errorResult);
      })
    );
  }

  /**
   * Get payment status observable
   */
  getPaymentStatus(): Observable<PaymentResult | null> {
    return this.paymentStatusSubject.asObservable();
  }

  /**
   * Reset payment status
   */
  resetPaymentStatus() {
    this.paymentStatusSubject.next(null);
  }

  /**
   * Generate payment receipt
   */
  generateReceipt(sale: any, paidAmount: number, paymentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/payments/receipt/${paymentId}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Receipt generation error:', error);
        // Fallback to client-side receipt generation
        return of(new Blob([this.generateFallbackReceipt(sale, paidAmount, paymentId)], {
          type: 'application/pdf'
        }));
      })
    );
  }

  /**
   * Generate fallback receipt (client-side)
   */
  private generateFallbackReceipt(sale: any, paidAmount: number, paymentId: string): string {
    // This would typically use jsPDF to generate a PDF
    // For now, return a simple text representation
    return `
    FUTANE AGRO INDUSTRIES PVT. LTD.
    ---------------------------------------
    Receipt No: RZP-${paymentId}
    Date: ${new Date().toLocaleDateString()}
    Invoice Ref: ${sale.saleId}
    Customer: ${sale.party?.partyName}
    ---------------------------------------
    Total Amount: ₹${sale.totalAmount}
    Amount Paid: ₹${paidAmount}
    Balance Due: ₹${sale.remaining - paidAmount}
    ---------------------------------------
    Thank you for your business!
    `;
  }
}