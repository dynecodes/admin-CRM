// src/components/giftcards/GiftCardForm.tsx
import * as React from "react";
import {Label, Alert, Checkbox, Card } from "flowbite-react";
import {
  TextInput,
} from "../ui/InputsBundle";
import { HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import type { GiftcardFormData, GiftcardPurchase } from "../../types/giftcards";
import { useGiftcards } from "../../hooks/useGiftcards";

type GiftCardFormProps = {
  giftcard?: GiftcardPurchase;
  onSuccess: (
    data: GiftcardFormData & { paymentType: "credit" | "free" },
  ) => void | Promise<void>;
  onCancel: () => void;
};

type ActionState = {
  success: boolean;
  message: string | null;
  error: string | null;
  data: any;
};

const GiftCardForm: React.FC<GiftCardFormProps> = ({ onSuccess }) => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = React.useRef(false);
  const { settings } = useGiftcards();

  const [isPending, setIsPending] = React.useState(false);
  const [errors, setErrors] = React.useState<
    Record<string, string | undefined>
  >({});

  const [formData, setFormData] = React.useState<
    GiftcardFormData & {
      paymentType: "credit" | "free";
      discountCode: string;
    }
  >({
    amount: settings.amountOptions[0] ?? 0,
    recipient: "",
    recipientEmail: "",
    sender: "",
    senderEmail: "",
    message: settings.defaultMessage ?? "",
    paymentType: "free",
    discountCode: "",
  });

  const setField = <K extends keyof typeof formData>(
    k: K,
    v: (typeof formData)[K],
  ) => setFormData((d) => ({ ...d, [k]: v }));

  const validate = () => {
    const next: Record<string, string | undefined> = {};

    if (formData.amount <= 0) next.amount = "Amount must be greater than 0.";
    if (!formData.recipient.trim())
      next.recipient = "Recipient name is required.";
    if (!formData.recipientEmail.trim())
      next.recipientEmail = "Recipient email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail))
      next.recipientEmail = "Invalid email address.";
    if (!formData.sender.trim()) next.sender = "Sender name is required.";
    if (!formData.senderEmail.trim())
      next.senderEmail = "Your email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.senderEmail))
      next.senderEmail = "Invalid email address.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const giftcardAction = async (
    _prev: ActionState,
    _formData: FormData,
  ): Promise<ActionState> => {
    try {
      if (!validate()) {
        return {
          success: false,
          message: null,
          error: "Fix validation errors.",
          data: null,
        };
      }

      await onSuccess(formData);

      return {
        success: true,
        message: "Gift card issued successfully!",
        data: formData,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: null,
        data: null,
        error: err?.message || "Failed to issue gift card.",
      };
    }
  };

  const [state, _dispatch] = (React as any).useActionState(giftcardAction, {
    success: false,
    message: null,
    error: null,
    data: null,
  } as ActionState);

  React.useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      setTimeout(() => (hasCalledOnSuccess.current = false), 0);
    }
  }, [state.success, state.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const fd = new FormData(formRef.current!);
      const res = await giftcardAction(state, fd);
      if (!res.success && res.error) alert(res.error);
    } finally {
      setIsPending(false);
    }
  };

  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const amountCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3" +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-gray-500 focus:ring-gray-500 cursor-pointer";
  const textareaCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-gray-500 focus:ring-gray-500";

  // Reusable row so labels sit left, fields right (stack on mobile)
  const Row: React.FC<{
    label: string;
    htmlFor: string;
    topAlign?: boolean; // use for textarea
    children: React.ReactNode;
  }> = ({ label, htmlFor, topAlign, children }) => (
    <div
      className={[
        "grid gap-2 sm:gap-4",
        // 160px label column, rest for field (adjust width as you like)
        "grid-cols-1 sm:[grid-template-columns:160px_1fr]",
        topAlign ? "items-start" : "items-center",
      ].join(" ")}
    >
      <Label
        htmlFor={htmlFor}
        className={[
          "text-sm font-medium text-gray-900",
          // push label to the right edge of its column on desktop
          "sm:justify-self-end",
          topAlign ? "pt-2 sm:pt-2" : "",
        ].join(" ")}
      >
        {label}
      </Label>
      <div>{children}</div>
    </div>
  );

  // Gift Card Preview Component (WP-style)
  const GiftCardPreview = () => {
    const bgSrc = settings.backgroundImage || undefined; // use settings preview bg if present
    const company =
      (settings as any)?.companyName || " 247giants,MaggyMaid Company, Inc.";
    const amountText = Number(formData.amount || 0).toFixed(2);

    return (
      <div className="relative w-100 max-w-md rounded-lg border-2 border-gray-200 bg-transparent shadow-lg">
        {/* Photo area */}
        <div className="relative h-70 w-full overflow-hidden rounded-t-lg">
          {bgSrc ? (
            <img
              src={bgSrc}
              alt="Gift card background"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}

          {/* Top dark band */}
          <div className="absolute top-0 right-0 left-0 flex items-center justify-between bg-black/70 px-4 py-2">
            <span className="line-clamp-1 text-sm font-semibold text-white">
              {company}
            </span>
            <span className="text-sm font-bold text-white">${amountText}</span>
          </div>

          {/* Right translucent panel (desktop) */}
          <div className="absolute top-10 right-3 bottom-3 hidden w-[55%] rounded-md bg-white/85 p-3 shadow-sm backdrop-blur-sm sm:block">
            <p className="text-xs font-semibold text-gray-800">
              Dear {formData.recipient || "Recipient Name"}
            </p>
            <p className="mt-5 line-clamp-5 text-[12px] leading-4 text-gray-600">
              {formData.message || "Your message will appear here..."}
            </p>

            {settings.showDiscountCode && (
              <div className="rounded-mdp-2 mt-10">
                <p className="mt-2 text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">
                    {formData.sender || "Your Name"}
                  </span>
                </p>
                <div className="text-[11px] font-medium text-gray-600">
                  Code:
                </div>
                <div className="font-mono text-xs font-bold text-gray-900">
                  {formData.discountCode || "XXXX-XXXX-XXXX"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile fallback (panel below image) */}
        <div className="space-y-2 border-t border-gray-200 p-4 sm:hidden">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">
              Dear {formData.recipient || "Recipient Name"}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {formData.message
              ? `${formData.message.slice(0, 160)}${
                  formData.message.length > 160 ? "…" : ""
                }`
              : "Your message will appear here..."}
          </div>
          {settings.showDiscountCode && (
            <div className="mt-2 rounded bg-gray-100 p-2">
              <div className="text-xs font-medium text-gray-600">Code:</div>
              <div className="font-mono text-sm font-bold text-gray-900">
                {formData.discountCode || "XXXX-XXXX-XXXX"}
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            <span className="font-medium">
              {formData.sender || "Your Name"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 pb-10 text-gray-900 antialiased">
      {/* breadcrumb */}
      <nav
        className="mb-3 flex items-center text-gray-700"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/admin/giftcards"
              className="text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Gift Cards
            </Link>
          </li>
          <li aria-current="page" className="inline-flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
              Gift Card
            </span>
          </li>
        </ol>
      </nav>

      {/* alerts */}
      {state.error && (
        <Alert color="failure" icon={HiExclamationCircle} className="mb-3">
          <span className="text-xs font-medium sm:text-sm">Error!</span>
          <span className="text-xs sm:text-sm">{state.error}</span>
        </Alert>
      )}
      {state.success && state.message && (
        <Alert color="success" icon={HiCheckCircle} className="mb-3">
          <span className="text-xs font-medium sm:text-sm">Success!</span>
          <span className="text-xs sm:text-sm">{state.message}</span>
        </Alert>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Single gray card containing both sections */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="bg-gray-50">
              {/* Section: Issue Gift Card */}
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Gift Card
              </h2>

              {/* Amount */}
              <Row label="Amount" htmlFor="amount">
                <select
                  id="amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setField("amount", parseFloat(e.target.value))
                  }
                  aria-invalid={!!errors.amount}
                  className={amountCls}
                >
                  {settings.amountOptions.map((option) => (
                    <option key={option} value={option}>
                      {fmtCurrency(option)}
                    </option>
                  ))}
                </select>
                {errors.amount && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.amount}</p>
                )}
              </Row>

              {/* To (Recipient) */}
              <Row label="To" htmlFor="recipient">
                <TextInput
                  id="recipient"
                  type="text"
                  placeholder="Recipient name"
                  value={formData.recipient}
                  onChange={(e) => setField("recipient", e.target.value)}
                  aria-invalid={!!errors.recipient}
                />
                {errors.recipient && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.recipient}
                  </p>
                )}
              </Row>

              {/* Recipient Email */}
              <Row label="Recipient Email" htmlFor="recipientEmail">
                <TextInput  
                  id="recipientEmail"
                  type="email"
                  placeholder="recipient@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) => setField("recipientEmail", e.target.value)}
                  aria-invalid={!!errors.recipientEmail}

                />
                {errors.recipientEmail && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.recipientEmail}
                  </p>
                )}
              </Row>

              {/* From (Sender) */}
              <Row label="From" htmlFor="sender">
                <TextInput  
                  id="sender"
                  type="text"
                  placeholder="Your name"
                  value={formData.sender}
                  onChange={(e) => setField("sender", e.target.value)}
                  aria-invalid={!!errors.sender}

                />
                {errors.sender && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.sender}</p>
                )}
              </Row>

              {/* Your Email */}
              <Row label="Your Email" htmlFor="senderEmail">
                <TextInput  
                  id="senderEmail"
                  type="email"
                  placeholder="your@example.com"
                  value={formData.senderEmail}
                  onChange={(e) => setField("senderEmail", e.target.value)}
                  aria-invalid={!!errors.senderEmail}

                />
                {errors.senderEmail && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.senderEmail}
                  </p>
                )}
              </Row>

              {/* Message (topAlign so label stays aligned to the top of the textarea) */}
              <Row label="Message" htmlFor="message" topAlign>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Enter a personal message"
                  value={formData.message}
                  onChange={(e) => setField("message", e.target.value)}
                  className={textareaCls}
                />
              </Row>

              {/* Discount Code */}
              <Row label="Discount Code" htmlFor="discountCode">
                <TextInput
                  id="discountCode"
                  type="text"
                  placeholder="Optional discount code"
                  value={formData.discountCode}
                  onChange={(e) => setField("discountCode", e.target.value)}

                />
              </Row>

              {/* Divider inside the same gray card */}
              <hr className="my-6 border-gray-200" />

              {/* Section: Checkout (still inside the same gray card) */}
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Checkout
              </h3>

              {/* Payment Icons */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                  alt="Mastercard"
                  className="h-8"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                  alt="Visa"
                  className="h-8"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
                  alt="American Express"
                  className="h-8"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-8"
                />
              </div>

              <p className="mb-4 text-sm text-gray-600">
                If you want SECURE 256-BIT SSL ENCRYPTED PAYMENT
              </p>

              {/* Payment Type Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    className="cursor-pointer"
                    color="gray"
                    id="creditCard"
                    checked={formData.paymentType === "credit"}
                    onChange={() => setField("paymentType", "credit")}
                  />
                  <span>Credit Card</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    className="cursor-pointer"
                    color="gray"
                    id="free"
                    checked={formData.paymentType === "free"}
                    onChange={() => setField("paymentType", "free")}
                  />
                  <span >Free</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <GiftCardPreview />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GiftCardForm;
