//App/Promotions/index.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { usePromotions } from "../../hooks/Promotions/usePromotions";
import { Promotion, DaysOfWeek } from "../../types/promotions";
import { Button, Badge } from "flowbite-react";
import { HiPencil, HiThumbUp, HiCalendar, HiX } from "react-icons/hi";
import PromotionEditForm from "../../components/promotions/PromotionEditForm";
import DraggableModalWrapper from "../../components/ui/DraggableModalWrapper";
import { MdCampaign } from "react-icons/md";

const Promotions: React.FC = () => {
  const navigate = useNavigate();
  const { discounts, updatePromotion, loading } = usePromotions();

  const handleNewPromotion = () => {
    navigate("/admin/promotions/new");
  };

  const handleEditPromotion = (promotion: Promotion) => {
    navigate(`/admin/promotions/edit/${promotion.id}`);
  };

  const handleEditSave = async (promotion: Promotion, formData: any) => {
    try {
      await updatePromotion(promotion.id, formData);
    } catch (error) {
      console.error("Failed to update promotion:", error);
    }
  };

  // const pathPrefix = window.location.pathname.split("/")[1];

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

  const dayLine = (days: DaysOfWeek) => {
    const order: (keyof DaysOfWeek)[] = [
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ];
    const label: Record<keyof DaysOfWeek, string> = {
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
    };
    const list = order.filter((k) => days[k]).map((k) => label[k]);
    return list.length ? `Days: ${list.join(", ")}` : "Days: -";
  };
  // modal state
  const [open, setOpen] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<"active" | "cancelled">(
    "active",
  );
  const [modalPromo, setModalPromo] = React.useState<Promotion | null>(null);
  // modal rows
  const modalRows =
    modalPromo == null
      ? []
      : modalTab === "active"
        ? (modalPromo.activeBookings ?? [])
        : (modalPromo.cancelledBookings ?? []);

  const titleCount = modalRows.length;
  const title =
    modalPromo == null
      ? ""
      : `${titleCount} Booking${titleCount === 1 ? "" : "s"} using code: ${modalPromo.code}`;

  const openModal = (promo: Promotion, tab: "active" | "cancelled") => {
    setModalPromo(promo);
    setModalTab(tab);
    setOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        name: "Promotion Code",
        selector: (row: Promotion) => row.code,
        sortable: true,
        width: "18%",
        cell: (row: Promotion) => (
          <div className="flex items-center">
            <div className="">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="font-mono">{row.code}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Discount",
        selector: (row: Promotion) => row.discount,
        sortable: false,
        width: "10%",
        cell: (row: Promotion) => (
          <div className="text-sm text-gray-900">
            <span className="font-semibold">{row.discount}</span>
          </div>
        ),
      },

      {
        name: "Limitation",
        cell: (r: Promotion) => (
          <div className="space-y-1">
            {/* <div className="space-y-"> */}
            {r.limit?.perCustomer != null && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <HiThumbUp className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{r.limit.perCustomer}</span>
              </div>
            )}
            {r.serviceDateEnd && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <HiCalendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{fmtDate(r.serviceDateEnd)}</span>
              </div>
            )}
            {r.limit?.newCustomerAfter && (
              <div className="text-xs text-gray-500">
                New customer after:{" "}
                <span className="font-medium">
                  {fmtDate(r.limit.newCustomerAfter)}
                </span>
              </div>
            )}
            {/* </div> */}
            {(r.serviceDateStart || r.serviceDateEnd) && (
              <div className="text-xs text-gray-500">
                Service date: {fmtDate(r.serviceDateStart)} –{" "}
                {fmtDate(r.serviceDateEnd)}
              </div>
            )}
            <div className="text-xs text-gray-500">{dayLine(r.daysOfWeek)}</div>
          </div>
        ),
        grow: 2,
      },
      {
        name: "Number of Uses",
        cell: (r: Promotion) => {
          const active = r.activeBookings?.length ?? 0;
          const cancelled = r.cancelledBookings?.length ?? 0;
          return (
            <div className="flex flex-col items-start gap-1">
              {active > 0 ? (
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:underline cursor-pointer"
                  onClick={() => openModal(r, "active")}
                >
                  {active} active bookings
                </button>
              ) : (
                <span className="text-xs text-gray-400">0 active bookings</span>
              )}
              {cancelled > 0 ? (
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:underline cursor-pointer"
                  onClick={() => openModal(r, "cancelled")}
                >
                  {cancelled} cancelled bookings
                </button>
              ) : (
                <span className="text-xs text-gray-400">
                  0 cancelled bookings
                </span>
              )}
            </div>
          );
        },
        width: "180px",
      },
      {
        name: "Type",
        selector: (row: Promotion) => row.type,
        sortable: false,
        width: "15%",
        cell: (row: Promotion) => (
          <Badge color={row.type === "Booking" ? "" : ""} size="sm">
            {row.type}
          </Badge>
        ),
      },
    ],
    [],
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const sortOptions = [
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Promotion, b: Promotion) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    },
    {
      value: "usage",
      label: "Most Used",
      sortFn: (a: Promotion, b: Promotion) =>
        (b.usageCount || 0) - (a.usageCount || 0),
    },
    {
      value: "ends",
      label: "Expiring",
      sortFn: (a: Promotion, b: Promotion) =>
        new Date(a.serviceDateEnd || Infinity).getTime() -
        new Date(b.serviceDateEnd || Infinity).getTime(),
    },
  ];

  const renderEditForm = (
    promotion: Promotion,
    onSave: (data: any) => void,
    onCancel: () => void,
  ) => (
    <PromotionEditForm
      promotion={promotion}
      onSave={(data) => {
        handleEditSave(promotion, data);
        onSave(data);
      }}
      onCancel={onCancel}
    />
  );

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
            <MdCampaign className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Promotions ({discounts.length})
            </span>
            <div className="text-sm text-gray-500">Manage Promotions</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewPromotion}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Promotion
        </Button>
      </div>

      <AppDataTable
        data={discounts}
        columns={columns}
        searchPlaceholder="Search codes, discount…"
        searchKeys={["code", "discount", "type"]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="active"
        sortOptions={sortOptions}
        defaultSort="newest"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        enableInlineEdit={true}
        renderEditForm={renderEditForm}
        showEditButton={true}
        mobileCard={{
          titleField: "code",
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "discount",
              label: "Discount",
              render: (value) => (
                <div>
                  <div className="text-sm font-semibold">{value}</div>
                </div>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (value) => <Badge size="xs">{value}</Badge>,
            },
            {
              key: "usageCount",
              label: "Usage",
              render: (value) => <span>{value || 0} uses</span>,
            },
            {
              key: "daysOfWeek",
              label: "Valid Days",
              render: (value) => (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(value).map(([day, enabled]) => (
                    <span
                      key={day}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-medium uppercase ${
                        enabled
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {day.charAt(0)}
                    </span>
                  ))}
                </div>
              ),
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              icon: <HiPencil className="h-3 w-3" />,
              onClick: handleEditPromotion,
            },
          ],
        }}
      />
      {/* Bookings Modal */}
      {open && modalPromo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className="relative mx-auto w-full max-w-3xl">
            <DraggableModalWrapper isOpen={open}>
              <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
                {/* Header (drag handle area) */}
                <div
                  data-drag-handle
                  className="flex items-center justify-between border-b border-gray-200 px-6 py-5 select-none"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h3>
                  <button
                    type="button"
                    className="no-drag inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>

                {/* Subheader line (matches screenshot spacing/tone) */}
                <div className="px-6 pt-4 pb-2 text-sm text-gray-600">
                  Discount code{" "}
                  <span className="font-medium text-gray-900">
                    {modalPromo.code}
                  </span>{" "}
                  was used towards these bookings:
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalTab("active")}
                      className={`no-drag -mb-px rounded-t-md px-3.5 py-2 text-sm cursor-pointer ${
                        modalTab === "active"
                          ? "border-b-2 border-gray-600 font-medium text-gray-700"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Active ({modalPromo.activeBookings?.length ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("cancelled")}
                      className={`no-drag -mb-px rounded-t-md px-3.5 py-2 text-sm cursor-pointer ${
                        modalTab === "cancelled"
                          ? "border-b-2 border-gray-600 font-medium text-gray-700"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Cancelled ({modalPromo.cancelledBookings?.length ?? 0})
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="max-h-[60vh] overflow-auto px-6 py-4">
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Customer
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Service Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {modalRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-8 text-center text-sm text-gray-500"
                            >
                              No records found.
                            </td>
                          </tr>
                        ) : (
                          modalRows.map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {row.customer}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {fmtDate(row.serviceDate)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer (optional; keep for consistency with screenshot) */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="no-drag cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </DraggableModalWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
