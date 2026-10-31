// src/components/giftcards/GiftcardActionsMenu.tsx
import React, { useState } from "react";
import {
  Modal,
  Button,
  Label,
  TextInput,
  Alert,
  Textarea,
  Radio,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "flowbite-react";
import { HiMail, HiX } from "react-icons/hi";
import { GiftcardPurchase } from "../../types/giftcards";
import { useGiftcards } from "../../hooks/useGiftcards";
import { useDraggableModal } from "../../hooks/useDraggableModal";

interface GiftcardActionsMenuProps {
  giftcard: GiftcardPurchase;
  onAction?: (data?: any) => void;
  isExpanded?: boolean;
  onClose?: () => void;
  onCancel: () => void;
}

const GiftcardActionsMenu: React.FC<GiftcardActionsMenuProps> = ({
  giftcard,
  onAction,
  isExpanded = false,
  onClose,
}) => {
  const {
    sendReceipt,
    sendGiftcard,
    refundGiftcard,
    getGiftcardChanges,
    getGiftcardRedemptions,
  } = useGiftcards();

  const [showSendReceipt, setShowSendReceipt] = useState(false);
  const [showSendGiftCard, setShowSendGiftCard] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [showRedemptions, setShowRedemptions] = useState(false);

  const [receiptEmail, setReceiptEmail] = useState(giftcard.senderEmail || "");
  const [giftcardEmail, setGiftcardEmail] = useState(
    giftcard.recipientEmail || "",
  );
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [changes, setChanges] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  // Enable draggable modals
  useDraggableModal(showSendReceipt);
  useDraggableModal(showSendGiftCard);
  useDraggableModal(showRefund);
  useDraggableModal(showChanges);
  useDraggableModal(showRedemptions);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSendReceipt = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendReceipt(giftcard.id, receiptEmail);
      setSuccess("Receipt sent successfully!");
      setTimeout(() => {
        setShowSendReceipt(false);
        onAction?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleSendGiftcard = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendGiftcard(giftcard.id, giftcardEmail);
      setSuccess("Gift card sent successfully!");
      setTimeout(() => {
        setShowSendGiftCard(false);
        onAction?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send gift card");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const amountToRefund =
      refundType === "full" ? giftcard.amount : parseFloat(refundAmount || "0");

    if (refundType === "partial" && (!refundAmount || amountToRefund <= 0)) {
      setError("Please enter a valid refund amount");
      setLoading(false);
      return;
    }

    if (amountToRefund > giftcard.balance) {
      setError("Refund amount cannot exceed the current balance");
      setLoading(false);
      return;
    }

    try {
      await refundGiftcard(
        giftcard.id,
        amountToRefund,
        refundType,
        refundReason,
      );
      setSuccess("Refund processed successfully!");
      setTimeout(() => {
        setShowRefund(false);
        onAction?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  const handleViewChanges = async () => {
    setLoading(true);
    try {
      const data = await getGiftcardChanges(giftcard.id);
      setChanges(data);
      setShowChanges(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRedemptions = async () => {
    setLoading(true);
    try {
      const data = await getGiftcardRedemptions(giftcard.id);
      setRedemptions(data);
      setShowRedemptions(true);
    } finally {
      setLoading(false);
    }
  };

  if (isExpanded) {
    return (
      <>
        {/* Expandable Details View */}
        <div className="space-y-4 rounded-lg border-gray-200 bg-gray-50 p-1">
          {/* Gift Card Information Section */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              Gift Card Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Gift Card Code
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {giftcard.code}
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Purchaser
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {giftcard.sender}
                  </p>
                  <p className="text-xs text-gray-500">
                    {giftcard.senderEmail}
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Recipient
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {giftcard.recipient}
                  </p>
                  <p className="text-xs text-gray-500">
                    {giftcard.recipientEmail}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Original Amount
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {formatCurrency(giftcard.amount)}
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Current Balance
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {formatCurrency(giftcard.balance)}
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-900">
                    Purchase Date
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                    {giftcard.purchaseDate
                      ? formatDate(giftcard.purchaseDate)
                      : "-"}
                  </p>
                </div>

                {giftcard.redeemDate && (
                  <div>
                    <span className="mb-1 block text-sm font-medium text-gray-900">
                      Redeemed Date
                    </span>
                    <p className="mt-1 font-mono text-sm font-semibold text-gray-500">
                      {formatDate(giftcard.redeemDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Available Actions Section */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              Available Actions
            </h3>

            {/* Responsive grid layout */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-1">
              {/* 1️⃣ Send Receipt */}
              <button
                onClick={() => setShowSendReceipt(true)}
                className="flex h-[56px] min-w-[50px] items-center justify-start rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-black">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-1.5 min-w-0">
                  <p className="cursor-pointer text-sm leading-tight font-medium break-words">
                    Send Receipt
                  </p>
                </div>
              </button>

              {/* 2️⃣ Resend Gift Card */}
              <button
                onClick={() => setShowSendGiftCard(true)}
                className="flex h-[56px] min-w-[180px] items-center justify-start rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-black">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div className="ml-1.5 min-w-0">
                  <p className="cursor-pointer text-sm leading-tight font-medium break-words">
                    Resend Gift Card
                  </p>
                </div>
              </button>

              {/* 3️⃣ Refund Purchase */}
              <button
                onClick={() => setShowRefund(true)}
                className="flex h-[56px] min-w-[160px] items-center justify-start rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-black">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                    />
                  </svg>
                </div>
                <div className="ml-1.5 min-w-0">
                  <p className="cursor-pointer text-sm leading-tight font-medium break-words">
                    Refund Purchase
                  </p>
                </div>
              </button>

              {/* 4️⃣ View Changes */}
              <button
                onClick={handleViewChanges}
                className="flex h-[56px] min-w-[170px] items-center justify-start rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-black">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <div className="ml-1.5 min-w-0">
                  <p className="cursor-pointer text-sm leading-tight font-medium break-words">
                    View Changes
                  </p>
                </div>
              </button>

              {/* 5️⃣ View Redemptions */}
              <button
                onClick={handleViewRedemptions}
                className="flex h-[56px] min-w-[160px] items-center justify-start rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-black">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div className="ml-1.5 min-w-0">
                  <p className="cursor-pointer text-sm leading-tight font-medium break-words">
                    View Redemptions
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-300 pt-3">
            <Button
              color="gray"
              onClick={onClose}
              size="xs"
              className="cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

        {/* MODALS WITH DRAGGABLE FEATURE */}

        {/* 1. Send Receipt Modal */}
        <Modal
          show={showSendReceipt}
          onClose={() => setShowSendReceipt(false)}
          size="md"
        >
          <div className="relative rounded-lg bg-white shadow">
            {/* DRAGGABLE HEADER */}
            <div className="modal-drag-handle flex cursor-grab items-start justify-between rounded-t border-b border-gray-300 p-5 select-none active:cursor-grabbing">
              <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
                Send Receipt
              </h3>
              <button
                type="button"
                onClick={() => setShowSendReceipt(false)}
                className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-700">
                Resend the purchaser a paid receipt for their gift card
                purchase.
              </p>
              <p className="text-xs text-gray-500">
                Edit the email sent to the purchaser in Settings &gt; Emails
                &gt; Email Templates &gt; Click the green pencil
              </p>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Gift Card:
                    </span>
                    <span className="font-mono text-gray-900">
                      {giftcard.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Purchaser:
                    </span>
                    <span className="text-gray-900">{giftcard.sender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Amount:</span>
                    <span className="text-gray-900">
                      {formatCurrency(giftcard.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="receiptEmail" className="mb-2 block">
                  Send to Email
                </Label>
                <TextInput
                  id="receiptEmail"
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  icon={HiMail}
                  placeholder="Enter email address"
                  style={{ backgroundColor: "white" }}
                />
              </div>

              {success && <Alert color="success">{success}</Alert>}
              {error && <Alert color="failure">{error}</Alert>}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 rounded-b border-t border-gray-300 p-6">
              <Button
                color="light"
                onClick={() => setShowSendReceipt(false)}
                disabled={loading}
                className="w-33 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleSendReceipt}
                disabled={loading || !receiptEmail}
                className="w-33 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Receipt"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 2. Send Gift Card Modal */}
        <Modal
          show={showSendGiftCard}
          onClose={() => setShowSendGiftCard(false)}
          size="md"
        >
          <div className="relative rounded-lg bg-white shadow">
            {/* DRAGGABLE HEADER */}
            <div className="modal-drag-handle flex cursor-grab items-start justify-between rounded-t border-b border-gray-300 p-5 select-none active:cursor-grabbing">
              <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
                Send Gift Card
              </h3>
              <button
                type="button"
                onClick={() => setShowSendGiftCard(false)}
                className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-700">
                Resend the gift card via email to the recipient.
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>
                  Recipient must use the same email when booking in order for
                  the gift card code to be applied
                </li>
                <li>
                  Edit the email sent to the purchaser in Settings &gt; Emails
                  &gt; Email Templates &gt; Click the green pencil
                </li>
              </ul>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Gift Card:
                    </span>
                    <span className="font-mono text-gray-900">
                      {giftcard.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Recipient:
                    </span>
                    <span className="text-gray-900">{giftcard.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Balance:</span>
                    <span className="text-gray-900">
                      {formatCurrency(giftcard.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">From:</span>
                    <span className="text-gray-900">{giftcard.sender}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="giftcardEmail" className="mb-2 block">
                  Send to Email
                </Label>
                <TextInput
                  id="giftcardEmail"
                  type="email"
                  value={giftcardEmail}
                  onChange={(e) => setGiftcardEmail(e.target.value)}
                  icon={HiMail}
                  placeholder="Enter email address"
                  style={{ backgroundColor: "white" }}
                />
              </div>

              {success && <Alert color="success">{success}</Alert>}
              {error && <Alert color="failure">{error}</Alert>}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 rounded-b border-t border-gray-300 p-6">
              <Button
                color="light"
                onClick={() => setShowSendGiftCard(false)}
                disabled={loading}
                className="w-33 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleSendGiftcard}
                disabled={loading || !giftcardEmail}
                className="w-35 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Gift Card"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 3. Refund Gift Card Modal */}
        <Modal show={showRefund} onClose={() => setShowRefund(false)} size="md">
          <div className="relative rounded-lg bg-white shadow">
            {/* DRAGGABLE HEADER */}
            <div className="modal-drag-handle flex cursor-grab items-start justify-between rounded-t border-b border-gray-300 p-5 select-none active:cursor-grabbing">
              <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
                Refund a Gift Card
              </h3>
              <button
                type="button"
                onClick={() => setShowRefund(false)}
                className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li>
                  You'll be able to refund the entire purchase or do a partial
                  refund.
                </li>
                <li>
                  The available balance left on the card will be reduced by the
                  refund
                </li>
              </ul>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Gift Card:
                    </span>
                    <span className="font-mono text-gray-900">
                      {giftcard.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Purchaser:
                    </span>
                    <span className="text-gray-900">{giftcard.sender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Original Amount:
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(giftcard.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Current Balance:
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(giftcard.balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Refund Type</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Radio
                      id="full-refund"
                      name="refund-type"
                      value="full"
                      checked={refundType === "full"}
                      onChange={() => setRefundType("full")}
                    />
                    <Label htmlFor="full-refund">Full Refund</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio
                      id="partial-refund"
                      name="refund-type"
                      value="partial"
                      checked={refundType === "partial"}
                      onChange={() => setRefundType("partial")}
                    />
                    <Label htmlFor="partial-refund">Partial Refund</Label>
                  </div>
                </div>
              </div>

              {refundType === "partial" && (
                <div>
                  <Label htmlFor="refundAmount">Refund Amount</Label>
                  <TextInput
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={giftcard.balance}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    addon="$"
                  />
                  {refundAmount && (
                    <p className="mt-1 text-sm text-gray-600">
                      New balance will be:{" "}
                      {formatCurrency(
                        giftcard.balance - parseFloat(refundAmount),
                      )}
                    </p>
                  )}
                </div>
              )}

              {refundType === "full" && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="text-sm text-yellow-800">
                    Full refund of {formatCurrency(giftcard.amount)} will be
                    processed. Gift card balance will become $0.00
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="refundReason">
                  Reason for Refund (Optional)
                </Label>
                <Textarea
                  id="refundReason"
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  style={{ backgroundColor: "white" }}
                />
              </div>

              {success && <Alert color="success">{success}</Alert>}
              {error && <Alert color="failure">{error}</Alert>}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 rounded-b border-t border-gray-300 p-6">
              <Button
                color="light"
                onClick={() => setShowRefund(false)}
                disabled={loading}
                className="w-33 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleRefund}
                disabled={loading}
                className="w-38 cursor-pointer"
              >
                {loading ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 4. View Changes Modal */}
        <Modal
          show={showChanges}
          onClose={() => setShowChanges(false)}
          size="lg"
        >
          <div className="relative rounded-lg bg-white shadow">
            {/* DRAGGABLE HEADER */}
            <div className="modal-drag-handle flex cursor-grab items-start justify-between rounded-t border-b border-gray-300 p-5 select-none active:cursor-grabbing">
              <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
                View Changes
              </h3>
              <button
                type="button"
                onClick={() => setShowChanges(false)}
                className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-700">
                View log of actions taken, purchase date etc on the gift card
              </p>

              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : changes.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No changes recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {changes.map((change) => (
                    <div
                      key={change.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {change.description}
                      </div>
                      {change.amount && (
                        <div className="mt-1 text-sm text-gray-600">
                          Amount: {formatCurrency(change.amount)}
                        </div>
                      )}
                      {change.previousValue && change.newValue && (
                        <div className="mt-1 text-sm text-gray-600">
                          Balance: ${change.previousValue} → ${change.newValue}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        By {change.performedBy} • {formatDate(change.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end rounded-b border-t border-gray-300 p-6">
              <Button
                color="blue"
                onClick={() => setShowChanges(false)}
                className="w-24 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* 5. View Redemptions Modal */}
        <Modal
          show={showRedemptions}
          onClose={() => setShowRedemptions(false)}
          size="2xl"
        >
          <div className="relative rounded-lg bg-white shadow">
            {/* DRAGGABLE HEADER */}
            <div className="modal-drag-handle flex cursor-grab items-start justify-between rounded-t border-b border-gray-300 p-5 select-none active:cursor-grabbing">
              <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
                Gift Card Redemptions
              </h3>
              <button
                type="button"
                onClick={() => setShowRedemptions(false)}
                className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-700">
                See which bookings customer has applied gift card to
              </p>
              <p className="text-sm text-gray-600">
                Gift card{" "}
                <span className="font-mono font-semibold">{giftcard.code}</span>{" "}
                was used towards these bookings:
              </p>

              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : redemptions.length === 0 ? (
                <div className="rounded-lg bg-blue-50 p-8 text-center">
                  <p className="text-sm text-blue-800">
                    This gift card has not been redeemed yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableHeadCell>Customer</TableHeadCell>
                      <TableHeadCell>Service Date</TableHeadCell>
                      <TableHeadCell>Total</TableHeadCell>
                      <TableHeadCell>Amount Redeemed</TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y">
                      {redemptions.map((r) => (
                        <TableRow key={r.id} className="bg-white">
                          <TableCell className="font-medium text-gray-900">
                            {r.redeemedBy || "Customer"}
                          </TableCell>
                          <TableCell>{formatDate(r.redeemedAt)}</TableCell>
                          <TableCell>
                            {r.bookingId ? `#${r.bookingId}` : "-"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(r.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end rounded-b border-t border-gray-300 p-6">
              <Button
                color="blue"
                onClick={() => setShowRedemptions(false)}
                className="w-24 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
};

export default GiftcardActionsMenu;
