// src/components/Providers/EditForm/TeamInfo.tsx
import * as React from "react";
import { Button, Label, HelperText } from "flowbite-react";
import {
  HiX,
  HiChevronUp,
  HiChevronDown,
  HiTrash,
  HiMail,
  HiClock,
} from "react-icons/hi";
import { ProviderEditForm, ServiceProvider } from "../../../types/providers";
import { useProviderPeople } from "../../../hooks/Providers/useProviderPeople";
import { useLocations } from "../../../hooks/Locations/useLocations";
import MultiSelectDropdown from "../../ui/MultiSelectDropdown";
import { PhoneInput, USStateSelect, ZipCodeInput } from "../../ui/InputsBundle";
import ColorPicker from "../../ui/ColorPicker";
import SendMessageModal from "./SendMessageModal";
import TeamHistoryModal from "./TeamHistoryModal";

const DEFAULT_TEAM_COLOR = "#8b5cf6";

function getInitialsFromTitle(title: string) {
  if (!title?.trim()) return "T";
  const words = title.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return letters || "T";
}

const focusGray =
  "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600";
const inputBase =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm";
const inputBaseWithPlaceholder = inputBase + " placeholder:text-gray-400";
const ok = `border-gray-300 ${focusGray}`;
const bad = `border-red-500 ring-1 ring-red-500/20 ${focusGray}`;

type TeamMember = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  isExpanded: boolean;
};

type Props = {
  provider: ServiceProvider; // (unused)
  form: ProviderEditForm;
  errors: Partial<Record<keyof ProviderEditForm, string>>;
  onChange: <K extends keyof ProviderEditForm>(k: K, v: ProviderEditForm[K]) => void;
};

