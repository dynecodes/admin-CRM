// src/components/promotions/PromotionsForm.tsx
import * as React from "react";
import { Button, Label, Checkbox, Alert, Card } from "flowbite-react";
import { HiTag, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import type {
  Promotion,
  DaysOfWeek,
  DiscountType,
} from "../../types/promotions";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import DatePicker from "../ui/DatePicker";

/* -------------------- props -------------------- */
type PromotionsFormProps = {
  promotion?: Promotion;
  onSuccess: (
    data: Omit<Promotion, "id" | "created_at" | "updated_at">,
  ) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: (promotion: Promotion) => void | Promise<void>;
};

/* -------------------- misc types -------------------- */
type DiscountForm = {
  type: DiscountType;
  code: string;
  percentValue?: number | null;
  dollarValue?: number | null;
  numberOfUses?: number | null;
  expirationDate?: string | null;
  newCustomersDate?: string | null;
  serviceDateStart?: string | null;
  serviceDateEnd?: string | null;
  canCombine?: boolean;
  daysOfWeek: DaysOfWeek;
};

type ActionState = {
  success: boolean;
  message: string | null;
  error: string | null;
  data: any;
};

const emptyDays: DaysOfWeek = {
  sun: false,
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
};

/* =======================================================
Component
======================================================= */

const PromotionForm: React.FC<PromotionsFormProps> = ({
  promotion,
  onSuccess,
  onCancel,
  onDelete,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = React.useRef(false);
  const isEditing = !!promotion;

  const [status, setStatus] = React.useState<Promotion["status"]>(
    promotion?.status ?? "active",
  );
  const [isPending, setIsPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const [errors, setErrors] = React.useState<
    Record<string, string | undefined>
  >({});

  const [discountData, setDiscountData] = React.useState<DiscountForm>(() => ({
    type: promotion?.type ?? "Booking",
    code: promotion?.code ?? "",
    percentValue: null,
    dollarValue: null,
    numberOfUses: promotion?.limit?.perCode ?? null,
    expirationDate: null,
    newCustomersDate: (promotion?.limit as any)?.newCustomerAfter ?? null,
    serviceDateStart: promotion?.serviceDateStart ?? null,
    serviceDateEnd: promotion?.serviceDateEnd ?? null,
    canCombine: false,
    daysOfWeek: promotion?.daysOfWeek ?? emptyDays,
  }));

  const setField = <K extends keyof DiscountForm>(k: K, v: DiscountForm[K]) =>
    setDiscountData((d) => ({ ...d, [k]: v }));

  // helpers
  const hasDiscountValue =
    (discountData.type === "Booking" &&
      ((discountData.percentValue ?? 0) > 0 ||
        (discountData.dollarValue ?? 0) > 0)) ||
    (discountData.type === "Giftcard" && (discountData.percentValue ?? 0) > 0);

  const exclusiveError =
    discountData.type === "Booking" &&
    (discountData.percentValue ?? 0) > 0 &&
    (discountData.dollarValue ?? 0) > 0;

  const validate = () => {
    const next: Record<string, string | undefined> = {};
    if (!discountData.code.trim()) next.code = "Code is required.";
    if (!hasDiscountValue) next.discount = "Provide a percent or dollar value.";
    if (exclusiveError)
      next.discount = "Use either percent OR dollars, not both.";
    if (
      discountData.serviceDateStart &&
      discountData.serviceDateEnd &&
      discountData.serviceDateEnd < discountData.serviceDateStart
    ) {
      next.serviceDateEnd = "End date must be after start date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): Omit<
    Promotion,
    "id" | "created_at" | "updated_at"
  > => {
    const discountText =
      discountData.type === "Giftcard"
        ? `$${discountData.percentValue ?? 0} gift card`
        : (discountData.percentValue ?? 0) > 0
          ? `${discountData.percentValue}% off`
          : `$${discountData.dollarValue ?? 0} off`;

    return {
      code: discountData.code.trim(),
      discount: discountText,
      type: discountData.type,
      usageCount: promotion?.usageCount ?? 0,
      limit: {
        perCustomer: promotion?.limit?.perCustomer ?? null,
        perCode: discountData.numberOfUses ?? null,
        minBookingAmount: promotion?.limit?.minBookingAmount ?? null,
        ...(discountData.newCustomersDate
          ? { newCustomerAfter: discountData.newCustomersDate }
          : {}),
      } as Promotion["limit"],
      daysOfWeek: discountData.daysOfWeek,
      serviceDateStart: discountData.serviceDateStart ?? null,
      serviceDateEnd: discountData.serviceDateEnd ?? null,
      status,
    };
  };

  const promotionsAction = async (
    _prev: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      void formData;
      if (!validate()) {
        return {
          success: false,
          message: null,
          error: "Fix validation errors.",
          data: null,
        };
      }
      const payload = buildPayload();
      await onSuccess(payload);
      return {
        success: true,
        message: `Discount ${isEditing ? "updated" : "created"} successfully!`,
        data: payload,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: null,
        data: null,
        error: err?.message || "Failed to save discount.",
      };
    }
  };

  const [state, _dispatch] = (React as any).useActionState(promotionsAction, {
    success: false,
    message: null,
    error: null,
    data: null,
  } as ActionState);

  React.useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      if (!isEditing) {
        formRef.current?.reset?.();
        setStatus("active");
        setDiscountData({
          type: "Booking",
          code: "",
          percentValue: null,
          dollarValue: null,
          numberOfUses: null,
          expirationDate: null,
          newCustomersDate: null,
          serviceDateStart: null,
          serviceDateEnd: null,
          canCombine: false,
          daysOfWeek: emptyDays,
        });
      }
      setTimeout(() => (hasCalledOnSuccess.current = false), 0);
    }
  }, [state.success, state.data, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const fd = new FormData(formRef.current!);
      const res = await promotionsAction(state, fd);
      if (!res.success && res.error) alert(res.error);
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!promotion) return;
    try {
      setIsPending(true);
      const nextStatus: Promotion["status"] =
        status === "active" ? "archived" : "active";
      setStatus(nextStatus);
      await onSuccess({ ...buildPayload(), status: nextStatus });
    } catch (error: any) {
      setStatus(status);
      alert(error?.message || "Failed to update status.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!promotion || !onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(promotion);
      setShowDeleteModal(false);
    } catch (error: any) {
      alert(error?.message || "Failed to delete discount.");
    } finally {
      setIsDeleting(false);
    }
  };

  const percentChange = (v: string) =>
    setField("percentValue", v === "" ? null : Number(v));
  const dollarChange = (v: string) =>
    setField("dollarValue", v === "" ? null : Number(v));

  // string ("YYYY-MM-DD") ↔ Date helpers
  function toYMD(d: Date | null | undefined): string | null {
    if (!d) return null;
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }
  function fromYMD(s: string | null | undefined): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  }

  /* ====== Tailwind classes matching Frequency inputs ====== */
  const inputCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-gray-500 focus:ring-gray-500 ";
  const selectCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11  " +
    "text-xs sm:text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500 cursor-pointer";

  const badge =
    "min-w-[4rem] inline-flex h-10 sm:h-11 items-center justify-center " +
    "rounded-md border border-gray-300 bg-gray-200 px-2 text-lg text-gray-600";

  return (
    <>
      <div className="px-5 pb-10 text-gray-900 antialiased">
        {/* breadcrumb */}
        <nav
          className="mb-3 flex items-center text-gray-700"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                to="/admin/promotions"
                className="text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
              >
                Promotions
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
                {isEditing ? "Edit Discount" : "New Discount"}
              </span>
            </li>
          </ol>
        </nav>

        {/* header */}
        <div className="mb-4 flex items-center gap-3 sm:gap-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-white sm:h-12 sm:w-12">
            <HiTag className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-2xl">
              {isEditing ? "Edit Discount" : "New Promotion"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Configure discount type, amount, limits, and dates
            </p>
          </div>
        </div>

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
          <Card className="bg-gray-50">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              Discount Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Type */}
              <div className="sm:col-span-2">
                <Label
                  htmlFor="type"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Discount Type
                </Label>
                <select
                  id="type"
                  value={discountData.type}
                  onChange={(e) =>
                    setField("type", e.target.value as DiscountType)
                  }
                  className={selectCls}
                >
                  <option value="Booking">Booking</option>
                  <option value="Giftcard">Giftcard</option>
                </select>
              </div>

              {/* Code */}
              <div className="mt-4 sm:col-span-2">
                <Label
                  htmlFor="code"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Discount Code
                </Label>
                <input
                  id="code"
                  type="text"
                  placeholder='Enter "Discount Code"'
                  value={discountData.code}
                  onChange={(e) => setField("code", e.target.value)}
                  aria-invalid={!!errors.code}
                  className={inputCls}
                />
                {errors.code && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.code}</p>
                )}
              </div>

              {/* Discount */}
              <div className="mt-4 sm:col-span-2">
                <Label className="mb-1 block text-sm font-medium text-gray-900">
                  Discount
                </Label>

                {discountData.type === "Booking" && (
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <input
                      className={inputCls}
                      placeholder="0"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step="0.01"
                      value={discountData.percentValue ?? ""}
                      onChange={(e) => percentChange(e.target.value)}
                      aria-invalid={!!errors.discount}
                    />
                    <span className={badge}>%</span>
                    <span className="mx-auto text-lg font-semibold text-gray-500 sm:mx-2 sm:text-left">
                      or
                    </span>
                    <span className={badge}>$</span>
                    <input
                      className={inputCls}
                      placeholder="0.00"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={discountData.dollarValue ?? ""}
                      onChange={(e) => dollarChange(e.target.value)}
                      aria-invalid={!!errors.discount}
                    />
                  </div>
                )}

                {discountData.type === "Giftcard" && (
                  <>
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                      <span className={badge}>%</span>
                      <input
                        className={inputCls}
                        placeholder="0.00"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={discountData.percentValue ?? ""}
                        onChange={(e) => percentChange(e.target.value)}
                        aria-invalid={!!errors.discount}
                      />
                    </div>

                    {/* Uses + Expiration */}
                    <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
                      <div className="mt-8 sm:col-span-2">
                        <Label
                          htmlFor="numberOfUses"
                          className="mb-1 block text-sm font-medium text-gray-900"
                        >
                          Number of Uses
                        </Label>
                        <input
                          id="numberOfUses"
                          type="number"
                          inputMode="numeric"
                          placeholder='Enter "Number of Uses"'
                          value={discountData.numberOfUses ?? ""}
                          onChange={(e) =>
                            setField(
                              "numberOfUses",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          className={inputCls}
                        />
                        <p className="mt-1 p-1 text-xs text-gray-500">
                          Number of times the code can be used
                        </p>
                      </div>

                      <div className="mt-4 sm:col-span-2">
                        <Label
                          htmlFor="expirationDate"
                          className="mb-1 block text-sm font-medium text-gray-900"
                        >
                          Expiration Date
                        </Label>
                        <DatePicker
                          value={fromYMD(discountData.expirationDate) ?? null}
                          onChange={(v) => setField("expirationDate", toYMD(v))}
                          placeholder="MM/DD/YYYY"
                        />
                        <p className="mt-1 p-1 text-xs text-gray-500">
                          The code cannot be used after this date
                        </p>
                      </div>
                    </div>

                    {errors.discount && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.discount}
                      </p>
                    )}
                  </>
                )}

                {errors.discount && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.discount}
                  </p>
                )}
              </div>

              {/* Booking-only extras */}
              {discountData.type === "Booking" && (
                <>
                  <label className="mt-3 flex items-center gap-2 sm:col-span-2">
                    <Checkbox
                      checked={!!discountData.canCombine}
                      onChange={(e) => setField("canCombine", e.target.checked)}
                      className="h-4 w-4 cursor-pointer bg-white disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700">
                      Can be combined with other discountss
                    </span>
                  </label>

                  <div className="mt-4 sm:col-span-2">
                    <div>
                      <Label
                        htmlFor="numberOfUses2"
                        className="mb-1 block text-sm font-medium text-gray-900"
                      >
                        Number of Uses
                      </Label>
                      <input
                        id="numberOfUses2"
                        type="number"
                        inputMode="numeric"
                        placeholder='Enter "Number of Uses"'
                        value={discountData.numberOfUses ?? ""}
                        onChange={(e) =>
                          setField(
                            "numberOfUses",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        className={inputCls}
                      />
                      <p className="mt-1 mb-7 p-1 text-xs text-gray-500">
                        Number of times the code can be used
                      </p>
                    </div>

                    <div className="mt-4 sm:col-span-2">
                      <Label
                        htmlFor="expirationDate2"
                        className="mb-1 block text-sm font-medium text-gray-900"
                      >
                        Expiration Date
                      </Label>
                      <DatePicker
                        value={fromYMD(discountData.expirationDate) ?? null}
                        onChange={(v) => setField("expirationDate", toYMD(v))}
                        placeholder="MM/DD/YYYY"
                      />
                      <p className="mt-1 p-1 text-xs text-gray-500">
                        The code cannot be used after this date
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* New customers date */}
              <div className="mt-4 sm:col-span-2">
                <Label
                  htmlFor="newCustomersDate"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  New Customers Date
                </Label>
                <DatePicker
                  value={fromYMD(discountData.newCustomersDate) ?? null}
                  onChange={(v) => setField("newCustomersDate", toYMD(v))}
                  placeholder="MM/DD/YYYY"
                />
              </div>

              {/* Service date range (booking) */}
              {discountData.type === "Booking" && (
                <div className="mt-4 sm:col-span-2">
                  <Label className="mb-2 block text-sm font-medium text-gray-900">
                    Service Date
                  </Label>

                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <DatePicker
                      value={fromYMD(discountData.serviceDateStart) ?? null}
                      onChange={(v) => {
                        const next = toYMD(v);
                        setField("serviceDateStart", next);
                        // keep end >= start
                        if (
                          discountData.serviceDateEnd &&
                          next &&
                          discountData.serviceDateEnd < next
                        ) {
                          setField("serviceDateEnd", next);
                        }
                      }}
                      placeholder="Start (MM/DD/YYYY)"
                    />
                    <span className="text-center text-gray-500 sm:mx-2 sm:w-auto">
                      –
                    </span>
                    <DatePicker
                      value={fromYMD(discountData.serviceDateEnd) ?? null}
                      onChange={(v) => setField("serviceDateEnd", toYMD(v))}
                      placeholder="End (MM/DD/YYYY)"
                    />
                  </div>

                  {errors.serviceDateEnd && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.serviceDateEnd}
                    </p>
                  )}
                </div>
              )}

              {/* Days of week */}
              <div className="mt-2 sm:col-span-2">
                <Label className="mb-1 block text-sm font-medium text-gray-900">
                  Days of the Week
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
                  {(
                    [
                      { key: "sun", label: "Sun" },
                      { key: "mon", label: "Mon" },
                      { key: "tue", label: "Tue" },
                      { key: "wed", label: "Wed" },
                      { key: "thu", label: "Thu" },
                      { key: "fri", label: "Fri" },
                      { key: "sat", label: "Sat" },
                    ] as const
                  ).map((day) => (
                    <label
                      key={day.key}
                      className="flex items-center cursor-pointer gap-2 rounded border border-gray-200 bg-white p-2"
                    >
                      <Checkbox
                        color="gray"
                        className="cursor-pointer"
                        checked={(discountData.daysOfWeek as any)[day.key]}
                        onChange={(e) =>
                          setField("daysOfWeek", {
                            ...discountData.daysOfWeek,
                            [day.key]: e.target.checked,
                          } as DaysOfWeek)
                        }
                      />
                      <span className="text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* actions */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {isEditing && (
              <Button
                type="button"
                color={status === "active" ? "warning" : "success"}
                onClick={handleStatusToggle}
                disabled={isPending}
              >
                {status === "active" ? "Archive" : "Activate"}
              </Button>
            )}
            {isEditing && status === "archived" && onDelete && (
              <Button
                type="button"
                color="failure"
                onClick={() => setShowDeleteModal(true)}
                disabled={isPending}
              >
                Delete
              </Button>
            )}
            <Button
              className="cursor-pointer"
              type="button"
              color="light"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" color="gray" className="cursor-pointer" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {promotion && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          itemName={promotion.code}
          itemType="discount code"
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default PromotionForm;
