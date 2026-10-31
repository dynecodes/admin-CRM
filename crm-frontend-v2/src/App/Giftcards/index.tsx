// src/App/Giftcards/index.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useGiftcards } from "../../hooks/useGiftcards";
import { GiftcardPurchase } from "../../types/giftcards";
import { Button, Badge } from "flowbite-react";
import { HiCog } from "react-icons/hi";
import { FiGift } from "react-icons/fi";
import GiftcardActionsMenu from "../../components/giftcards/GiftcardActionsMenu";

const INLINE_VIEW = true; // Enable expandable rows

const Giftcards: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];
  const { giftcards, loading } = useGiftcards();

  const handleNewGiftcard = () => {
    navigate(`/${pathPrefix}/giftcards/new`);
  };

  const handleSettings = () => {
    navigate(`/${pathPrefix}/giftcards/settings`);
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return "-";
    const t = new Date(d);
    return Number.isNaN(t.getTime())
      ? "-"
      : t.toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
  };

  const fmtCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      {
        name: "Code",
        selector: (row: GiftcardPurchase) => row.code,
        sortable: true,
        width: "15%",
        cell: (row: GiftcardPurchase) => (
          <div className="flex items-center">
            <div className="font-mono text-sm font-semibold text-gray-900">
              {row.code}
            </div>
          </div>
        ),
      },
      {
        name: "Sender",
        selector: (row: GiftcardPurchase) => row.sender,
        sortable: true,
        width: "18%",
        cell: (row: GiftcardPurchase) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {row.sender}
            </div>
            <div className="text-xs text-gray-500">{row.senderEmail}</div>
          </div>
        ),
      },
      {
        name: "Recipient",
        selector: (row: GiftcardPurchase) => row.recipient,
        sortable: true,
        width: "17%",
        cell: (row: GiftcardPurchase) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {row.recipient}
            </div>
            <div className="text-xs text-gray-500">{row.recipientEmail}</div>
          </div>
        ),
      },
      {
        name: "Purchase Details",
        width: "25%",
        cell: (row: GiftcardPurchase) => (
          <div className="space-y-1">
            <div className="text-sm text-gray-900">
              <span className="font-medium">Balance:</span>{" "}
              {fmtCurrency(row.balance)}
            </div>
            <div className="text-sm text-gray-900">
              <span className="font-medium">Amount Purchased:</span>{" "}
              {fmtCurrency(row.amount)}
            </div>
            <div className="text-xs text-gray-500">
              Date of Purchase: {fmtDate(row.purchaseDate)}
            </div>
            <div className="text-xs text-gray-500">
              Transaction ID: {row.transactionId || "-"}
            </div>
          </div>
        ),
        grow: 2,
      },

      {
        name: "Status",
        selector: (row: GiftcardPurchase) => row.status,
        sortable: true,
        width: "15%",
        cell: (row: GiftcardPurchase) => (
          <Badge
            color={
              row.status === "active"
                ? "success"
                : row.status === "redeemed"
                  ? "info"
                  : row.status === "cancelled"
                    ? "failure"
                    : "gray"
            }
            size="sm"
          >
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        ),
      },
    ],
    [],
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "redeemed", label: "Redeemed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "archived", label: "Archived" },
  ];

  const sortOptions = [
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: GiftcardPurchase, b: GiftcardPurchase) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: GiftcardPurchase, b: GiftcardPurchase) =>
        new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    },
  ];

  if (loading) {
    return (
      <div className="px-5 pb-10 text-gray-900 antialiased">
        {/* header skeleton */}
        <div className="mb-4 flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 rounded bg-gray-200"></div>
              <div className="h-4 w-40 rounded bg-gray-200"></div>
            </div>
          </div>
          <div className="h-10 w-32 rounded bg-gray-200"></div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="space-y-3 p-4">
            <div className="h-10 rounded bg-gray-100"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded bg-gray-50"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
              <FiGift className="h-6 w-6 text-white"/>
          </div>     
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Gift Cards ({giftcards.length})
            </span>
            <div className="text-sm text-gray-500">Manage Gift Card Sales</div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            color="light"
            onClick={handleSettings}
            className="w-full cursor-pointer sm:w-auto"
          >
            <HiCog className="mr-2 h-5 w-5" />
            Settings
          </Button>
          <Button
            color="gray"
            onClick={handleNewGiftcard}
            className="w-full cursor-pointer sm:w-auto"
          >
            Issue Gift Card
          </Button>
        </div>
      </div>

      <AppDataTable
        data={giftcards}
        columns={columns}
        searchPlaceholder="Search codes, sender, recipient…"
        searchKeys={[
          "code",
          "sender",
          "recipient",
          "senderEmail",
          "recipientEmail",
        ]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="all"
        sortOptions={sortOptions}
        defaultSort="newest"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        // Enable inline expandable view
        enableInlineEdit={INLINE_VIEW}
        showEditButton={INLINE_VIEW}
        // REMOVED: editButtonLabel prop (doesn't exist on AppDataTable)
        // The button will show "Edit" by default, which is fine
        // Render the expandable details
        renderEditForm={
          INLINE_VIEW
            ? (giftcard: GiftcardPurchase, onSave, onCancel) => (
                <GiftcardActionsMenu
                  giftcard={giftcard}
                  onAction={onSave}
                  isExpanded={true}
                  onClose={onCancel}
                  onCancel={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                />
              )
            : undefined
        }
        // Mobile card configuration
        mobileCard={{
          titleField: "code",
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "sender",
              label: "From",
              render: (value, row) => (
                <div>
                  <div className="text-sm font-medium">{value}</div>
                  <div className="text-xs text-gray-500">
                    {(row as GiftcardPurchase).senderEmail}
                  </div>
                </div>
              ),
            },
            {
              key: "recipient",
              label: "To",
              render: (value, row) => (
                <div>
                  <div className="text-sm font-medium">{value}</div>
                  <div className="text-xs text-gray-500">
                    {(row as GiftcardPurchase).recipientEmail}
                  </div>
                </div>
              ),
            },
            {
              key: "balance",
              label: "Balance",
              render: (value) => (
                <span className="font-semibold">
                  {fmtCurrency(value as number)}
                </span>
              ),
            },
            {
              key: "amount",
              label: "Original Amount",
              render: (value) => fmtCurrency(value as number),
            },
          ],
        }}
      />
    </div>
  );
};

export default Giftcards;
