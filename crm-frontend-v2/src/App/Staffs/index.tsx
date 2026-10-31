import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Button } from "flowbite-react";
import { useStaffs } from "../../hooks/Staffs/useStaffs";
import { Staff } from "../../types/staffs";

const roleLabel: Record<Staff["role"], string> = {
  admin: "Admin",
  staff: "Staff",
  technical: "Technical Admin",
};

const Staffs: React.FC = () => {
  const navigate = useNavigate();
  const { staffs } = useStaffs();

  const pathPrefix = window.location.pathname.split('/')[1];
  const handleNew = () => navigate(`/${pathPrefix}/staffs/new`);
  const handleEdit = (row: Staff) => navigate(`/${pathPrefix}/staffs/edit/${row.id}`);

  const columns = useMemo(
    () => [
      {
        name: "Name",
        selector: (row: Staff) => `${row.firstName} ${row.lastName}`.trim(),
        sortable: true,
        width: "230px",
        // clickable: open edit
        cell: (row: Staff) => (
          <button
            type="button"
            className="text-left cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit staff"
          >
            <div className="text-sm text-gray-900">
              {row.firstName} {row.lastName}
            </div>
          </button>
        ),
      },
      {
        name: "Email",
        selector: (row: Staff) => row.email,
        sortable: true,
        width: "280px",
        // NOT clickable to edit; real mailto link
        cell: (row: Staff) => (
          <a
            href={`mailto:${row.email}`}
            className="text-gray-900 text-sm no-underline hover:cursor-pointer"
            onClick={(e) => e.stopPropagation()} // don't trigger row edit
          >
            {row.email}
          </a>
        ),
      },
      {
        name: "Role",
        selector: (row: Staff) => roleLabel[row.role],
        sortable: true,
        width: "160px",
        // clickable: open edit
        cell: (row: Staff) => (
          <button
            type="button"
            className="text-left w-full text-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit staff"
          >
            {roleLabel[row.role]}
          </button>
        ),
      },
      {
        name: "Confirmed",
        selector: (row: Staff) => (row.confirmed ? 1 : 0), // keeps sorting sensible
        sortable: true,
        width: "160px",
        // clickable: open edit (✓ or —)
        cell: (row: Staff) => (
          <button
            type="button"
            className="text-left w-full cursor-pointer ps-6"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit staff"
          >
            {row.confirmed ? (
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </button>
        ),
      },
    ],
    []
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "2fa_on", label: "2FA Enabled" },
    { value: "2fa_off", label: "2FA Disabled" },
  ];

  const sortOptions = [
    {
      value: "name",
      label: "Name",
      sortFn: (a: Staff, b: Staff) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Staff, b: Staff) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "role",
      label: "Role",
      sortFn: (a: Staff, b: Staff) =>
        roleLabel[a.role].localeCompare(roleLabel[b.role]),
    },
  ];

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="font-medium">
          <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Office Staff ({staffs.length})
          </span>
          <div className="text-sm text-gray-500">Manage staff accounts</div>
        </div>
        <Button
          color="gray"
          onClick={handleNew}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Staff
        </Button>
      </div>

      <AppDataTable
        data={staffs}
        columns={columns}
        searchPlaceholder="Enter the first 3 letters of the name to search"
        searchKeys={["firstName", "lastName", "email", "phone"]}
        filterOptions={filterOptions}
        filterKey="twoFAEnabled"
        defaultFilter="all"
        sortOptions={sortOptions}
        defaultSort="name"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        showEditButton
        onEditClick={handleEdit}   // row click uses this in modal/route mode
        onRowClick={handleEdit}    // fallback
        mobileCard={{
          titleField: "",
          titleRender: (row: Staff) => `${row.firstName} ${row.lastName}`,
          subtitleRender: (row: Staff) => row.email,
          statusField: undefined,
          fields: [
            { key: "role", label: "Role", render: (r: Staff) => roleLabel[r.role] },
            { key: "phone", label: "Phone" },
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              onClick: (item: Staff) => handleEdit(item),
            },
          ],
          enableEdit: false,
        }}
      />
    </div>
  );
};

export default Staffs;
