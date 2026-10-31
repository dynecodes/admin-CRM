import { MenuItem } from "./types";

export const technicalMenuItems: MenuItem[] = [
  {
    name: "dashboard",
    label: "Dashboard",
    link: "/technical/dashboard",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: "messaging",
    label: "Messaging",
    link: "/technical/messaging",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8a9 9 0 100-18 9 9 0 000 18z"
        />
      </svg>
    ),
  },
  {
    name: "bookings",
    label: "Bookings",
    link: "/technical/bookings",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 20H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.429M7 8h3M8 8V4h4v2m4 0V5h-4m3 4v3a1 1 0 0 1-1 1h-3m9-3v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-6.397a1 1 0 0 1 .27-.683l2.434-2.603a1 1 0 0 1 .73-.317H19a1 1 0 0 1 1 1Z"
        />
      </svg>
    ),
  },
  {
    name: "calendar",
    label: "Calendar",
    link: "/technical/calendar",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: "customers",
    label: "Customers",
    link: "/technical/customers",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke="currentColor"
          strokeWidth="2"
          d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
  {
    name: "recurrences",
    label: "Recurrences",
    link: "/technical/recurrences",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.418 0a9 9 0 01-3.84 7.485L20 9h-5"
        />
      </svg>
    ),
  },
  {
    name: "quotes",
    label: "Quotes",
    link: "/technical/quotes",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 20h9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4"
        />
      </svg>
    ),
  },
  {
    name: "leads",
    label: "Leads",
    link: "/technical/leads",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 1.343-3 3v2a3 3 0 006 0v-2c0-1.657-1.343-3-3-3z"
        />
      </svg>
    ),
  },
  {
    name: "providers",
    label: "Teams",
    link: "/technical/providers",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.121 17.804A4.992 4.992 0 0112 15c1.657 0 3.156.804 4.121 2.089M15 7h.01M9 7h.01M17 21H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    name: "providers availability",
    label: "Availability",
    link: "/technical/teamavailability",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 15v3c0 .5523.44772 1 1 1h8v-8m-9 4v-4m0 4h9m-9-4V6c0-.55228.44772-1 1-1h16c.5523 0 1 .44772 1 1v4M3 11h11m6.25 5c0 1.2426-1.0073 2.25-2.25 2.25M20.25 16c0-1.2426-1.0073-2.25-2.25-2.25M20.25 16H21m-3 2.25c-1.2426 0-2.25-1.0074-2.25-2.25M18 18.25V19m-2.25-3c0-1.2426 1.0074-2.25 2.25-2.25M15.75 16H15m3-2.25V13m-1.591 1.409-.5303-.5303m4.2426 4.2426-.5303-.5303m-3.182 0-.5303.5303m4.2426-4.2426-.5303.5303"
        />
      </svg>
    ),
  },
  {
    name: "staff",
    label: "Staff",
    link: "/technical/staffs",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M9 20a4 4 0 00-3-3.87M15 11a4 4 0 100-8 4 4 0 000 8zm-6 0a4 4 0 100-8 4 4 0 000 8z"
        />
      </svg>
    ),
  },
  {
    name: "transactions",
    label: "Transactions",
    link: "/technical/transactions",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6.025A7.5 7.5 0 1 0 17.975 14H10V6.025Z"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.5 3c-.169 0-.334.014-.5.025V11h7.975c.011-.166.025-.331.025-.5A7.5 7.5 0 0 0 13.5 3Z"
        />
      </svg>
    ),
  },
  {
    name: "services",
    label: "Services",
    link: "/technical/services",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v2m0 14v2m8-8h2M2 12h2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414M15.364 4.222l1.414-1.414M4.222 19.778l1.414-1.414"
        />
      </svg>
    ),
    children: [
      {
        name: "services",
        label: "Services",
        link: "/technical/services",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7h18M3 12h18M3 17h18"
            />
          </svg>
        ),
      },
      {
        name: "categories",
        label: "Categories",
        link: "/technical/categories",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5l7 7-7 7-7-7 7-7z"
            />
          </svg>
        ),
      },
      {
        name: "variables",
        label: "Variables",
        link: "/technical/variables",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        ),
      },
      {
        name: "addons",
        label: "Add-ons",
        link: "/technical/addons",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        ),
      },
      {
        name: "frequencies",
        label: "Frequencies",
        link: "/technical/frequencies",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    name: "promotions",
    label: "Promotions",
    link: "/technical/promotions",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h2M20 8l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
    children: [
      {
        name: "promotions",
        label: "Promotions",
        link: "/technical/promotions",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
      },
      {
        name: "referrals",
        label: "Referrals",
        link: "/technical/referrals",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-3-3h-1m-2.5-5a3 3 0 100-6 3 3 0 000 6zm-6.5 5H3v-2a3 3 0 013-3h1m2.5-5a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
        ),
      },
      {
        name: "giftcards",
        label: "Gift Cards",
        link: "/technical/giftcards",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z"
            />
          </svg>
        ),
      },
      {
        name: "giftcards-widget",
        label: "Gift Card Widget",
        link: "/technical/giftcards/form-widget",
        icon: (
          <svg
            className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        ),
      },
    ],
  },

  {
    name: "locations",
    label: "Locations",
    link: "/technical/locations",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.8 13.938h-.011a7 7 0 1 0-11.464.144h-.016l.14.171c.1.127.2.251.3.371L12 21l5.13-6.248c.194-.209.374-.429.54-.659l.13-.155Z"
        />
      </svg>
    ),
  },
  {
    name: "bookingForm",
    label: "Booking Form",
    link: "/technical/booking-form",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6M9 16h6M5 8h14M5 20h14M5 4h14"
        />
      </svg>
    ),
  },
  {
    name: "bookingSpots",
    label: "Booking Spots",
    link: "/technical/booking-spots",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    name: "integrations",
    label: "Integrations",
    link: "/technical/integrations",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8V4m0 16v-4m-4-4H4m16 0h-4M6.343 6.343l2.828 2.828M14.828 14.828l2.829 2.828M6.343 17.657l2.828-2.829M14.828 9.172l2.829-2.829"
        />
      </svg>
    ),
  },
  {
    name: "reports",
    label: "Reports",
    link: "/technical/reports",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 17v-6m4 6V7m4 10V3m-8 14V11m-4 6v-4m-4 4V9"
        />
      </svg>
    ),
  },
  {
    name: "settings",
    label: "Settings",
    link: "/technical/settings",
    icon: (
      <svg
        className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.591 1.066c1.53-.879 3.408.999 2.529 2.529a1.724 1.724 0 001.066 2.591c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.591c.879 1.53-.999 3.408-2.529 2.529a1.724 1.724 0 00-2.591 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.591-1.066c-1.53.879-3.408-.999-2.529-2.529a1.724 1.724 0 00-1.066-2.591c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.591c-.879-1.53.999-3.408 2.529-2.529.895.514 2.165.127 2.591-1.066z"
        />
      </svg>
    ),
    children: [
      {
        name: "form-builder",
        label: "Form Builder",
        link: "/technical/form-builder",
        icon: (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6M9 16h6M5 8h14M5 20h14M5 4h14"
            />
          </svg>
        ),
      },
      {
        name: "submissions",
        label: "Submissions",
        link: "/technical/submissions",
        icon: (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6M9 16h6M3 7h18M3 17h18"
            />
          </svg>
        ),
      },
      {
        name: "tags",
        label: "Tags",
        link: "/technical/tags",
        icon: (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5l7 7-7 7-7-7 7-7z"
            />
          </svg>
        ),
      },
    ],
  },
];
