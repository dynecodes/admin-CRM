// src/types/giftcards.ts

export type GiftcardStatus = "active" | "redeemed" | "cancelled" | "archived";

export type GiftcardAmountOption = {
  value: number;
  label: string;
};

export type GiftcardSettings = {
  companyName: string;
  id: number;
  amountOptions: number[]; // e.g., [150, 200, 250, 300, 350, 400, 450, 500]
  allowCustomAmount: boolean;
  customAmountMin?: number;
  customAmountMax?: number;
  defaultMessage: string;
  backgroundImage?: string;
  showDiscountCode: boolean;
  embedCode?: string;
  shareableLink?: string;
  created_at?: string;
  updated_at?: string;
};

export type GiftcardPurchase = {
  redeemDate: any;
  id: number;
  code: string; // e.g., "XXXX-XXXX-XXXX"
  sender: string; // Person who purchased
  senderEmail: string;
  recipient: string; // Person receiving the gift card
  recipientEmail: string;
  message?: string;
  amount: number; // Amount purchased
  balance: number; // Remaining balance
  status: GiftcardStatus;
  purchaseDate: string; // ISO date
  expirationDate?: string | null; // ISO date
  transactionId?: string;
  // Redemption tracking
  redemptions?: GiftcardRedemption[];
  created_at: string;
  updated_at: string;
};

export type GiftcardRedemption = {
  id: number;
  giftcardId: number;
  bookingId?: number;
  amount: number; // Amount redeemed
  redeemedAt: string; // ISO date
  redeemedBy?: string; // Customer name
};

export type GiftcardFormData = {
  amount: number;
  recipient: string;
  recipientEmail: string;
  sender: string;
  senderEmail: string;
  message: string;
};

export type GiftcardPurchaseDetails = {
  sender: string;
  resident: string;
  purchaseDetails: {
    balance: number;
    amountPurchased: number;
    dateOfPurchase: string;
  };
  transactionId: string;
  code: string;
};
