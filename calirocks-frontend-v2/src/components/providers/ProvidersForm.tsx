import * as React from "react";
import { Button, Label, HelperText, Card, Alert } from "flowbite-react";
import { Link } from "react-router-dom";
import {
  HiUser,
  HiUsers,
  HiExclamationCircle,
  HiChevronUp,
  HiChevronDown,
  HiX,
} from "react-icons/hi";
import { useProviderPeople } from "../../hooks/Providers/useProviderPeople";
import FormActions from "../ui/FormActions";
import { PhoneInput } from "../ui/InputsBundle";
import { TeamMember, ServiceProvider, ProviderFormValue } from "../../types/providers";
import ColorPicker, {
  COLOR_PICKER_DEFAULT,
  normalizeHex,
} from "../ui/ColorPicker";

/* ======================================================================
   Small utilities
====================================================================== */
const DEFAULT_TEAM_COLOR = COLOR_PICKER_DEFAULT;
const required = (s: string) => s.trim().length > 0;

const focusGray =
  "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600";
const inputBase =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm";
const inputBaseWithPlaceholder = inputBase + " placeholder:text-gray-400";
const ok = `border-gray-300 ${focusGray}`;
const bad = `border-red-500 ring-1 ring-red-500/20 ${focusGray}`;

/* ======================================================================
   Types for the form
====================================================================== */


type Props = {
  provider?: ServiceProvider;
  onSubmit: (
    values: Omit<ServiceProvider, "id" | "created_at" | "updated_at">,
  ) => void | Promise<void>;
  onCancel: () => void;
};

type FormValue = ProviderFormValue;
/* ======================================================================
   Form component
====================================================================== */
const empty: ProviderFormValue = {
  providerType: "individual",
  firstName: "",
  lastName: "",
  teamTitle: "",
  teamColor: DEFAULT_TEAM_COLOR,
  memberIds: [],
  email: "",
  phone: "",
  status: "active",
  locationIds: [],
  address: "",
  city: "",
  state: "",
  zip: "",
};

