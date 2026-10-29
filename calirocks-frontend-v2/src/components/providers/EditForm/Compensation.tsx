import * as React from "react";
import { Label, Radio } from "flowbite-react";
// import { HiInformationCircle } from "react-icons/hi";
import { ProviderEditForm } from "../../../types/providers";
import NumericInput from "../../ui/NumericInput";

type WageMethod = "percentage" | "hourly" | "flat";
type PaymentDistribution = "team_leader" | "individual_members";

type TeamMemberCompensation = {
  memberId: number;
  name: string;
  phone: string;
  isTeamLead: boolean;
  /** used when method === "percentage" */
  percentage: number;
  /** used when method === "hourly" or "flat" */
  rate: number;
  method: WageMethod;
};

// Only editing these two fields from the parent form
type CompForm = Pick<ProviderEditForm, "paymentDistribution" | "teamPayments">;

type Props = {
  form: CompForm;
  onChange: <K extends keyof CompForm>(k: K, v: CompForm[K]) => void;
};


function MethodSelect({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-10 w-36 rounded-lg border border-gray-300",
          "bg-white focus:bg-white",        // force white even on focus
          "px-3 pr-9 text-sm text-gray-900",
          "appearance-none",                 // hide native arrow
          "focus:outline-none focus:ring-2 cursor-pointer focus:ring-gray-600/40 focus:border-gray-600",
          "disabled:bg-gray-50 disabled:text-gray-400",
        ].join(" ")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

   
    </div>
  );
}


