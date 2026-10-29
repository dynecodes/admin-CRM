import * as React from "react";
import { Button, Card, Checkbox } from "flowbite-react";
import { Link } from "react-router-dom";
import { HiShieldCheck } from "react-icons/hi";
import { Staff } from "../../types/staffs";

type Props = {
  staff: Staff;
  onSubmit: (patch: Partial<Staff>) => void;
  onCancel: () => void;
};

export default function EditStaffEmailPrefs({
  staff,
  onSubmit,
  onCancel,
}: Props) {
  const [prefs, setPrefs] = React.useState<
    NonNullable<Staff["emailPreferences"]>
  >({
    availabilitySpecificDateChanged: true,
    defaultAvailabilityAdded: true,
    defaultAvailabilityChanged: true,
    requestTimeOffSubmitted: true,
    ...(staff.emailPreferences || {}),
  });

  const setPref = (k: keyof typeof prefs, v: boolean) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ emailPreferences: prefs });
  };

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/staffs`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Staffs
            </Link>
          </li>
          <li className="inline-flex items-center">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <Link
                to={`/${pathPrefix}/staffs/edit/${staff.id}`}
                className="text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
              >
                Edit Staff
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                Email Preferences
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white sm:h-14 sm:w-14">
          <HiShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Email Preferences</h1>
          <p className="text-sm text-gray-500">
            Choose which notifications this staff member will receive
          </p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 sm:space-y-6">
        <Card>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={!!prefs.availabilitySpecificDateChanged}
                onChange={(e) =>
                  setPref(
                    "availabilitySpecificDateChanged",
                    e.currentTarget.checked,
                  )
                }
              />
              <span className="text-sm">
                Availability for Specific Date changed
              </span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={!!prefs.defaultAvailabilityAdded}
                onChange={(e) =>
                  setPref("defaultAvailabilityAdded", e.currentTarget.checked)
                }
              />
              <span className="text-sm">Default Availability added</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={!!prefs.defaultAvailabilityChanged}
                onChange={(e) =>
                  setPref("defaultAvailabilityChanged", e.currentTarget.checked)
                }
              />
              <span className="text-sm">Default Availability changed</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={!!prefs.requestTimeOffSubmitted}
                onChange={(e) =>
                  setPref("requestTimeOffSubmitted", e.currentTarget.checked)
                }
              />
              <span className="text-sm">Request for Time Off submitted</span>
            </label>
          </div>
        </Card>

        <div className="pt-0 sm:pt-1">
          <div className="flex gap-3">
            <Button
              color="light"
              type="button"
              onClick={onCancel}
              className="px-4"
            >
              Cancel
            </Button>{" "}
            <Button type="submit" color="blue" className="px-6">
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
