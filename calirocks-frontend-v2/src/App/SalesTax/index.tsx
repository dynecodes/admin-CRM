// src/App/SalesTax/index.tsx
import React, { useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Checkbox,
  Label,
} from "flowbite-react";
import { HiExclamationCircle, HiCog, HiOutlineCurrencyDollar } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useSalesTax } from "../../hooks/SalesTax/useSalesTax";
import { useLocations } from "../../hooks/Locations/useLocations";
import type { SalesTax, SalesTaxHistoryEntry } from "../../types/salesTax";
import SalesTaxInlineEditForm from "../../components/salesTax/SalesTaxInlineEditForm";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  settingsEnabled: boolean;
  updateSettings: (next: { enabled: boolean }) => Promise<any>;
};

type HistoryModalProps = {
  open: boolean;
  onClose: () => void;
  rule: SalesTax | null;
  getHistory: (id: number) => Promise<SalesTaxHistoryEntry[]>;
};

type RecalcModalProps = {
  open: boolean;
  onClose: () => void;
  rule: SalesTax | null;
  recalculateRule: (id: number) => Promise<any>;
};

/* ================================================================== */
/* Main Page                                                          */
/* ================================================================== */

const SalesTaxPage: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1] || "admin";

  const salesTax = useSalesTax();
  const { locations } = useLocations();

  const {
    rules,
    loading,
    settings,
    settingsLoading,
    updateRule,
    getHistory,
    updateSettings,
    recalculateRule,
  } = salesTax;

  const [locationFilter, setLocationFilter] = useState<"all" | number>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRule, setHistoryRule] = useState<SalesTax | null>(null);
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [recalcRuleState, setRecalcRuleState] = useState<SalesTax | null>(null);

  const activeLocations = locations.filter((l) => l.status === "active");

  const filteredRules = useMemo(() => {
    if (locationFilter === "all") return rules;

    return rules.filter((r) =>
      !r.location_ids || r.location_ids.length === 0
        ? true
        : r.location_ids.includes(locationFilter as number),
    );
  }, [rules, locationFilter]);

  const columns = useMemo(
    () => [
      {
        name: "Effective Date",
        selector: (row: SalesTax) => row.effective_date,
        sortable: true,
        width: "25%",
        cell: (row: SalesTax) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {new Date(row.effective_date).toLocaleDateString()}
          </div>
        ),
      },
      {
        name: "Tax %",
        selector: (row: SalesTax) => row.tax_percent,
        sortable: true,
        width: "20%",
        cell: (row: SalesTax) => (
          <div className="mt-3 px-1 text-sm font-semibold text-gray-900">
            {row.tax_percent.toFixed(2)}%
          </div>
        ),
      },
      {
        name: "Location",
        selector: (row: SalesTax) =>
          !row.location_ids || row.location_ids.length === 0
            ? "All Locations"
            : row.location_ids
                .map((id) => locations.find((l) => l.id === id)?.name)
                .filter(Boolean)
                .join(", "),
        sortable: true,
        width: "45%",
        cell: (row: SalesTax) => {
          const names =
            !row.location_ids || row.location_ids.length === 0
              ? [""]
              : (row.location_ids
                  .map((id) => locations.find((l) => l.id === id)?.name)
                  .filter(Boolean) as string[]);

          return (
            <div className="mt-3 px-1 text-sm text-gray-900">
              {names.join(", ")}
            </div>
          );
        },
      },
    ],
    [locations],
  );

  const sortOptions = [
    {
      value: "effective_newest",
      label: "Newest First",
      sortFn: (a: SalesTax, b: SalesTax) =>
        new Date(b.effective_date).getTime() -
        new Date(a.effective_date).getTime(),
    },
    {
      value: "effective_oldest",
      label: "Oldest First",
      sortFn: (a: SalesTax, b: SalesTax) =>
        new Date(a.effective_date).getTime() -
        new Date(b.effective_date).getTime(),
    },
  ];

  const handleHistoryClick = (rule: SalesTax) => {
    setHistoryRule(rule);
    setHistoryOpen(true);
  };

  const handleRecalcClick = (rule: SalesTax) => {
    setRecalcRuleState(rule);
    setRecalcOpen(true);
  };

  const handleNew = () => {
    navigate(`/${pathPrefix}/sales-tax/new`);
  };

  // navigate to full-page edit (used by mobile card)
  const handleEditSalesTax = (rule: SalesTax) => {
    navigate(`/${pathPrefix}/sales-tax/edit/${rule.id}`);
  };

  // inline edit form (desktop)
  const renderEditForm = (
    rule: SalesTax,
    rowOnSave: (updated: SalesTax) => void,
    rowOnCancel: () => void,
  ) => (
    <SalesTaxInlineEditForm
      rule={rule}
      locations={locations}
      onSave={async (data: Partial<SalesTax>) => {
        const updated = await updateRule(rule.id, data);
        rowOnSave(updated);
      }}
      onCancel={rowOnCancel}
      onViewHistory={() => handleHistoryClick(rule)}
      onRecalculate={() => handleRecalcClick(rule)}
    />
  );

  if (!settings || settingsLoading) {
    return (
      <div className="p-4 text-sm text-gray-600 sm:p-6">
        Loading sales tax settings...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-5 pb-10">
        <div className="mb-4 h-9 w-40 animate-pulse rounded bg-gray-200" />
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="h-10 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Header with Settings + Add New (match Tags layout) */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        {/* Left: icon + title/description */}
        <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
              <HiOutlineCurrencyDollar className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Sales Taxes ({rules.length})
            </span>
            <div className="text-sm text-gray-500">
              Manage sales tax rules for your locations
            </div>
          </div>
        </div>

        {/* Right: buttons */}
        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
          <Button
            className="w-full cursor-pointer sm:w-auto"
            color="light"
            onClick={() => setSettingsOpen(true)}
          >
            <HiCog className="mr-2 h-5 w-5" />
            Settings
          </Button>
          <Button
            className="w-full cursor-pointer sm:w-auto"
            color="gray"
            onClick={handleNew}
          >
            Add New
          </Button>
        </div>
      </div>

      {/* Location filter dropdown */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex w-[160px] flex-col">
          <Dropdown
            label={
              locationFilter === "all"
                ? "Active Locations"
                : locations.find((l) => l.id === locationFilter)?.name ||
                  "All Locations"
            }
            size="sm"
            dismissOnClick
            className="cursor-pointer"
            theme={{
              floating: {
                target:
                  "inline-flex w-full items-center justify-between rounded-lg bg-gray-700 px-4 py-2.5 text-sm whitespace-nowrap text-white hover:bg-gray-800 focus:outline-none focus:ring-3 focus:ring-gray-300",
              },
            }}
          >
            {activeLocations.map((loc) => (
              <DropdownItem
                key={loc.id}
                className="w-[160px]"
                onClick={() => setLocationFilter(loc.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{loc.name}</span>
                  {locationFilter === loc.id && <span>&#10003;</span>}
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* DataTable */}
      <AppDataTable
        data={filteredRules}
        columns={columns}
        searchPlaceholder="Search by date…"
        searchKeys={["effective_date"]}
        filterOptions={[{ value: "all", label: "All" }]}
        filterKey="__dummy"
        defaultFilter="all"
        sortOptions={sortOptions}
        defaultSort="effective_newest"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        enableInlineEdit={true}
        renderEditForm={renderEditForm}
        showEditButton={true}
        mobileCard={{
          titleField: "effective_date",
          titleRender: (rule: SalesTax) =>
            new Date(rule.effective_date).toLocaleDateString(),
          statusField: undefined,
          enableEdit: true,
          fields: [
            {
              key: "tax_percent",
              label: "Tax %",
              render: (v: number) =>
                typeof v === "number" ? `${v.toFixed(2)}%` : "-",
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              triggerInlineEdit: true,
              onClick: (rule: SalesTax) => handleEditSalesTax(rule),
            },
          ],
        }}
      />

      {/* Modals */}
      <SalesTaxSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settingsEnabled={settings.enabled}
        updateSettings={updateSettings}
      />
      <SalesTaxHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        rule={historyRule}
        getHistory={getHistory}
      />
      <SalesTaxRecalculateModal
        open={recalcOpen}
        onClose={() => setRecalcOpen(false)}
        rule={recalcRuleState}
        recalculateRule={recalculateRule}
      />
    </div>
  );
};

/* ================================================================== */
/* Settings modal                                                     */
/* ================================================================== */

const SalesTaxSettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  settingsEnabled,
  updateSettings,
}) => {
  const [enabled, setEnabled] = useState<boolean>(settingsEnabled);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setEnabled(settingsEnabled);
    setConfirmChecked(false);
    setError(null);
  }, [settingsEnabled, open]);

  const explanation = enabled
    ? "I understand that by turning Sales Tax on, a sales tax will be added to all bookings that have not been paid for yet."
    : "I understand that by turning Sales Tax off, sales taxes will be removed from all active bookings (i.e. upcoming and completed bookings) that have not been paid for yet.";

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateSettings({ enabled });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader className="border-t border-gray-200">
        Sales Tax Settings
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            When enabled, this feature adds a sales tax to the final amount of
            your bookings.
          </p>
          <p>
            After discounts and price adjustments are applied to the booking, a
            sales tax is calculated based on the sales tax rate and the final
            price of the booking.
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Sales Tax is
            </span>
            <button
              type="button"
              onClick={() => setEnabled((prev) => !prev)}
              className={`relative inline-flex h-7 w-16 cursor-pointer items-center rounded-full border px-1 text-xs ${
                enabled
                  ? "border-gray-600 bg-gray-600 text-white"
                  : "border-gray-300 bg-gray-100 text-gray-700"
              }`}
            >
              <span
                className={`inline-flex h-5 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[11px] font-semibold ${
                  enabled ? "translate-x-6" : "translate-x-0"
                } transition-transform`}
              >
                {enabled ? "On" : "Off"}
              </span>
            </button>
          </div>

          <div className="mt-2 flex items-start gap-2">
            <Checkbox
              color="gray"
              id="sales-tax-confirm"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-1 cursor-pointer"
            />
            <Label
              htmlFor="sales-tax-confirm"
              className="text-xs text-gray-700 sm:text-sm"
            >
              {explanation}
            </Label>
          </div>

          {error && (
            <Alert color="failure" icon={HiExclamationCircle}>
              <span className="text-xs sm:text-sm">{error}</span>
            </Alert>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button color="light" className="cursor-pointer" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="gray"
          onClick={handleSave}
          className="cursor-pointer"
          disabled={!confirmChecked || saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================================================================== */
/* History modal                                                      */
/* ================================================================== */

const SalesTaxHistoryModal: React.FC<HistoryModalProps> = ({
  open,
  onClose,
  rule,
  getHistory,
}) => {
  const [entries, setEntries] = useState<SalesTaxHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!open || !rule) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const list = await getHistory(rule.id);
        if (!cancelled) setEntries(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [open, rule, getHistory]);

  if (!open || !rule) return null;

  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  return (
    <Modal show={open} onClose={onClose} size="2xl">
      <ModalHeader className="border-t border-gray-200">
        Changes report
      </ModalHeader>
      <ModalBody>
        <div className="max-h-[60vh] overflow-auto py-2">
          {/* ========================= DESKTOP (table) ========================= */}
          <div className="hidden px-1 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 align-top">Who</th>
                  <th className="px-4 py-2 align-top">What</th>
                  <th className="px-4 py-2 align-top">When</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Loading history...
                    </td>
                  </tr>
                )}

                {!loading &&
                  entries.map((entry, idx) => {
                    const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
                    return (
                      <tr
                        key={entry.id}
                        className={`${rowBg} border-b border-gray-200 align-top last:border-b-0`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.user_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-pre-line text-gray-800">
                          {entry.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {fmtWhen(entry.created_at)}
                          <div className="mt-1 text-xs text-gray-400">
                            IP: {entry.ip_address ?? "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No changes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================= MOBILE (stacked) ======================== */}
          <div className="space-y-3 px-4 md:hidden">
            {loading && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                Loading history...
              </div>
            )}

            {!loading && entries.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                No changes yet.
              </div>
            )}

            {!loading &&
              entries.map((entry, idx) => (
                <div key={entry.id} className="overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {/* Who */}
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-2 text-sm">
                      <div className="font-semibold text-gray-600">Who</div>
                      <div className="text-gray-900">
                        {entry.user_name || "—"}
                      </div>
                    </div>

                    {/* What */}
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-white px-3 py-3 text-sm">
                      <div className="pt-[2px] font-semibold text-gray-600">
                        What
                      </div>
                      <div className="whitespace-pre-line text-gray-800">
                        {entry.action}
                      </div>
                    </div>

                    {/* When */}
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-3 text-sm">
                      <div className="pt-[2px] font-semibold text-gray-600">
                        When
                      </div>
                      <div className="text-gray-800">
                        {fmtWhen(entry.created_at)}
                        <div className="mt-1 text-xs text-gray-400">
                          IP: {entry.ip_address ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* subtle separator between records */}
                  {idx !== entries.length - 1 && (
                    <div className="h-[1px] bg-gray-200" />
                  )}
                </div>
              ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button color="light" onClick={onClose} className="cursor-pointer">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================================================================== */
/* Recalculate modal                                                  */
/* ================================================================== */

const SalesTaxRecalculateModal: React.FC<RecalcModalProps> = ({
  open,
  onClose,
  rule,
  recalculateRule,
}) => {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!rule) return null;

  const handleRecalc = async () => {
    setRunning(true);
    setError(null);
    try {
      await recalculateRule(rule.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to recalculate sales taxes");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader className="border-t border-gray-200">
        Recalculate Sales Taxes?
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-700">
          The sales taxes for bookings linked to this Sales Tax setting will be
          recalculated now.
        </p>
        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mt-3">
            <span className="text-xs sm:text-sm">{error}</span>
          </Alert>
        )}
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button color="light" onClick={onClose} className="cursor-pointer">
          Cancel
        </Button>
        <Button
          color="gray"
          onClick={handleRecalc}
          className="cursor-pointer"
          disabled={running}
        >
          {running ? "Recalculating..." : "Recalculate"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================================================================== */
/* Exports                                                            */
/* ================================================================== */

export default SalesTaxPage;
