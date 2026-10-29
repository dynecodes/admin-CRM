// // src/App/Integrations/QuickBooks/index.tsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Label,
} from "flowbite-react";
import { TbBuildingStore } from "react-icons/tb";
type QuickBooksAccount = {
  id: string;
  name: string;
};

const MOCK_ACCOUNTS: QuickBooksAccount[] = [
  { id: "undeposited", name: "Undeposited Funds" },
  { id: "checking", name: "Checking Account" },
  { id: "savings", name: "Savings Account" },
];

const STORAGE_KEY = "quickbooks_integration";

const QUICKBOOKS_LOGIN_URL =
  import.meta.env.VITE_QUICKBOOKS_LOGIN_URL ||
  "https://accounts.intuit.com/app/sign-in?app_group=QBO&asset_alias=Intuit.devx.appsdotcomreverseproxy&redirect_uri=https%3A%2F%2Fappcenter.intuit.com%2Fapp%2Fconnect%2Foauth2%3Fclient_id%3DL0ojUv615S2fbhwqpmiqU5WT2ZkE5AQC3AsmWnM1n0ejKeAqz8%26redirect_uri%3Dhttps%253A%252F%252Fgo.launch27.com%252Foauth2%252Fquickbooks%26response_type%3Dcode%26scope%3Dcom.intuit.quickbooks.accounting%26state%3D0yC4QZFgvEqY20EUxGTVRp0DGHjJdRgA&single_sign_on=false&partner_uid_button=google&appfabric=true";

type StoredState = {
  authorized: boolean;
  refundAccountId: string | null;
};

