// ---------------------------------------------------------------------------
// Wallet + simulated payment gateway with escrow.
//
// There is no real payment processor — card entry is validated shape-only and
// "charged" instantly, mirroring the app's simulated-OTP approach. The wallet
// is a pure append-only ledger: a user's balance is the sum of their txn
// amounts (credits +, debits −). Money for a booking is held in escrow on the
// Job itself (paymentStatus / escrowAmount) and only paid out to the pro's
// wallet once the job is completed — or refunded if it's cancelled.
// ---------------------------------------------------------------------------

import { db, notify, logAudit } from './db'
import { uid } from './utils'
import type { Job, WalletTxn, WalletTxnKind, PaymentMethod } from './types'

/** Current wallet balance = sum of all ledger entries for the user. */
export async function getBalance(userId: string): Promise<number> {
  const txns = await db.walletTxns.where('userId').equals(userId).toArray()
  return txns.reduce((sum, t) => sum + t.amount, 0)
}

export function listTxns(userId: string) {
  return db.walletTxns.where('userId').equals(userId).reverse().sortBy('createdAt')
}

async function record(
  userId: string,
  kind: WalletTxnKind,
  amount: number,
  note: string,
  jobId?: string,
): Promise<WalletTxn> {
  const txn: WalletTxn = { id: uid('wtx'), userId, kind, amount, note, jobId, createdAt: Date.now() }
  await db.walletTxns.add(txn)
  return txn
}

/** Add money to a wallet (simulated top-up). */
export async function addFunds(userId: string, amount: number, note = 'Wallet top-up') {
  if (amount <= 0) throw new Error('Enter a valid amount')
  await record(userId, 'topup', amount, note)
}

/** Withdraw earnings out of a wallet (to a bank — simulated). */
export async function withdraw(userId: string, amount: number) {
  if (amount <= 0) throw new Error('Enter a valid amount')
  const balance = await getBalance(userId)
  if (amount > balance) throw new Error('Insufficient balance')
  await record(userId, 'withdrawal', -amount, 'Withdrawal to bank account')
}

/** Basic shape validation for the simulated card form. */
export function validateCard(card: { number: string; expiry: string; cvv: string }): string | null {
  const digits = card.number.replace(/\s+/g, '')
  if (!/^\d{16}$/.test(digits)) return 'Enter a valid 16-digit card number'
  if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Expiry must be MM/YY'
  if (!/^\d{3}$/.test(card.cvv)) return 'CVV must be 3 digits'
  return null
}

/**
 * Pay for a booking and hold the funds in escrow. Card payments are simulated
 * (no wallet movement); wallet payments debit the customer's wallet. Either way
 * the escrow is recorded on the job and the pro is notified.
 */
export async function payForJob(
  job: Job,
  method: PaymentMethod,
  customer: { id: string; name: string },
): Promise<void> {
  if (job.paymentStatus === 'in_escrow' || job.paymentStatus === 'released') {
    throw new Error('This booking is already paid')
  }
  const amount = job.escrowAmount ?? job.estimatedPrice

  if (method === 'wallet') {
    const balance = await getBalance(customer.id)
    if (amount > balance) throw new Error('Insufficient wallet balance')
    await record(customer.id, 'escrow_hold', -amount, `Payment for "${job.title}"`, job.id)
  }
  // card / upi: simulated external charge — no wallet ledger entry for the customer.

  await db.jobs.update(job.id, {
    paymentStatus: 'in_escrow',
    escrowAmount: amount,
    paymentMethod: method,
    paidAt: Date.now(),
  })

  if (job.studentId) {
    const student = await db.students.get(job.studentId)
    if (student) {
      await notify(
        student.userId,
        'Payment secured',
        `₹${amount.toLocaleString('en-IN')} for "${job.title}" is held in escrow and will be released when you complete the job.`,
        'success',
      )
    }
  }
  await logAudit(customer.id, customer.name, 'pay_booking', job.id, `${method} · ₹${amount}`)
}

/**
 * Release escrow to the pro's wallet once a job is completed. Safe to call
 * unconditionally — it no-ops unless funds are actually held in escrow.
 */
export async function releaseEscrow(job: Job): Promise<void> {
  if (job.paymentStatus !== 'in_escrow') return
  const amount = job.escrowAmount ?? 0
  await db.jobs.update(job.id, { paymentStatus: 'released' })
  if (amount > 0 && job.studentId) {
    const student = await db.students.get(job.studentId)
    if (student) {
      await record(student.userId, 'payout', amount, `Earnings from "${job.title}"`, job.id)
      await notify(
        student.userId,
        'You got paid! 💰',
        `₹${amount.toLocaleString('en-IN')} for "${job.title}" has been added to your wallet.`,
        'success',
        '/student/wallet',
      )
    }
  }
}

/**
 * Refund escrow back to the customer on cancellation. Wallet-funded payments
 * are credited back to the customer's wallet; card payments are marked refunded.
 */
export async function refundEscrow(job: Job): Promise<void> {
  if (job.paymentStatus !== 'in_escrow') return
  const amount = job.escrowAmount ?? 0
  await db.jobs.update(job.id, { paymentStatus: 'refunded' })
  if (amount > 0 && job.paymentMethod === 'wallet') {
    await record(job.customerId, 'refund', amount, `Refund for "${job.title}"`, job.id)
  }
  await notify(
    job.customerId,
    'Payment refunded',
    `₹${amount.toLocaleString('en-IN')} for "${job.title}" has been refunded.`,
    'info',
  )
}