export default function Compensation({ form, onChange }: Props) {
  // Mock team members - replace with actual provider.teamMembers data or form.teamPayments when wired
  const [teamMembers, setTeamMembers] = React.useState<TeamMemberCompensation[]>([
    {
      memberId: 1,
      name: "Sarah Johnson",
      phone: "+1 212-555-0111",
      isTeamLead: true,
      percentage: 50,
      rate: 25, // $25/hr or $ flat depending on method
      method: "percentage",
    },
    {
      memberId: 2,
      name: "Mark Lewis",
      phone: "+1 212-555-0112",
      isTeamLead: false,
      percentage: 50,
      rate: 20,
      method: "percentage",
    },
  ]);

  const paymentDistribution: PaymentDistribution =
    (form.paymentDistribution as PaymentDistribution) || "team_leader";

  const leader = React.useMemo(
    () => teamMembers.find((m) => m.isTeamLead) ?? teamMembers[0],
    [teamMembers]
  );

  // Filter rows based on the selected payment recipient
  const visibleMembers = React.useMemo(() => {
    if (paymentDistribution === "team_leader") {
      return leader ? [leader] : [];
    }
    return teamMembers;
  }, [paymentDistribution, leader, teamMembers]);

  const handleDistributionChange = (value: PaymentDistribution) => {
    onChange("paymentDistribution", value);
  };

  const handleMemberUpdate = (
    memberId: number,
    field: keyof TeamMemberCompensation,
    value: any
  ) => {
    const updated = teamMembers.map((member) =>
      member.memberId === memberId ? { ...member, [field]: value } : member
    );
    setTeamMembers(updated);
    // Keep parent synced with the latest full set (not just the visible subset)
    onChange("teamPayments", updated as any);
  };

  const getNumericValue = (m: TeamMemberCompensation) =>
    m.method === "percentage" ? m.percentage : m.rate;

  const getSuffix = (method: WageMethod) =>
    method === "percentage" ? "%" : method === "hourly" ? "$/hr" : "$";

  const getMax = (method: WageMethod) => (method === "percentage" ? 100 : undefined);

  const onChangeNumeric = (member: TeamMemberCompensation, n: number | null) => {
    const val = Number.isFinite(n as number) ? (n as number) : 0;
    if (member.method === "percentage") {
      handleMemberUpdate(member.memberId, "percentage", val);
    } else {
      handleMemberUpdate(member.memberId, "rate", val);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Distribution */}
      <div className="bg-gray-50 p-4 space-y-4">
        <div className="flex items-center gap-2">
          {/* <HiInformationCircle className="h-7 w-7 text-gray-700" /> */}
          <h3 className="text-base font-semibold text-gray-900">Payment Distribution</h3>
        </div>
        <p className="mb-4 -mt-2 text-sm text-gray-600">
          Configure how payments are distributed among team members
        </p>

        <div className="space-y-3 mt-8">
          <Label className="text-sm font-medium text-gray-700">Payment Recipient</Label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
            {/* Team Leader */}
            <button
              type="button"
              onClick={() => handleDistributionChange("team_leader")}
              className={`flex items-start gap-3 cursor-pointer rounded-lg p-4 text-left ${
                paymentDistribution === "team_leader"
                  ? "border-2 border-gray-600 bg-gray-50"
                  : "border border-gray-300 bg-white"
              }`}
            >
              <Radio
                color="gray"
                id="team_leader"
                name="payment_distribution"
                value="team_leader"
                checked={paymentDistribution === "team_leader"}
                onChange={() => handleDistributionChange("team_leader")}
                className="mt-0.5 cursor-pointer"
              />
              <div className="flex-1">
                <Label htmlFor="team_leader" className="font-medium text-gray-900">
                  Team Leader
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Leader receives all payments and distributes to team
                </p>
              </div>
            </button>

            {/* Individual Members */}
            <button
              type="button"
              onClick={() => handleDistributionChange("individual_members")}
              className={`flex items-start gap-3 cursor-pointer rounded-lg p-4 text-left ${
                paymentDistribution === "individual_members"
                  ? "border-2 border-gray-600 bg-gray-50"
                  : "border border-gray-300 bg-white"
              }`}
            >
              <Radio
                color="gray"
                id="individual_members"
                name="payment_distribution"
                value="individual_members"
                checked={paymentDistribution === "individual_members"}
                onChange={() => handleDistributionChange("individual_members")}
                className="mt-0.5 cursor-pointer"
              />
              <div className="flex-1">
                <Label htmlFor="individual_members" className="font-medium text-gray-900">
                  Individual Members
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Each member receives their share directly
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Member Rows */}
      <div className="bg-gray-50 space-y-6 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Team Member Compensation</h3>
        </div>

        <div className="space-y-3">
          {visibleMembers.map((member) => (
            <div
              key={member.memberId}
              className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 rounded-lg border border-gray-200 bg-white p-4"
            >
              {/* Row 1: Avatar + Name + Phone */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-600 text-white">
                  <span className="text-sm font-semibold">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>

                <div className="min-w-0 flex flex-col sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-sm text-gray-900">
                      {member.name}
                    </span>
                    {member.isTeamLead && (
                      <span className="whitespace-nowrap rounded bg-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
                        <span className="sm:hidden">TL</span>
                        <span className="hidden sm:inline">Team Leader</span>
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">{member.phone}</span>
                </div>
              </div>

             {/* Row 2: Amount/Percentage + Method — aligned & same height */}
              <div className="flex w-full flex-row items-stretch gap-2 sm:justify-end">
                <NumericInput
                  value={getNumericValue(member)}
                  onValueChange={(n) => onChangeNumeric(member, n)}
                  decimals={member.method === "percentage" ? 0 : 2}
                  min={0}
                  max={getMax(member.method)}
                  step={member.method === "percentage" ? 1 : 0.5}
                  placeholder="0"
                  suffix={getSuffix(member.method)}
                  className="h-10 block w-28 sm:w-32 rounded-lg  border border-gray-300 bg-white p-2 pr-8 text-sm leading-none focus:border-gray-600 focus:ring-gray-600"
                />

                <MethodSelect
                  value={member.method}
                  onChange={(v) => handleMemberUpdate(member.memberId, "method", v as WageMethod)}
                  options={[
                    { value: "percentage", label: "Percentage" },
                    { value: "hourly", label: "Hourly" },
                    { value: "flat", label: "Flat Rate" },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