export default function ProviderForm({ provider, onSubmit, onCancel }: Props) {
  const isEdit = !!provider;
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { people, addPerson } = useProviderPeople();

  // Leader autocomplete
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [activeField, setActiveField] = React.useState<
    "firstName" | "lastName" | null
  >(null);
  const autocompleteRef = React.useRef<HTMLDivElement>(null);

  // Add Team Member – local editor
  const [showAddTeamMember, setShowAddTeamMember] = React.useState(false);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [teamMemberForm, setTeamMemberForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [teamMemberErrors, setTeamMemberErrors] = React.useState<any>({});

  // Team member autocomplete
  const [tmSearchTerm, setTmSearchTerm] = React.useState("");
  const [showTmAutocomplete, setShowTmAutocomplete] = React.useState(false);
  const [activeTmField, setActiveTmField] = React.useState<
    "firstName" | "lastName" | null
  >(null);
  const tmAutocompleteRef = React.useRef<HTMLDivElement>(null);

  const [form, setForm] = React.useState<ProviderFormValue>(() => {
    if (provider) {
      const isTeam =
        (provider.memberIds?.length || 0) > 1 || !!provider.teamTitle;
      const existingColor = (provider as any)?.teamColor || DEFAULT_TEAM_COLOR;
      return {
        providerType: isTeam ? "team" : "individual",
        firstName: provider.teamMembers?.[0]?.firstName || "",
        lastName: provider.teamMembers?.[0]?.lastName || "",
        teamTitle: provider.teamTitle || "",
        teamColor: normalizeHex(existingColor, DEFAULT_TEAM_COLOR),
        memberIds: provider.memberIds ?? [],
        email: provider.email,
        phone: provider.phone,
        status: provider.status,
        locationIds: provider.locationIds ?? [],
        address: "",
        city: "",
        state: "",
        zip: "",
      };
    }
    return empty;
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormValue, string>>
  >({});

  // People filter helper
  const filterPeople = React.useCallback(
    (term: string) => {
      if (!term || term.length < 2) return [];
      const t = term.toLowerCase();
      return people
        .filter((p) => {
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
          const firstName = p.firstName.toLowerCase();
          const lastName = p.lastName.toLowerCase();
          const email = (p.email || "").toLowerCase();
          return (
            fullName.includes(t) ||
            firstName.includes(t) ||
            lastName.includes(t) ||
            email.includes(t)
          );
        })
        .slice(0, 5);
    },
    [people],
  );

  const filteredPeople = React.useMemo(
    () => filterPeople(searchTerm),
    [filterPeople, searchTerm],
  );
  const filteredTmPeople = React.useMemo(
    () => filterPeople(tmSearchTerm),
    [filterPeople, tmSearchTerm],
  );

  // Click-outside for autocomplete
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (autocompleteRef.current && !autocompleteRef.current.contains(target))
        setShowAutocomplete(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        tmAutocompleteRef.current &&
        !tmAutocompleteRef.current.contains(target)
      )
        setShowTmAutocomplete(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = <K extends keyof ProviderFormValue>(key: K, val: ProviderFormValue[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSelectPerson = (person: any) => {
    setForm((f) => ({
      ...f,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email || f.email,
      phone: person.phone || f.phone,
      address: person.address || f.address,
      city: person.city || f.city,
      state: person.state || f.state,
      zip: person.zip || f.zip,
    }));
    setSearchTerm("");
    setShowAutocomplete(false);
    setActiveField(null);
  };

  const handleInputWithAutocomplete = (
    field: "firstName" | "lastName",
    value: string,
  ) => {
    handleChange(field, value);
    setSearchTerm(value);
    setActiveField(field);
    setShowAutocomplete(value.length >= 2);
  };

  const handleSelectTmPerson = (person: any) => {
    setTeamMemberForm({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email || "",
      phone: person.phone || "",
      address: person.address || "",
      city: person.city || "",
      state: person.state || "",
      zip: person.zip || "",
    });
    setTmSearchTerm("");
    setShowTmAutocomplete(false);
    setActiveTmField(null);
  };

  const handleTmInputWithAutocomplete = (
    field: "firstName" | "lastName",
    value: string,
  ) => {
    setTeamMemberForm((f) => ({ ...f, [field]: value }));
    setTmSearchTerm(value);
    setActiveTmField(field);
    setShowTmAutocomplete(value.length >= 2);
  };

  // Add team member helpers
  const validateTeamMember = () => {
    const next: any = {};
    if (!required(teamMemberForm.firstName))
      next.firstName = "First name is required";
    if (!required(teamMemberForm.lastName))
      next.lastName = "Last name is required";
    if (!required(teamMemberForm.email)) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(teamMemberForm.email))
      next.email = "Enter a valid email";
    if (!required(teamMemberForm.phone)) next.phone = "Phone is required";
    setTeamMemberErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddTeamMember = () => {
    if (!validateTeamMember()) return;
    const now = new Date().toISOString();
    const newMember: TeamMember = {
      id: Date.now(),
      firstName: teamMemberForm.firstName.trim(),
      lastName: teamMemberForm.lastName.trim(),
      email: teamMemberForm.email.trim(),
      phone: teamMemberForm.phone.trim(),
      address: teamMemberForm.address.trim(),
      city: teamMemberForm.city.trim(),
      state: teamMemberForm.state,
      zip: teamMemberForm.zip.trim(),
      isExpanded: false,
       status: "active",
       created_at:now,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setTeamMemberForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
    });
    setTeamMemberErrors({});
    setShowAddTeamMember(false);
  };

  const toggleTeamMemberExpansion = (id: number) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isExpanded: !m.isExpanded } : m)),
    );
  };

  const removeTeamMember = (id: number) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateTeamMember = (
    id: number,
    field: keyof TeamMember,
    value: any,
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  function validate(): boolean {
    const next: typeof errors = {};

    if (form.providerType === "individual") {
      if (!required(form.firstName)) next.firstName = "First name is required";
      if (!required(form.lastName)) next.lastName = "Last name is required";
    } else {
      if (!required(form.teamTitle)) next.teamTitle = "Team title is required";
      if ((form.memberIds || []).length === 0)
        next.memberIds = "Select at least one member";
    }

    if (!required(form.email)) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid email";
    if (!required(form.phone)) next.phone = "Phone is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (form.providerType === "individual") {
        const personPayload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          status: form.status,
          address: form.address,
          zip: form.zip,
          state: form.state,
          city: form.city,
        };

        addPerson(personPayload);

        const newPerson =
          people.find(
            (p) =>
              p.firstName === personPayload.firstName &&
              p.lastName === personPayload.lastName &&
              p.email === personPayload.email,
          ) || null;
        const personId = newPerson?.id || Date.now();

        await onSubmit({
          teamTitle: `${form.firstName} ${form.lastName}`,
          // @ts-ignore (if ServiceProvider includes teamColor, remove ignore)
          teamColor: form.teamColor,
          memberIds: [personId],
          teamMembers: [
            {
              id: personId,
              firstName: form.firstName,
              lastName: form.lastName,
            },
          ],
          email: form.email,
          phone: form.phone,
          status: form.status,
          locationIds: form.locationIds,
        } as any);
      } else {
        const snapshotMembers = form.memberIds
          .map((id) => {
            const p = people.find((x) => x.id === id);
            return p
              ? { id: p.id, firstName: p.firstName, lastName: p.lastName }
              : null;
          })
          .filter(Boolean) as ServiceProvider["teamMembers"];

        await onSubmit({
          teamTitle: form.teamTitle,
          // @ts-ignore
          teamColor: form.teamColor,
          memberIds: form.memberIds,
          teamMembers: snapshotMembers,
          email: form.email,
          phone: form.phone,
          status: form.status,
          locationIds: form.locationIds,
        } as any);
      }
    } catch (err) {
      setSubmitError((err as Error).message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Color input helpers (no auto-reorder, no auto-format) ----

  // 0..6 hex chars while typing
  const SHORT_OR_FULL_HEX = /^[0-9a-fA-F]{0,6}$/;
  // full value only when 3 or 6 chars (still *without* '#')
  const VALID_HEX_NOHASH = /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  const stripHash = (v: string) => v.replace(/^#/, "");
  const toCssHex = (v: string) => `#${v.toLowerCase()}`; // commit format

  // Keep draft *without* '#'
  const [teamColorDraft, setTeamColorDraft] = React.useState<string>(
    stripHash(
      form.teamColor && /^#?[0-9a-fA-F]{3,6}$/.test(form.teamColor)
        ? form.teamColor
        : COLOR_PICKER_DEFAULT,
    ),
  );

  // If form.teamColor changes from outside (e.g., picker), mirror it to draft
  React.useEffect(() => {
    if (!form.teamColor) return;
    if (!/^#?[0-9a-fA-F]{3,6}$/.test(form.teamColor)) return;
    const noHash = stripHash(form.teamColor);
    if (noHash !== teamColorDraft) setTeamColorDraft(noHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.teamColor]);

  function onColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value; // never contains '#'
    if (!SHORT_OR_FULL_HEX.test(raw)) return;

    const trimmed = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setTeamColorDraft(trimmed);

    // Commit only when 3 or 6 chars — *exactly as typed*, just lowercased + '#'
    if (VALID_HEX_NOHASH.test(trimmed)) {
      handleChange("teamColor", toCssHex(trimmed));
    }
  }

  // No auto-correct on blur — let the user keep partial text
  function onColorInputBlur() {}

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/providers`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-500 sm:text-sm"
            >
              Teams
            </Link>
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
                {isEdit ? "Edit Provider" : "Add New Team"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
            {form.providerType === "individual" ? (
              <HiUser className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            ) : (
              <HiUsers className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEdit ? "Edit Provider" : "Add New Team"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEdit ? "Update provider details" : "Create new team provider"}
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="text-xs sm:text-sm">{submitError}</span>
        </Alert>
      )}

      <form className="space-y-4 sm:space-y-6" onSubmit={submit} noValidate>
        {/* Provider Details */}
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label
                htmlFor="teamTitleTop"
                className="mb-2 block text-sm text-gray-900"
              >
                Team Title
              </Label>
              <input
                id="teamTitleTop"
                value={form.teamTitle}
                onChange={(e) => handleChange("teamTitle", e.target.value)}
                placeholder="Enter Team Title"
                className={`${inputBaseWithPlaceholder} ${
                  form.providerType === "team" && errors.teamTitle ? bad : ok
                } w-full`}
                aria-invalid={
                  form.providerType === "team" ? !!errors.teamTitle : false
                }
              />
              {form.providerType === "team" && errors.teamTitle && (
                <HelperText color="failure">{errors.teamTitle}</HelperText>
              )}
            </div>

            <div className="min-w-0">
              <Label
                htmlFor="teamColorHex"
                className="mb-2 block text-sm text-gray-900"
              >
                Team Color
              </Label>

              <div className="relative">
                <input
                  id="teamColorHex"
                  value={teamColorDraft}
                  onChange={onColorInputChange}
                  onBlur={onColorInputBlur}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputBaseWithPlaceholder} ${ok} w-full pr-12`}
                  aria-label="Team color hex"
                  placeholder="ffffff"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  maxLength={6}
                  pattern="[0-9a-fA-F]{3,6}"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />

                {/* swatch INSIDE the field */}
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <ColorPicker
                    mode="popover"
                    value={form.teamColor || COLOR_PICKER_DEFAULT}
                    onChange={(hex) => {
                      const cleaned = hex.replace(/^#/, "");
                      setTeamColorDraft(cleaned);
                      handleChange("teamColor", `#${cleaned.toLowerCase()}`);
                    }}
                    renderTrigger={() => {
                      const displayHex =
                        /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
                          teamColorDraft,
                        )
                          ? `#${teamColorDraft.toLowerCase()}`
                          : form.teamColor || COLOR_PICKER_DEFAULT;

                      return (
                        <button
                          type="button"
                          aria-label="Open color picker"
                          className="mt-2 h-5 w-5 cursor-pointer rounded-full shadow-sm ring-1 ring-black/10 sm:h-7 sm:w-7"
                          style={{ backgroundColor: displayHex }}
                        />
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Leader header */}
          <div className="mt-4 flex items-center gap-2 sm:mt-6 sm:gap-3">
            <Label className="text-base font-semibold text-gray-900 sm:text-lg">
              Team Leader
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Leader First Name */}
              <div className="relative">
                <Label
                  htmlFor="firstName"
                  className="mb-1 block text-sm sm:mb-2"
                >
                  First Name
                </Label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    handleInputWithAutocomplete("firstName", e.target.value)
                  }
                  onFocus={() => {
                    if (form.firstName.length >= 2) {
                      setSearchTerm(form.firstName);
                      setActiveField("firstName");
                      setShowAutocomplete(true);
                    }
                  }}
                  placeholder="Enter First Name"
                  required
                  autoComplete="off"
                  className={`${inputBaseWithPlaceholder} ${errors.firstName ? bad : ok}`}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <HelperText color="failure">{errors.firstName}</HelperText>
                )}

                {/* Autocomplete */}
                {showAutocomplete &&
                  activeField === "firstName" &&
                  filteredPeople.length > 0 && (
                    <div
                      ref={autocompleteRef}
                      className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                    >
                      <div className="max-h-60 cursor-pointer overflow-y-auto p-2">
                        <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                          Select existing person ({filteredPeople.length} found)
                        </div>
                        {filteredPeople.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => handleSelectPerson(person)}
                            className="w-full cursor-pointer rounded-md p-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: form.teamColor }}
                              >
                                {person.firstName[0]}
                                {person.lastName[0]}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="truncate text-sm font-medium text-gray-900">
                                  {person.firstName} {person.lastName}
                                </div>
                                <div className="truncate text-xs text-gray-500">
                                  {person.email ||
                                    person.phone ||
                                    "No contact info"}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Leader Last Name */}
              <div className="relative">
                <Label
                  htmlFor="lastName"
                  className="mb-1 block text-sm sm:mb-2"
                >
                  Last Name
                </Label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    handleInputWithAutocomplete("lastName", e.target.value)
                  }
                  onFocus={() => {
                    if (form.lastName.length >= 2) {
                      setSearchTerm(form.lastName);
                      setActiveField("lastName");
                      setShowAutocomplete(true);
                    }
                  }}
                  placeholder="Enter Last Name"
                  required
                  autoComplete="off"
                  className={`${inputBaseWithPlaceholder} ${errors.lastName ? bad : ok}`}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <HelperText color="failure">{errors.lastName}</HelperText>
                )}

                {/* Autocomplete */}
                {showAutocomplete &&
                  activeField === "lastName" &&
                  filteredPeople.length > 0 && (
                    <div
                      ref={autocompleteRef}
                      className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                    >
                      <div className="max-h-60 overflow-y-auto p-2">
                        <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                          Select existing person ({filteredPeople.length} found)
                        </div>
                        {filteredPeople.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => handleSelectPerson(person)}
                            className="w-full cursor-pointer rounded-md p-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: form.teamColor }}
                              >
                                {person.firstName[0]}
                                {person.lastName[0]}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="truncate text-sm font-medium text-gray-900">
                                  {person.firstName} {person.lastName}
                                </div>
                                <div className="truncate text-xs text-gray-500">
                                  {person.email ||
                                    person.phone ||
                                    "No contact info"}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email" className="mb-1 block text-sm sm:mb-2">
                  Email
                </Label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter Email"
                  className={`${inputBaseWithPlaceholder} ${errors.email ? bad : ok}`}
                  required
                />
                {errors.email && (
                  <HelperText color="failure">{errors.email}</HelperText>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-1 block text-sm sm:mb-2">
                  Phone
                </Label>
                <PhoneInput
                  id="phone"
                  value={form.phone}
                  onChange={(v) => handleChange("phone", v)}
                  error={!!errors.phone}
                  placeholder="Enter Phone"
                />
                {errors.phone && (
                  <HelperText color="failure">{errors.phone}</HelperText>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Locations */}
        {/* <Card className="bg-gray-50">
          <div className=" flex items-center gap-2  sm:gap-3">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Locations</h3>
          </div>

          <div>
            <Label className="mb-1 block  sm:mb-2 text-sm">Service Areas</Label>
            <MultiSelectDropdown
              options={locationOptions}
              selected={form.locationIds}
              onChange={(ids) => handleChange("locationIds", ids)}
              placeholder="Select locations"
              label=""
            />
          </div>
        </Card> */}

        {/* Team Members Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                Team Members
              </h3>
              <p className="text-xs text-gray-500 sm:text-sm">
                Optional: Add team members who work with this provider
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              color="gray"
              onClick={() => setShowAddTeamMember(true)}
              className="mt-2 w-full cursor-pointer sm:mt-0 sm:w-auto"
            >
              Add Member
            </Button>
          </div>

          {/* Team Members List */}
          {teamMembers.length > 0 && (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: form.teamColor }}
                      >
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTeamMemberExpansion(member.id)}
                        className="cursor-pointer rounded-lg p-2 hover:bg-gray-100"
                      >
                        {member.isExpanded ? (
                          <HiChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <HiChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member.id)}
                        className="cursor-pointer rounded-lg p-2 hover:bg-gray-100"
                      >
                        <HiX className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {member.isExpanded && (
                    <div className="space-y-4 border-t border-gray-200 p-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1 block text-sm">
                            First Name
                          </Label>
                          <input
                            value={member.firstName}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "firstName",
                                e.target.value,
                              )
                            }
                            className={`${inputBaseWithPlaceholder} ${ok}`}
                            placeholder="Enter First Name"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">
                            Last Name
                          </Label>
                          <input
                            value={member.lastName}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "lastName",
                                e.target.value,
                              )
                            }
                            className={`${inputBaseWithPlaceholder} ${ok}`}
                            placeholder="Enter Last Name"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Email</Label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "email",
                                e.target.value,
                              )
                            }
                            className={`${inputBaseWithPlaceholder} ${ok}`}
                            placeholder="Enter Email"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Phone</Label>
                          <PhoneInput
                           value={member.phone ?? ""}
    onChange={(v) => updateTeamMember(member.id, "phone", v)}
    placeholder="Enter Phone"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Team Member Form */}
          {showAddTeamMember && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  Add Team Member
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeamMember(false);
                    setTeamMemberForm({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      address: "",
                      city: "",
                      state: "",
                      zip: "",
                    });
                    setTeamMemberErrors({});
                  }}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <Label
                      htmlFor="tm-firstName"
                      className="mb-2 block text-sm"
                    >
                      First Name
                    </Label>
                    <input
                      id="tm-firstName"
                      value={teamMemberForm.firstName}
                      onChange={(e) =>
                        handleTmInputWithAutocomplete(
                          "firstName",
                          e.target.value,
                        )
                      }
                      onFocus={() => {
                        if (teamMemberForm.firstName.length >= 2) {
                          setTmSearchTerm(teamMemberForm.firstName);
                          setActiveTmField("firstName");
                          setShowTmAutocomplete(true);
                        }
                      }}
                      placeholder="Enter First Name"
                      autoComplete="off"
                      className={`${inputBaseWithPlaceholder} ${teamMemberErrors.firstName ? bad : ok}`}
                    />
                    {teamMemberErrors.firstName && (
                      <HelperText color="failure">
                        {teamMemberErrors.firstName}
                      </HelperText>
                    )}
                    {showTmAutocomplete &&
                      activeTmField === "firstName" &&
                      filteredTmPeople.length > 0 && (
                        <div
                          ref={tmAutocompleteRef}
                          className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                        >
                          <div className="max-h-60 overflow-y-auto p-2">
                            <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                              Select existing person ({filteredTmPeople.length}{" "}
                              found)
                            </div>
                            {filteredTmPeople.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => handleSelectTmPerson(person)}
                                className="w-full cursor-pointer rounded-md p-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: form.teamColor }}
                                  >
                                    {person.firstName[0]}
                                    {person.lastName[0]}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                      {person.firstName} {person.lastName}
                                    </div>
                                    <div className="truncate text-xs text-gray-500">
                                      {person.email ||
                                        person.phone ||
                                        "No contact info"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="relative">
                    <Label htmlFor="tm-lastName" className="mb-2 block text-sm">
                      Last Name
                    </Label>
                    <input
                      id="tm-lastName"
                      value={teamMemberForm.lastName}
                      onChange={(e) =>
                        handleTmInputWithAutocomplete(
                          "lastName",
                          e.target.value,
                        )
                      }
                      onFocus={() => {
                        if (teamMemberForm.lastName.length >= 2) {
                          setTmSearchTerm(teamMemberForm.lastName);
                          setActiveTmField("lastName");
                          setShowTmAutocomplete(true);
                        }
                      }}
                      placeholder="Enter Last Name"
                      autoComplete="off"
                      className={`${inputBaseWithPlaceholder} ${teamMemberErrors.lastName ? bad : ok}`}
                    />
                    {teamMemberErrors.lastName && (
                      <HelperText color="failure">
                        {teamMemberErrors.lastName}
                      </HelperText>
                    )}
                    {showTmAutocomplete &&
                      activeTmField === "lastName" &&
                      filteredTmPeople.length > 0 && (
                        <div
                          ref={tmAutocompleteRef}
                          className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                        >
                          <div className="max-h-60 overflow-y-auto p-2">
                            <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                              Select existing person ({filteredTmPeople.length}{" "}
                              found)
                            </div>
                            {filteredTmPeople.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => handleSelectTmPerson(person)}
                                className="w-full rounded-md p-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: form.teamColor }}
                                  >
                                    {person.firstName[0]}
                                    {person.lastName[0]}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                      {person.firstName} {person.lastName}
                                    </div>
                                    <div className="truncate text-xs text-gray-500">
                                      {person.email ||
                                        person.phone ||
                                        "No contact info"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                    <Label htmlFor="tm-email" className="mb-2 block text-sm">
                      Email
                    </Label>
                    <input
                      id="tm-email"
                      type="email"
                      value={teamMemberForm.email}
                      onChange={(e) =>
                        setTeamMemberForm((f) => ({
                          ...f,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter Email"
                      className={`${inputBaseWithPlaceholder} ${teamMemberErrors.email ? bad : ok}`}
                    />
                    {teamMemberErrors.email && (
                      <HelperText color="failure">
                        {teamMemberErrors.email}
                      </HelperText>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tm-phone" className="mb-2 block text-sm">
                      Phone
                    </Label>
                    <PhoneInput
                      id="tm-phone"
                      value={teamMemberForm.phone}
                      onChange={(v) =>
                        setTeamMemberForm((f) => ({ ...f, phone: v }))
                      }
                      error={!!teamMemberErrors.phone}
                      placeholder="Enter Phone"
                    />
                    {teamMemberErrors.phone && (
                      <HelperText color="failure">
                        {teamMemberErrors.phone}
                      </HelperText>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    color="light"
                    className="cursor-pointer"
                    onClick={() => {
                      setShowAddTeamMember(false);
                      setTeamMemberForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        address: "",
                        city: "",
                        state: "",
                        zip: "",
                      });
                      setTeamMemberErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    color="gray"
                    onClick={handleAddTeamMember}
                    className="cursor-pointer"
                  >
                    Add Member
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-1 sm:pt-1">
          <FormActions
            onCancel={onCancel}
            isPending={isSubmitting}
            isEditing={isEdit}
            submitText="Save"
            editText="Update"
            showStatusToggle={isEdit}
            status={form.status}
            onStatusToggle={() =>
              handleChange(
                "status",
                form.status === "active" ? "archived" : "active",
              )
            }
          />
        </div>
      </form>
    </div>
  );
}
