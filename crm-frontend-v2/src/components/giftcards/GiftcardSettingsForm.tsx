import * as React from "react";
import { Button, Label, Checkbox, Alert, Card, TextInput} from "flowbite-react";
import { HiCheckCircle, HiExclamationCircle, HiX } from "react-icons/hi";
import type { GiftcardSettings } from "../../types/giftcards";

type GiftcardSettingsFormProps = {
  settings: GiftcardSettings;
  onSuccess: (data: Partial<GiftcardSettings>) => void | Promise<void>;
};

type ActionState = {
  success: boolean;
  message: string | null;
  error: string | null;
  data: any;
};

const GiftcardSettingsForm: React.FC<GiftcardSettingsFormProps> = ({
  settings,
  onSuccess,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasCalledOnSuccess = React.useRef(false);

  const [isPending, setIsPending] = React.useState(false);
  const [activeTab] = React.useState<"settings" | "sold">("settings");
  const [errors, setErrors] = React.useState<
    Record<string, string | undefined>
  >({});

  const [formData, setFormData] = React.useState({
    amountOptions: [...settings.amountOptions],
    allowCustomAmount: settings.allowCustomAmount,
    customAmountMin: settings.customAmountMin || 1,
    customAmountMax: settings.customAmountMax || 999.99,
    defaultMessage: settings.defaultMessage,
    showDiscountCode: settings.showDiscountCode,
    backgroundImage: settings.backgroundImage || "",
    useDefaultBackground: !settings.backgroundImage,
  });

  const [newAmount, setNewAmount] = React.useState<string>("");
  const [previewImage, setPreviewImage] = React.useState<string | null>(
    settings.backgroundImage || null,
  );

  const setField = <K extends keyof typeof formData>(
    k: K,
    v: (typeof formData)[K],
  ) => setFormData((d) => ({ ...d, [k]: v }));

  const addAmount = () => {
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) {
      setErrors({ ...errors, newAmount: "Invalid amount" });
      return;
    }
    if (amount < 1 || amount > 999.99) {
      setErrors({
        ...errors,
        newAmount: "Amount must be between 1 and 999.99",
      });
      return;
    }
    if (formData.amountOptions.includes(amount)) {
      setErrors({ ...errors, newAmount: "Amount already exists" });
      return;
    }
    if (formData.amountOptions.length >= 10) {
      setErrors({ ...errors, newAmount: "Maximum 10 amounts allowed" });
      return;
    }
    setField(
      "amountOptions",
      [...formData.amountOptions, amount].sort((a, b) => a - b),
    );
    setNewAmount("");
    setErrors({ ...errors, newAmount: undefined });
  };

  const removeAmount = (amount: number) => {
    setField(
      "amountOptions",
      formData.amountOptions.filter((a) => a !== amount),
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrors({
        ...errors,
        backgroundImage: "File size must be less than 1MB",
      });
      return;
    }

    if (!file.type.match(/^image\/(png|jpe?g)$/)) {
      setErrors({
        ...errors,
        backgroundImage: "Only PNG or JPG files are allowed",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      setField("backgroundImage", result);
      setField("useDefaultBackground", false);
      setErrors({ ...errors, backgroundImage: undefined });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setField("backgroundImage", "");
    setField("useDefaultBackground", true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setFormData({
      amountOptions: [...settings.amountOptions],
      allowCustomAmount: settings.allowCustomAmount,
      customAmountMin: settings.customAmountMin || 1,
      customAmountMax: settings.customAmountMax || 999.99,
      defaultMessage: settings.defaultMessage,
      showDiscountCode: settings.showDiscountCode,
      backgroundImage: settings.backgroundImage || "",
      useDefaultBackground: !settings.backgroundImage,
    });
    setPreviewImage(settings.backgroundImage || null);
    setNewAmount("");
    setErrors({});
  };

  const validate = () => {
    const next: Record<string, string | undefined> = {};

    if (formData.amountOptions.length === 0 && !formData.allowCustomAmount) {
      next.amountOptions =
        "At least one amount option or custom amount must be enabled.";
    }

    if (
      formData.allowCustomAmount &&
      formData.customAmountMin > formData.customAmountMax
    ) {
      next.customAmountMin = "Min amount cannot exceed max amount.";
    }

    if (!formData.defaultMessage.trim()) {
      next.defaultMessage = "Default message is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const settingsAction = async (
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
        message: "Settings updated successfully!",
        data: formData,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: null,
        data: null,
        error: err?.message || "Failed to save settings.",
      };
    }
  };

  const [state] = (React as any).useActionState(settingsAction, {
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
      const res = await settingsAction(state, fd);
      if (!res.success && res.error) alert(res.error);
    } finally {
      setIsPending(false);
    }
  };

  // ---------- Preview ----------
const GiftCardPreview = () => {
const bgSrc = previewImage && !formData.useDefaultBackground ? previewImage : undefined;
const company = (settings as any)?.companyName || "247giants,MaggyMaid Company, Inc.";
const amount = (formData.amountOptions?.[0] as number | undefined) ?? 20;


return (
      <div className="relative w-100 max-w-md rounded-lg border-2 border-gray-200 bg-transparent shadow-lg">
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
            <span className="text-sm font-bold text-white">
              ${amount.toFixed(2)}
            </span>
          </div>

          {/* Right translucent panel (desktop) */}
          <div className="absolute top-10 right-3 bottom-3 hidden w-[55%] rounded-md bg-white/85 p-3 shadow-sm backdrop-blur-sm sm:block">
            <p className="text-xs font-semibold text-gray-800">
              Dear Scott Smith
            </p>
            <p className="mt-5 line-clamp-5 text-[12px] leading-4 text-gray-600">
              {formData.defaultMessage}
            </p>

            {formData.showDiscountCode && (
              <div className="rounded-mdp-2 mt-10">
                <p className="mt-2 text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">Adam David</span>
                </p>
                <div className="text-[11px] font-medium text-gray-600">
                  Code:
                </div>
                <div className="font-mono text-xs font-bold text-gray-900">
                  XXXX-XXXX-XXXX
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile fallback */}
        <div className="space-y-2 border-t border-gray-200 p-4 sm:hidden">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">
              Dear Scott Smith
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {formData.defaultMessage.slice(0, 160)}
            {formData.defaultMessage.length > 160 && "…"}
          </div>
          {formData.showDiscountCode && (
            <div className="mt-2 rounded bg-gray-100 p-2">
              <div className="text-xs font-medium text-gray-600">Code:</div>
              <div className="font-mono text-sm font-bold text-gray-900">
                XXXX-XXXX-XXXX
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            <span className="font-medium">Adam David</span>
          </div>
        </div>
      </div>
    );
  };
const addamountCls =
  "block w-[20%] rounded-lg border border-gray-300 bg-white px-3" +
  "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-gray-500 focus:ring-gray-500";
  // ---------- Render ----------
  return (
    <div className="pb-20 text-gray-900 antialiased">
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

      {activeTab === "settings" ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: ONE gray card (promotions-style) */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-50">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  Gift Card Options
                </h2>

                {/* Amount Options */}
                <div className="space-y-2">
                  <Label className="mb-1 block text-sm font-medium text-gray-900">
                    Amount Options
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.amountOptions.map((amount) => (
                      <div
                        key={amount}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {amount}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAmount(amount)}
                          className="text-gray-400 cursor-pointer hover:text-red-600"
                          aria-label={`Remove ${amount}`}
                        >
                          <HiX className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <input         
                      type="number"
                      placeholder="Add an amount"
                      min={0}
                      step="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAmount();
                        }
                      }} 
                      className={addamountCls}                
                    />
                  </div>
                  {errors.newAmount && (
                    <p className="text-xs text-red-600">{errors.newAmount}</p>
                  )}
                  {errors.amountOptions && (
                    <p className="text-xs text-red-600">
                      {errors.amountOptions}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    You can add between 1 to 10 amounts and each amount between
                    1 and 999.99
                  </p>
                </div>

                {/* Default Message */}
                <div className="mt-6">
                  <Label
                    htmlFor="defaultMessage"
                    className="mb-1 block text-sm font-medium text-gray-900"
                  >
                    Default Message
                  </Label>
                  <textarea
                    id="defaultMessage"
                    rows={4}
                    placeholder="Enter default gift card message"
                    value={formData.defaultMessage}
                    onChange={(e) => setField("defaultMessage", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                  />
                  {errors.defaultMessage && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.defaultMessage}
                    </p>
                  )}
                </div>

                {/* Background Image */}
                <div className="mt-6">
                  <Label className="mb-1 block text-sm font-medium text-gray-900">
                    Background Image
                  </Label>

                  <div className="space-y-4">
                    {previewImage && !formData.useDefaultBackground ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Background preview"
                          className="h-32 w-auto rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700"
                          aria-label="Remove image"
                        >
                          <HiX className="h-3 w-3" />
                        </button>
                        <p className="mt-2 text-xs text-gray-500">402×282</p>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="backgroundImage"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Choose file
                        </label>
                        <input
                          ref={fileInputRef}
                          id="backgroundImage"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    )}

                    {errors.backgroundImage && (
                      <p className="text-xs text-red-600">
                        {errors.backgroundImage}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Less than 1MB and only PNG or JPG.
                    </p>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="cursor-pointer"
                        color="gray"
                        id="useDefaultBackground"
                        checked={formData.useDefaultBackground}
                        onChange={(e) => {
                          setField("useDefaultBackground", e.target.checked);
                          if (e.target.checked) removeImage();
                        }}
                      />
                      <Label
                        htmlFor="useDefaultBackground"
                        className="text-sm"
                      >
                        Use Default Background Image
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="cursor-pointer"
                        color="gray"
                        id="showDiscountCode"
                        checked={formData.showDiscountCode}
                        onChange={(e) =>
                          setField("showDiscountCode", e.target.checked)
                        }
                      />
                      <Label
                        htmlFor="showDiscountCode"
                        className="cursor-pointer text-sm"
                      >
                        Show Discount Code
                      </Label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: sticky preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <GiftCardPreview />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-start gap-2">
            <Button className="cursor-pointer" type="submit" color="dark" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              className="cursor-pointer"
              type="button"
              color="light"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-center text-gray-500">
            Gift cards sold will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default GiftcardSettingsForm;
