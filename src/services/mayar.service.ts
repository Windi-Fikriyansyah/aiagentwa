import { logger } from '../utils/logger';

export interface FollowUpTask {
  transactionId: string;
  customerName: string;
  customerMobile: string; // JID formatted
  productName: string;
  amount: number;
  paymentUrl: string;
}

export class MayarService {
  private apiKey: string | undefined;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private onFollowUpRequired: ((task: FollowUpTask) => Promise<void>) | null = null;
  private queue: FollowUpTask[] = [];
  private queueTimer: NodeJS.Timeout | null = null;

  constructor() {
    // No more single API key
  }

  setFollowUpHandler(handler: (task: FollowUpTask) => Promise<void>) {
    this.onFollowUpRequired = handler;
  }

  startCron(intervalMs: number = 15 * 60 * 1000) {
    logger.info(`Starting multi-tenant Mayar cron every ${intervalMs}ms`);
    this.intervalId = setInterval(() => {
      this.fetchAndProcessUnpaidTransactions();
    }, intervalMs);
    
    // Process queue every 15 seconds to avoid spam/rate-limiting
    this.queueTimer = setInterval(() => {
      this.processNextInQueue();
    }, 15000);

    // Initial run after 5 seconds
    setTimeout(() => this.fetchAndProcessUnpaidTransactions(), 5000);
  }

  stopCron() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.queueTimer) clearInterval(this.queueTimer);
  }

  private async fetchAndProcessUnpaidTransactions() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      logger.info('Fetching Mayar API keys from database...');
      const usersRes = await fetch('http://localhost:3000/api/cron/mayar-users', {
        headers: { 'x-internal-auth': 'true' }
      });
      
      if (!usersRes.ok) {
        throw new Error('Failed to fetch Mayar users from internal API');
      }
      
      const { users } = await usersRes.json();
      if (!users || users.length === 0) {
        logger.info('No active users with Mayar API Keys found.');
        return;
      }

      for (const user of users) {
        try {
          logger.info(`Fetching unpaid transactions for user ${user.id}...`);
          const response = await fetch('https://api.mayar.id/hl/v1/transactions/unpaid?page=1&pageSize=50', {
            headers: {
              'Authorization': `Bearer ${user.mayarApiKey}`
            }
          });

          if (!response.ok) {
            logger.warn(`Mayar API Error for user ${user.id}: ${response.status} ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          if (data.statusCode === 200 && data.data && data.data.length > 0) {
            // Fetch paid transactions for validation
            logger.info(`Fetching paid transactions for validation for user ${user.id}...`);
            const paidResponse = await fetch('https://api.mayar.id/hl/v1/transactions?page=1&pageSize=50', {
              headers: {
                'Authorization': `Bearer ${user.mayarApiKey}`
              }
            });
            
            const paidEmails = new Set<string>();
            const paidMobiles = new Set<string>();
            
            if (paidResponse.ok) {
              const paidData = await paidResponse.json();
              if (paidData.statusCode === 200 && paidData.data) {
                for (const trx of paidData.data) {
                  if (trx.customer?.email) paidEmails.add(trx.customer.email.toLowerCase());
                  if (trx.customer?.mobile) paidMobiles.add(trx.customer.mobile);
                }
              }
            }

            // Filter unpaid transactions: remove those who already have a paid transaction
            const validUnpaidTransactions = data.data.filter((trx: any) => {
              const email = trx.customer?.email?.toLowerCase();
              const mobile = trx.customer?.mobile;
              
              if (email && paidEmails.has(email)) return false;
              if (mobile && paidMobiles.has(mobile)) return false;
              
              return true;
            });

            logger.info(`Found ${validUnpaidTransactions.length} valid unpaid transactions out of ${data.data.length} after paid validation.`);
            await this.processTransactions(validUnpaidTransactions);
          }
        } catch (err: any) {
          logger.error(`Failed to process Mayar user ${user.id}`, { error: err.message });
        }
      }
    } catch (error: any) {
      logger.error('Failed to run multi-tenant Mayar cron', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTransactions(transactions: any[]) {
    for (const trx of transactions) {
      if (trx.status !== 'active') continue;

      try {
        // Check if transaction exists via API
        const checkRes = await fetch(`http://localhost:3000/api/mayar-transactions?id=${trx.id}`);
        const checkData = await checkRes.json();

        if (!checkRes.ok || !checkData.exists) {
          // Create new via API
          await fetch('http://localhost:3000/api/mayar-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              transaction: {
                id: trx.id,
                customerId: trx.customerId || '',
                customerName: trx.customer?.name || 'Customer',
                customerEmail: trx.customer?.email,
                customerMobile: trx.customer?.mobile || '',
                amount: trx.amount || 0,
                status: trx.status,
                paymentUrl: trx.paymentUrl || '',
                paymentLinkId: trx.paymentLinkId || '',
                productName: trx.paymentLink?.name || 'Produk',
                type: trx.type || '',
                createdAt: new Date(trx.createdAt),
              }
            })
          });
          
          // Calculate time difference
          const now = new Date();
          const trxDate = new Date(trx.createdAt);
          const diffMs = now.getTime() - trxDate.getTime();
          const isOlderThan15Mins = diffMs >= 15 * 60 * 1000;

          if (isOlderThan15Mins) {
            this.addToQueue(trx);
          }
        } else {
          // Logic for existing transactions in DB
          const existing = checkData.transaction;
          if (existing.followUpCount < 3) {
            const now = new Date();
            const lastFollowUp = existing.lastFollowUpAt ? new Date(existing.lastFollowUpAt) : new Date(existing.createdAt);
            
            if (existing.followUpCount === 0) {
              // It was stored previously but was too new to follow up. Let's check if 15 mins have passed
              const diffMs = now.getTime() - lastFollowUp.getTime();
              if (diffMs >= 15 * 60 * 1000) {
                this.addToQueue(trx);
              }
            } else {
              // 2nd or 3rd follow up (Wait 24 hours between them)
              const diffHours = (now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60);
              if (diffHours >= 24) { 
                this.addToQueue(trx);
              }
            }
          }
        }
      } catch (err: any) {
        logger.error(`Error processing transaction ${trx.id}`, { error: err.message });
      }
    }
  }

  private addToQueue(trx: any) {
    const mobile = trx.customer?.mobile;
    if (!mobile) return;

    let formattedPhone = mobile.replace(/\D/g, ''); // Remove non-numeric
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }
    if (!formattedPhone.endsWith('@s.whatsapp.net')) {
      formattedPhone += '@s.whatsapp.net';
    }

    const task: FollowUpTask = {
      transactionId: trx.id,
      customerName: trx.customer?.name || 'Kak',
      customerMobile: formattedPhone,
      productName: trx.paymentLink?.name || 'Pesanan',
      amount: trx.amount || 0,
      paymentUrl: trx.paymentUrl || ''
    };

    // Check if already in queue
    if (!this.queue.find(q => q.transactionId === task.transactionId)) {
      this.queue.push(task);
      logger.info(`Added transaction ${task.transactionId} to follow-up queue`, { phone: task.customerMobile });
    }
  }

  private async processNextInQueue() {
    if (this.queue.length === 0 || !this.onFollowUpRequired) return;

    const task = this.queue.shift();
    if (task) {
      try {
        await this.onFollowUpRequired(task);
        
        // Update DB via API
        await fetch('http://localhost:3000/api/mayar-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'incrementFollowUp',
            id: task.transactionId
          })
        });
      } catch (error: any) {
        logger.error(`Failed to process follow-up for ${task.transactionId}`, { error: error.message });
        // Optionally put back in queue or handle differently
      }
    }
  }
}
