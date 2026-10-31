// src/App/Referrals/index.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Button } from "flowbite-react";
import { HiOutlineUsers } from "react-icons/hi";

// ✅ adjust these paths if your project differs
import { useReferrals } from "../../hooks/useReferrals";
import type { ReferralProgram } from "../../types/referrals";
import ReferralEditForm from "../../components/referrals/ReferralEditForm"; // (Section 2)

const INLINE_EDIT = true; // set to false if you prefer page navigation like /admin/
// s/edit/:id

const fmtMoney = (n: number | null | undefined) =>
  typeof n === "number" ? `$${n.toFixed(2)}` : "$0.00";

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

const Referrals: React.FC = () => {
  const navigate = useNavigate();
  const { referrals, updateReferral, loading } = useReferrals(); // shape: ReferralProgram[]

  const handleNew = () => navigate("/admin/referrals/new");

  const handleEditReferral = (ref: ReferralProgram) => {
    if (INLINE_EDIT) return; // handled by inline modal
    navigate(`/admin/referrals/edit/${ref.id}`);
  };

  const handleEditSave = async (referral: ReferralProgram, formData: any) => {
    try {
      await updateReferral(referral.id, formData);
    } catch (e) {
      console.error("Failed to update referral:", e);
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "Start Date",
        selector: (row: ReferralProgram) => row.startDate,
        sortable: true,
        width: "22%",

        cell: (row: ReferralProgram) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {fmtDate(row.startDate)}
          </div>
        ),
      },
      {
        name: "End Date",
        selector: (row: ReferralProgram) => row.endDate,
        sortable: true,
        width: "22%",
        // minWidth: "140px",
        cell: (row: ReferralProgram) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {fmtDate(row.endDate)}
          </div>
        ),
      },
      {
        name: "Discount",
        selector: (row: ReferralProgram) => row.discount ?? 0,
        sortable: true,
        width: "22%",
        // minWidth: "110px",
        cell: (row: ReferralProgram) => (
          <div className="mt-3 px-1 text-sm font-semibold text-gray-900">
            {fmtMoney(row.discount ?? 0)}
          </div>
        ),
      },
      {
        name: "Reward",
        selector: (row: ReferralProgram) => row.reward ?? 0,
        sortable: true,
        width: "22%",
        // minWidth: "110px",
        cell: (row: ReferralProgram) => (
          <div className="mt-3 px-1 text-sm font-semibold text-gray-900">
            {fmtMoney(row.reward ?? 0)}
          </div>
        ),
      },
    ],
    [],
  );

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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          {/* gray Circle Icon */}
        <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
          <HiOutlineUsers className="h-6 w-6 text-white"/>
        </div>

          {/* Title Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Referral Programs ({referrals.length})
            </h1>
            <div className="text-sm text-gray-500">
              Manage Referral Programs
            </div>
          </div>
        </div>

        <Button
          color="gray"
          onClick={handleNew}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Referral
        </Button>
      </div>

      <div className="overflow-x-auto">
        <AppDataTable
          data={referrals}
          columns={columns}
          searchPlaceholder="Search by dates…"
          searchKeys={["startDate", "endDate"]} // extend if you allow more fields
          // simple filter/sort (optional)
          filterOptions={[
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
          filterKey="status"
          defaultFilter="active"
          sortOptions={[
            {
              value: "newest",
              label: "Newest",
              sortFn: (a: ReferralProgram, b: ReferralProgram) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime(),
            },
          ]}
          defaultSort="newest"
          paginationOptions={[10, 20, 50, 100]}
          defaultPerPage={20}
          enableInlineEdit={INLINE_EDIT}
          showEditButton={INLINE_EDIT} // let the table show its inline Edit affordance (three-dots/btn)
          renderEditForm={
            INLINE_EDIT
              ? (ref: ReferralProgram, onSave, onCancel) => (
                  <ReferralEditForm
                    referral={ref}
                    onSave={(data: any) => {
                      handleEditSave(ref, data);
                      onSave(data);
                    }}
                    onCancel={onCancel}
                  />
                )
              : undefined
          }
          // === Mobile card actions (same Edit action) ===
          mobileCard={{
            titleField: "startDate",
            statusField: "status",
            enableEdit: true,
            fields: [
              { key: "endDate", label: "End", render: (v) => fmtDate(v) },
              {
                key: "discount",
                label: "Discount",
                render: (v) => fmtMoney(v),
              },
              { key: "reward", label: "Reward", render: (v) => fmtMoney(v) },
            ],
            actions: [
              {
                label: "Edit",
                color: "gray",
                onClick: handleEditReferral,
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default Referrals;
