import type { Package, Tier } from '../types';
import { uid } from './storage';

export const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_EXYDEMOKEY01';

export const PACKAGES: Package[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    cadence: 'forever',
    ads: '1 active ad / month',
    photos: 'Up to 3 photos',
    video: 'No video embed',
    perks: ['Standard listing placement', 'Basic buyer chat', 'Phone privacy masking'],
    cta: 'Start free',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 200,
    cadence: 'one-time',
    ads: '3 active ads',
    photos: 'Up to 4 photos',
    video: '1 social video embed',
    perks: ['Reel / Short embed on hero', 'UNTick ticker eligibility', 'Seller analytics dashboard'],
    cta: 'Buy Standard',
    highlight: true,
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    price: 1000,
    cadence: 'per quarter',
    ads: '10 active ads',
    photos: 'Unlimited photos',
    video: 'Full multimedia access',
    perks: [
      'Priority search ranking',
      'Featured in UNTick ticker',
      'Urgency + popularity badges',
      'Advanced impression analytics',
    ],
    cta: 'Buy Comprehensive',
  },
  {
    id: 'dealer',
    name: 'Dealer / Storefront',
    price: -1,
    adminPriced: true,
    cadence: 'custom',
    ads: 'Unlimited inventory',
    photos: 'Unlimited multimedia',
    video: 'Bulk reel ingestion',
    perks: [
      'Custom storefront URL (brand.exy.com)',
      'Verified Business badge',
      'Dedicated account manager',
      'Bulk CSV + reel importer',
    ],
    cta: 'Contact Admin',
  },
];

export const TIER_LIMITS: Record<Tier, { ads: number; photos: number; videos: number }> = {
  free: { ads: 1, photos: 3, videos: 0 },
  standard: { ads: 3, photos: 4, videos: 1 },
  comprehensive: { ads: 10, photos: 20, videos: 10 },
  dealer: { ads: 9999, photos: 99, videos: 99 },
};

export type PayMethod = 'upi-gpay' | 'upi-phonepe' | 'upi-paytm' | 'upi-id' | 'netbanking' | 'card';

export interface PaymentResult {
  ok: boolean;
  orderId: string;
  paymentId: string;
  method: PayMethod;
  amount: number;
  tier: Tier;
  at: string;
}

/**
 * Mock Razorpay order creation. In production this hits POST /api/orders
 * on the server which calls razorpay.orders.create with the secret key.
 */
export function createOrder(tier: Tier, amount: number): {
  orderId: string;
  keyId: string;
  amount: number;
  notes: { tier: Tier };
} {
  return { orderId: uid('order'), keyId: RAZORPAY_KEY_ID, amount: amount * 100, notes: { tier } };
}

/** Mock checkout handshake — resolves like the Razorpay success callback. */
export function processPayment(
  tier: Tier,
  amount: number,
  method: PayMethod,
): Promise<PaymentResult> {
  const { orderId } = createOrder(tier, amount);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        orderId,
        paymentId: uid('pay'),
        method,
        amount,
        tier,
        at: new Date().toISOString(),
      });
    }, 1400);
  });
}

export function tierExpiry(tier: Tier): string | null {
  const now = new Date();
  if (tier === 'free') return null;
  if (tier === 'standard') now.setMonth(now.getMonth() + 1);
  if (tier === 'comprehensive') now.setMonth(now.getMonth() + 3);
  if (tier === 'dealer') now.setFullYear(now.getFullYear() + 1);
  return now.toISOString();
}