function loadStoredState(): StoredState {
  if (typeof window === "undefined") {
    return { authorized: false, refundAccountId: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { authorized: false, refundAccountId: null };
    const parsed = JSON.parse(raw);
    return {
      authorized: !!parsed.authorized,
      refundAccountId: parsed.refundAccountId ?? null,
    };
  } catch {
    return { authorized: false, refundAccountId: null };
  }
}

function saveStoredState(next: StoredState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

const QuickBooksPage: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [refundAccountId, setRefundAccountId] = useState<string>("");
  const [savingRefund, setSavingRefund] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);

  // unlink modal state
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinkConfirmChecked, setUnlinkConfirmChecked] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // load from localStorage on mount
  useEffect(() => {
    const stored = loadStoredState();
    setAuthorized(stored.authorized);
    setRefundAccountId(stored.refundAccountId ?? "");
  }, []);

  const persist = (next: Partial<StoredState>) => {
    const current = loadStoredState();
    const merged: StoredState = { ...current, ...next };
    saveStoredState(merged);
  };

  const handleAuthorize = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthLoading(true);
    // same tab:
    window.location.href = QUICKBOOKS_LOGIN_URL;

    try {
      // here you’d normally redirect to QuickBooks OAuth
      await new Promise((r) => setTimeout(r, 800));

      setAuthorized(true);
      persist({ authorized: true });
      setSuccessMsg("QuickBooks has been authorized successfully.");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to start QuickBooks authorization process.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  /* ---------- unlink all data flow (with modal) ---------- */

  const openUnlinkModal = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUnlinkConfirmChecked(false);
    setUnlinkModalOpen(true);
  };

  const closeUnlinkModal = () => {
    if (unlinking) return;
    setUnlinkModalOpen(false);
    setUnlinkConfirmChecked(false);
  };

  const handleConfirmUnlinkAll = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUnlinking(true);
    try {
      // backend call to unlink everything would go here
      await new Promise((r) => setTimeout(r, 600));

      setAuthorized(false);
      setRefundAccountId("");
      persist({ authorized: false, refundAccountId: null });

      setSuccessMsg("All QuickBooks data has been unlinked from this account.");
      setUnlinkModalOpen(false);
      setUnlinkConfirmChecked(false);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to unlink QuickBooks data. Please try again.",
      );
    } finally {
      setUnlinking(false);
    }
  };

  const handleSaveRefundAccount = async () => {
    if (!refundAccountId) {
      setErrorMsg("Please choose a QuickBooks account for refunds.");
      return;
    }

    setSavingRefund(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // backend save would go here
      await new Promise((r) => setTimeout(r, 500));

      persist({ refundAccountId });
      setSuccessMsg("Refund account has been saved.");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to save QuickBooks refund account setting.",
      );
    } finally {
      setSavingRefund(false);
    }
  };

  return (
    <div className="px-4 pb-8 sm:px-5">
      <div className="mx-auto max-w-5xl">
        {/* Page header – same logo + spacing style as other integration pages */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
            <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
              <TbBuildingStore className="h-6 w-6 text-white"/>
            </div>
            <div className="font-medium">
              <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                QuickBooks
              </span>
              <div className="text-sm text-gray-500">
                Connect QuickBooks Online and choose where refunds are
                deposited.
              </div>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="space-y-8 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6">
          {/* Messages */}
          {successMsg && (
            <Alert
              color="success"
              onDismiss={() => setSuccessMsg(null)}
              className="mb-4"
            >
              <span className="text-sm">{successMsg}</span>
            </Alert>
          )}
          {errorMsg && (
            <Alert
              color="failure"
              onDismiss={() => setErrorMsg(null)}
              className="mb-4"
            >
              <span className="text-sm">{errorMsg}</span>
            </Alert>
          )}

          {/* Step 1 */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              Step 1. Authorize Calirocks to sync with QuickBooks
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Please click the <span className="font-medium">Authorize</span>{" "}
              button below to proceed with authorization.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                color="gray"
                onClick={handleAuthorize}
                disabled={authLoading || authorized}
                className="cursor-pointer"
              >
                {authLoading
                  ? "Authorizing..."
                  : authorized
                    ? "Authorized"
                    : "Authorize"}
              </Button>

              <Button
                color="failure"
                onClick={openUnlinkModal}
                disabled={!authorized}
                className="cursor-pointer"
              >
                Unlink All Data
              </Button>

              <div className="text-xs text-gray-500">
                {authorized
                  ? "QuickBooks is currently linked."
                  : "QuickBooks is not linked yet."}
              </div>
            </div>
          </section>

          <div className="my-4 border-t border-gray-200" />

          {/* Step 2 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              Step 2. Choose the QuickBooks account you want to deposit refunds
              to
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This is usually the QuickBooks account that you currently link
              sales transactions to.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <select
                  className="block w-full rounded-md cursor-pointer border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:bg-white focus:ring-1 focus:ring-gray-500 focus:outline-none"
                  value={refundAccountId}
                  onChange={(e) => setRefundAccountId(e.target.value)}
                >
                  <option value="">Select QuickBooks account…</option>
                  {MOCK_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                color="gray"
                onClick={handleSaveRefundAccount}
                disabled={savingRefund}
                className="w-full cursor-pointer sm:w-auto"
              >
                {savingRefund ? "Saving..." : "Save"}
              </Button>
            </div>
          </section>
        </div>

        {/* ================= Unlink All Data Modal ================= */}
        <Modal show={unlinkModalOpen} onClose={closeUnlinkModal} size="md">
          <ModalHeader>
            Are you sure you want to unlink all QuickBooks data?
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4 text-sm text-gray-700">
              <p>
                You are about to unlink all of your QuickBooks data from
                Calirocks.
              </p>
              <p>
                You can always re-sync this data back to Calirocks if you want
                to add it again.
              </p>

              <div className="mt-2 flex items-start gap-2">
                <Checkbox
                  id="unlink-qb-confirm"
                  checked={unlinkConfirmChecked}
                  onChange={(e) => setUnlinkConfirmChecked(e.target.checked)}
                  className="mt-1 cursor-pointer"
                />
                <Label
                  htmlFor="unlink-qb-confirm"
                  className="text-xs text-gray-700 sm:text-sm"
                >
                  I have read the information above and would like to unlink all
                  of my QuickBooks data from Calirocks.
                </Label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="justify-end">
            <Button
              color="light"
              onClick={closeUnlinkModal}
              disabled={unlinking}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              color="gray"
              onClick={handleConfirmUnlinkAll}
              disabled={unlinking || !unlinkConfirmChecked}
              className="cursor-pointer"
            >
              {unlinking ? "Unlinking..." : "Unlink All QuickBooks Data"}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
};

export default QuickBooksPage;