export default function TeamInfo({ form, errors, onChange }: Props) {
  // near the top of TeamInfo component
  const [sendOpen, setSendOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // example stub data – replace with your API data
  const historyItems = React.useMemo(
    () => [
      {
        id: 1,
        at: new Date(),
        actor: { name: "Avery Johnson" },
        type: "availability",
        summary: "Availability updated",
        details: "Mon–Fri 9:00–17:00 → 8:00–16:00",
      },
      {
        id: 2,
        at: new Date(Date.now() - 1000 * 60 * 60 * 5),
        actor: { name: "Sasha Lee" },
        type: "preference",
        summary: "Customer preferences changed",
        details: "• Prefers SMS over Email\n• No appointments after 3 PM",
      },
      {
        id: 3,
        at: new Date(Date.now() - 1000 * 60 * 60 * 24),
        actor: { name: "You" },
        type: "note",
        summary: "New note added",
        details: "Follow up with VIP clients list.",
      },
    ],
    []
  );

  const { people } = useProviderPeople();
  const { locations } = useLocations();

  // ---------- Avatar state (immediate apply) ----------
  const teamColor = form.teamColor || DEFAULT_TEAM_COLOR;
  const initials = getInitialsFromTitle(form.teamTitle);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Centered panel (no X, no backdrop, no portal)
  const [avatarEditorOpen, setAvatarEditorOpen] = React.useState(false);
  const avatarAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const avatarPanelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!avatarPanelRef.current || !avatarAnchorRef.current) return;
      const clickedInsidePanel = avatarPanelRef.current.contains(t);
      const clickedAnchor = avatarAnchorRef.current.contains(t);
      if (!clickedInsidePanel && !clickedAnchor) setAvatarEditorOpen(false);
    };
    if (avatarEditorOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [avatarEditorOpen]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();

  const readFileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSelectFile = async (f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    const dataUrl = await readFileToDataUrl(f);
    setAvatarUrl(dataUrl); // immediate reflect
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) await onSelectFile(file);
  };
  const onPaste: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    const file = Array.from(e.clipboardData.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) await onSelectFile(file);
  };

  // ---------- Leader autocomplete ----------
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [activeField, setActiveField] =
    React.useState<"firstName" | "lastName" | null>(null);
  const autocompleteRef = React.useRef<HTMLDivElement | null>(null);

  // ---------- Team members ----------
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [showAddTeamMember, setShowAddTeamMember] = React.useState(false);
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
  const [activeTmField, setActiveTmField] =
    React.useState<"firstName" | "lastName" | null>(null);
  const tmAutocompleteRef = React.useRef<HTMLDivElement | null>(null);

  const locationOptions = React.useMemo(
    () =>
      (locations || []).map((l: any) => ({
        id: Number(l.id),
        name: String(l.name),
      })),
    [locations]
  );

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
    [people]
  );

  const filteredPeople = React.useMemo(
    () => filterPeople(searchTerm),
    [filterPeople, searchTerm]
  );
  const filteredTmPeople = React.useMemo(
    () => filterPeople(tmSearchTerm),
    [filterPeople, tmSearchTerm]
  );

  // Click-outside for leader autocomplete
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (autocompleteRef.current && !autocompleteRef.current.contains(target))
        setShowAutocomplete(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Click-outside for member autocomplete
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (tmAutocompleteRef.current && !tmAutocompleteRef.current.contains(target))
        setShowTmAutocomplete(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Leader: select existing person (now includes address fields)
  const handleSelectPerson = (person: any) => {
    onChange("firstName", person.firstName);
    onChange("lastName", person.lastName);
    onChange("email", person.email || form.email);
    onChange("phone", person.phone || form.phone);
    onChange("address", person.address || form.address || "");
    onChange("city", person.city || form.city || "");
    onChange("state", person.state || form.state || "");
    onChange("zip", person.zip || form.zip || "");
    setSearchTerm("");
    setShowAutocomplete(false);
    setActiveField(null);
  };

  const handleInputWithAutocomplete = (
    field: "firstName" | "lastName",
    value: string
  ) => {
    onChange(field, value);
    setSearchTerm(value);
    setActiveField(field);
    setShowAutocomplete(value.length >= 2);
  };

  // Team member: select existing person (now includes address fields)
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
    value: string
  ) => {
    setTeamMemberForm((f) => ({ ...f, [field]: value }));
    setTmSearchTerm(value);
    setActiveTmField(field);
    setShowTmAutocomplete(value.length >= 2);
  };

  const validateTeamMember = () => {
    const next: any = {};
    if (!teamMemberForm.firstName.trim())
      next.firstName = "First name is required";
    if (!teamMemberForm.lastName.trim())
      next.lastName = "Last name is required";
    if (!teamMemberForm.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(teamMemberForm.email))
      next.email = "Enter a valid email";
    if (!teamMemberForm.phone.trim()) next.phone = "Phone is required";
    // Address is optional; add your own rules if you want them required
    setTeamMemberErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddTeamMember = () => {
    if (!validateTeamMember()) return;
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
      prev.map((m) => (m.id === id ? { ...m, isExpanded: !m.isExpanded } : m))
    );
  };

  const removeTeamMember = (id: number) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateTeamMember = (
    id: number,
    field: keyof TeamMember,
    value: any
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // ---- Read-only star row (uses admin-set value) ----
  function ReadonlyStars({ value = 0 }: { value?: number }) {
    const v = Math.max(0, Math.min(5, Math.floor(Number(value) || 0)));
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} aria-hidden="true">
            {n <= v ? (
              <svg
                className="w-7 h-7 text-yellow-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-gray-300"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M11.083 5.104c.35-.8 1.485-.8 1.834 0l1.752 4.022a1 1 0 0 0 .84.597l4.463.342c.9.069 1.255 1.2.556 1.771l-3.33 2.723a1 1 0 0 0-.337 1.016l1.03 4.119c.214.858-.71 1.552-1.474 1.106l-3.913-2.281a1 1 0 0 0-1.008 0L7.583 20.8c-.764.446-1.688-.248-1.474-1.106l1.03-4.119A1 1 0 0 0 6.8 14.56l-3.33-2.723c-.698-.571-.342-1.702.557-1.771l4.462-.342a1 1 0 0 0 .84-.597l1.753-4.022Z"
                />
              </svg>
            )}
          </span>
        ))}
      </div>
    );
  }

  const displayRating = Number(form.rating ?? (form as any).teamRating ?? 0);

  return (
    <div className="space-y-6 p-6 ">
      {/* =================== Team Avatar + Title + Locations Row =================== */}
      <div className="flex flex-col lg:flex-row gap-12 items-center ">
        {/* Left: Avatar (toggle opens centered panel) */}
        <div className="flex flex-col items-center gap-2 lg:items-start pb-2">
          <div ref={avatarAnchorRef} className="relative">
            <button
              type="button"
              onClick={() => setAvatarEditorOpen((o) => !o)}
              className="relative group outline-none rounded-full focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 cursor-pointer"
              aria-label="Edit team avatar"
            >
              <div
              className={`flex h-36 w-36 items-center justify-center rounded-full text-[55px] font-bold text-white shadow-lg ring-1 ring-black/5 transition ${
                  avatarUrl ? "" : "bg-orange-500"
                }`}
                style={{
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!avatarUrl && initials}
              </div>
              <span className="cursor-pointer absolute -top-1 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white shadow ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity">
                ✎
              </span>
            </button>
          </div>

          {/* Read-only stars BELOW the avatar */}
          <ReadonlyStars value={displayRating} />
        </div>

        {/* Right column: Title, Locations, Buttons */}
        <div className="grid sm:grid-cols-2 grid-cols-1 w-full gap-4">
          {/* Title */}
          <div>
            <Label className="mb-1 block text-sm">Team title</Label>
            <input
              id="teamTitle"
              value={form.teamTitle}
              onChange={(e) => onChange("teamTitle", e.target.value)}
              placeholder="Enter Team Title"
              className={`${inputBaseWithPlaceholder} ${
                errors.teamTitle ? bad : ok
              }`}
            />
            {errors.teamTitle && (
              <HelperText color="failure">{errors.teamTitle}</HelperText>
            )}
          </div>

          {/* Locations */}
          <div className="w-full">
            <Label className="mb-1 block text-sm">Locations</Label>
            <MultiSelectDropdown
              options={locationOptions}
              selected={form.locationIds}
              onChange={(ids) => onChange("locationIds", ids)}
              placeholder="Select locations"
              label=""
              className="cursor-pointer"
            />
          </div>

          {/* Send Message */}
          <div className="w-full">
            <Label className="mb-1 block text-sm">Message</Label>
            <Button
              color="light"
              className="w-full h-[38px] sm:h-[42px] justify-center cursor-pointer gap-2 bg-white border border-gray-300"
              onClick={() => setSendOpen(true)}
              aria-label="Send message"
            >
              <HiMail className="h-5 w-5 text-gray-500" />
              <span>Send Message</span>
            </Button>
          </div>

          {/* View History */}
          <div className="w-full">
            <Label className="mb-1 block text-sm">History</Label>
            <Button
              color="light"
              className="w-full h-[38px] sm:h-[42px] cursor-pointer justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50"
              onClick={() => setHistoryOpen(true)}
              aria-label="View history"
            >
              <HiClock className="h-5 w-5 text-gray-500" />
              <span>View History</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Centered Avatar Panel ===== */}
      {avatarEditorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 pointer-events-none">
          <div
            ref={avatarPanelRef}
            className="pointer-events-auto w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
            role="dialog"
            aria-label="Update Team Avatar"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={onPaste}
          >
            <div className="space-y-4">
              {/* Team Color */}
              <div>
                <div className="mb-1 text-xs font-medium text-gray-700">Team Color</div>
                <ColorPicker
                  value={teamColor}
                  onChange={(val: string) => onChange("teamColor", val)}
                  mode="inline"
                  showPresets
                  showReset={false}
                  className="rounded-xl border border-gray-200 p-2"
                />
              </div>

              {/* Upload image */}
              <div>
                <div className="mb-1 text-xs font-medium text-gray-700">Photo</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="flex-1 rounded-lg border border-dashed border-green-400 bg-white px-3 py-3 text-center text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
                  >
                    Upload Team Photo
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
                      title="Remove photo"
                    >
                      <HiTrash className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    await onSelectFile(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== Team Leader Section =================== */}
      <div className="rounded-lg  bg-gray-50 py-4">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Team Leader</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name with Autocomplete */}
            <div className="relative">
              <Label htmlFor="firstName" className="mb-1 block text-sm">
                First Name
              </Label>
              <input
                id="firstName"
                value={form.firstName || ""}
                onChange={(e) => handleInputWithAutocomplete("firstName", e.target.value)}
                onFocus={() => {
                  if ((form.firstName?.length || 0) >= 2) {
                    setSearchTerm(form.firstName || "");
                    setActiveField("firstName");
                    setShowAutocomplete(true);
                  }
                }}
                placeholder="Enter First Name"
                autoComplete="off"
                className={`${inputBaseWithPlaceholder} ${errors.firstName ? bad : ok}`}
              />
              {errors.firstName && <HelperText color="failure">{errors.firstName}</HelperText>}

              {showAutocomplete && activeField === "firstName" && filteredPeople.length > 0 && (
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
                        className="w-full rounded-md p-2 text-left cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: teamColor }}
                          >
                            {person.firstName[0]}
                            {person.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {person.firstName} {person.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {person.email || person.phone || "No contact info"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Last Name with Autocomplete */}
            <div className="relative">
              <Label htmlFor="lastName" className="mb-1 block text-sm">
                Last Name
              </Label>
              <input
                id="lastName"
                value={form.lastName || ""}
                onChange={(e) => handleInputWithAutocomplete("lastName", e.target.value)}
                onFocus={() => {
                  if ((form.lastName?.length || 0) >= 2) {
                    setSearchTerm(form.lastName || "");
                    setActiveField("lastName");
                    setShowAutocomplete(true);
                  }
                }}
                placeholder="Enter Last Name"
                autoComplete="off"
                className={`${inputBaseWithPlaceholder} ${errors.lastName ? bad : ok}`}
              />
              {errors.lastName && <HelperText color="failure">{errors.lastName}</HelperText>}

              {showAutocomplete && activeField === "lastName" && filteredPeople.length > 0 && (
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
                        className="w-full rounded-md p-2 cursor-pointer text-left hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: teamColor }}
                          >
                            {person.firstName[0]}
                            {person.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {person.firstName} {person.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {person.email || person.phone || "No contact info"}
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
              <Label htmlFor="email" className="mb-1 block text-sm">
                Email
              </Label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="Enter Email"
                className={`${inputBaseWithPlaceholder} ${errors.email ? bad : ok}`}
              />
              {errors.email && <HelperText color="failure">{errors.email}</HelperText>}
            </div>

            <div>
              <Label htmlFor="phone" className="mb-1 block text-sm">
                Phone
              </Label>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(v) => onChange("phone", v)}
                error={!!errors.phone}
                placeholder="Enter Phone"
              />
              {errors.phone && <HelperText color="failure">{errors.phone}</HelperText>}
            </div>
          </div>

          {/* ===== Leader Address (mirrors StaffsForm) ===== */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <Label className="mb-1 block text-sm">Address</Label>
              <input
                value={form.address || ""}
                onChange={(e) => onChange("address", e.target.value)}
                className={`${inputBaseWithPlaceholder} ${ok}`}
                placeholder="Enter Address"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
              <div className="min-w-0">
                <Label className="mb-1 block text-sm">City</Label>
                <input
                  value={form.city || ""}
                  onChange={(e) => onChange("city", e.target.value)}
                  className={`${inputBaseWithPlaceholder} ${ok}`}
                  placeholder="Enter City"
                />
              </div>

              <div className="min-w-0">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                  <div className="col-span-1 min-w-0">
                    <Label className="mb-1 block text-sm">State</Label>
                    <USStateSelect
                      value={form.state || ""}
                      onChange={(abbr) => onChange("state", abbr)}
                      className="w-full pr-8 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-3 min-w-0">
                    <Label className="mb-1 block text-sm">Zip Code</Label>
                    <ZipCodeInput
                      value={form.zip || ""}
                      onChange={(zip) => onChange("zip", zip)}
                      className="w-full"
                      placeholder="Enter Zip Code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ===== /Leader Address ===== */}
        </div>
      </div>

      {/* =================== Team Members Section =================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
            <p className="text-xs text-gray-500">
              Optional: Add team members who work with this provider
            </p>
          </div>

          {/* Add Member button */}
          <Button
            color="gray"
            size="sm"
            onClick={() => setShowAddTeamMember(true)}
            className="cursor-pointer sm:w-30 w-full sm:mt-0 mt-4"
          >
            Add Member
          </Button>
        </div>

        {/* Add Member panel with autocomplete */}
        {showAddTeamMember && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold">Add Team Member</h4>
              <button
                type="button"
                aria-label="Close"
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
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <HiX className="h-5 w-5 cursor-pointer" />
              </button>
            </div>

            <div className="space-y-4">
              {/* First / Last with AUTOCOMPLETE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Label className="mb-1 block text-sm">First Name</Label>
                  <input
                    value={teamMemberForm.firstName}
                    onChange={(e) =>
                      handleTmInputWithAutocomplete("firstName", e.target.value)
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
                    className={`${inputBaseWithPlaceholder} ${
                      teamMemberErrors.firstName ? bad : ok
                    }`}
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
                        className="absolute z-20 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                      >
                        <div className="max-h-60 overflow-y-auto p-2">
                          <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                            Select existing person ({filteredTmPeople.length} found)
                          </div>
                          {filteredTmPeople.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              onClick={() => handleSelectTmPerson(person)}
                              className="w-full rounded-md cursor-pointer p-2 text-left hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: teamColor }}
                                >
                                  {person.firstName[0]}
                                  {person.lastName[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {person.firstName} {person.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {person.email || person.phone || "No contact info"}
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
                  <Label className="mb-1 block text-sm">Last Name</Label>
                  <input
                    value={teamMemberForm.lastName}
                    onChange={(e) =>
                      handleTmInputWithAutocomplete("lastName", e.target.value)
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
                    className={`${inputBaseWithPlaceholder} ${
                      teamMemberErrors.lastName ? bad : ok
                    }`}
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
                        className="absolute z-20 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                      >
                        <div className="max-h-60 overflow-y-auto p-2">
                          <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                            Select existing person ({filteredTmPeople.length} found)
                          </div>
                          {filteredTmPeople.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              onClick={() => handleSelectTmPerson(person)}
                              className="w-full rounded-md p-2 text-left hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: teamColor }}
                                >
                                  {person.firstName[0]}
                                  {person.lastName[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {person.firstName} {person.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {person.email || person.phone || "No contact info"}
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

              {/* Email / Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-sm">Email</Label>
                  <input
                    type="email"
                    value={teamMemberForm.email}
                    onChange={(e) =>
                      setTeamMemberForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Enter Email"
                    className={`${inputBaseWithPlaceholder} ${
                      teamMemberErrors.email ? bad : ok
                    }`}
                  />
                  {teamMemberErrors.email && (
                    <HelperText color="failure">
                      {teamMemberErrors.email}
                    </HelperText>
                  )}
                </div>
                <div>
                  <Label className="mb-1 block text-sm">Phone</Label>
                  <PhoneInput
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

              {/* === Member Address (matches StaffsForm pattern) === */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <Label className="mb-1 block text-sm">Address</Label>
                  <input
                    value={teamMemberForm.address}
                    onChange={(e) =>
                      setTeamMemberForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className={`${inputBaseWithPlaceholder} ${ok}`}
                    placeholder="Enter Address"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
                  <div className="min-w-0">
                    <Label className="mb-1 block text-sm">City</Label>
                    <input
                      value={teamMemberForm.city}
                      onChange={(e) =>
                        setTeamMemberForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className={`${inputBaseWithPlaceholder} ${ok}`}
                      placeholder="Enter City"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                      <div className="col-span-1 min-w-0">
                        <Label className="mb-1 block text-sm">State</Label>
                        <USStateSelect
                          value={teamMemberForm.state}
                          onChange={(abbr) =>
                            setTeamMemberForm((f) => ({ ...f, state: abbr }))
                          }
                          className="w-full pr-8 cursor-pointer"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-3 min-w-0">
                        <Label className="mb-1 block text-sm">Zip Code</Label>
                        <ZipCodeInput
                          value={teamMemberForm.zip}
                          onChange={(zip) =>
                            setTeamMemberForm((f) => ({ ...f, zip }))
                          }
                          className="w-full"
                          placeholder="Enter Zip Code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* === /Member Address === */}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  color="light"
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
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTeamMember} color="gray" className="cursor-pointer">
                  Add Member
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Team Members list */}
        {teamMembers.length > 0 && (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: teamColor }}
                    >
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleTeamMemberExpansion(member.id)}
                      className="rounded-lg p-2 hover:bg-gray-100"
                    >
                      {member.isExpanded ? (
                        <HiChevronUp className="h-5 w-5 text-gray-400 cursor-pointer" />
                      ) : (
                        <HiChevronDown className="h-5 w-5 text-gray-400 cursor-pointer" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member.id)}
                      className="rounded-lg p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <HiX className="h-5 w-5 text-gray-400 cursor-pointer" />
                    </button>
                  </div>
                </div>

                {member.isExpanded && (
                  <div className="space-y-4 border-t border-gray-200 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1 block text-sm">First Name</Label>
                        <input
                          value={member.firstName}
                          onChange={(e) =>
                            updateTeamMember(member.id, "firstName", e.target.value)
                          }
                          className={`${inputBaseWithPlaceholder} ${ok}`}
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Last Name</Label>
                        <input
                          value={member.lastName}
                          onChange={(e) =>
                            updateTeamMember(member.id, "lastName", e.target.value)
                          }
                          className={`${inputBaseWithPlaceholder} ${ok}`}
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Email</Label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateTeamMember(member.id, "email", e.target.value)
                          }
                          className={`${inputBaseWithPlaceholder} ${ok}`}
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Phone</Label>
                        <PhoneInput
                          value={member.phone}
                          onChange={(v) =>
                            updateTeamMember(member.id, "phone", v)
                          }
                        />
                      </div>
                    </div>

                    {/* Expanded Member Address */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div>
                        <Label className="mb-1 block text-sm">Address</Label>
                        <input
                          value={member.address}
                          onChange={(e) =>
                            updateTeamMember(member.id, "address", e.target.value)
                          }
                          className={`${inputBaseWithPlaceholder} ${ok}`}
                          placeholder="Enter Address"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
                        <div className="min-w-0">
                          <Label className="mb-1 block text-sm">City</Label>
                          <input
                            value={member.city}
                            onChange={(e) =>
                              updateTeamMember(member.id, "city", e.target.value)
                            }
                            className={`${inputBaseWithPlaceholder} ${ok}`}
                            placeholder="Enter City"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                            <div className="col-span-1 min-w-0">
                              <Label className="mb-1 block text-sm">State</Label>
                              <USStateSelect
                                value={member.state}
                                onChange={(abbr) =>
                                  updateTeamMember(member.id, "state", abbr)
                                }
                                className="w-full pr-8 cursor-pointer"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-3 min-w-0">
                              <Label className="mb-1 block text-sm">Zip Code</Label>
                              <ZipCodeInput
                                value={member.zip}
                                onChange={(zip) =>
                                  updateTeamMember(member.id, "zip", zip)
                                }
                                className="w-full"
                                placeholder="Enter Zip Code"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* /Expanded Member Address */}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Message Modal */}
      <SendMessageModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        teamName={form.teamTitle}
        defaultRecipients={
          form.email
            ? [
                {
                  name:
                    `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim() ||
                    undefined,
                  email: form.email,
                },
              ]
            : []
        }
        onSend={(payload) => {
          // TODO: call your API
          console.log("SEND:", payload);
          setSendOpen(false);
        }}
      />

      {/* History Modal */}
      <TeamHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        teamName={form.teamTitle}
        items={historyItems}
      />
    </div>
  );
}
