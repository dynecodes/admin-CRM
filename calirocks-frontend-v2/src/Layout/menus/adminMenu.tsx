// import { MenuItem } from "./types";

// export const adminMenuItems: MenuItem[] = [
//   {
//     name: "dashboard",
//     label: "Dashboard",
//     link: "/admin/dashboard",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <rect width="7" height="7" x="3" y="3" rx="1" />
//         <rect width="7" height="7" x="14" y="3" rx="1" />
//         <rect width="7" height="7" x="14" y="14" rx="1" />
//         <rect width="7" height="7" x="3" y="14" rx="1" />
//       </svg>
//     ),
//   },
//   {
//     name: "messaging",
//     label: "Messaging",
//     link: "/admin/messaging",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
//       </svg>
//     ),
//   },
//   {
//     name: "bookings",
//     label: "Bookings",
//     link: "/admin/bookings",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
//         <path d="M2 6h4" />
//         <path d="M2 10h4" />
//         <path d="M2 14h4" />
//         <path d="M2 18h4" />
//         <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
//       </svg>
//     ),
//   },
//   {
//     name: "calendar",
//     label: "Calendar",
//     link: "/admin/calendar",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M11 14h1v4" />
//         <path d="M16 2v4" />
//         <path d="M3 10h18" />
//         <path d="M8 2v4" />
//         <rect x="3" y="4" width="18" height="18" rx="2" />
//       </svg>
//     ),
//   },
//   {
//     name: "customers",
//     label: "Customers",
//     link: "/admin/customers",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="ml-[1px] h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
//         <path d="M16 3.128a4 4 0 0 1 0 7.744" />
//         <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
//         <circle cx="9" cy="7" r="4" />
//       </svg>
//     ),
//   },
//   {
//   name: "recurrences",
//   label: "Recurrences",
//   // make parent go to Active by default
//   link: "/admin/recurrences/active",
//   icon: (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-repeat2-icon lucide-repeat-2"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>

//   ),
//   children: [
//     {
//       name: "admin-recurrences-active",
//       label: "Active",
//       link: "/admin/recurrences/active",
//       icon: (
//        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
//   <path d="M17.133 12.632v-1.8a5.407 5.407 0 0 0-4.154-5.262.955.955 0 0 0 .021-.106V3.1a1 1 0 0 0-2 0v2.364a.933.933 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C6.867 15.018 5 15.614 5 16.807 5 17.4 5 18 5.538 18h12.924C19 18 19 17.4 19 16.807c0-1.193-1.867-1.789-1.867-4.175Zm-13.267-.8a1 1 0 0 1-1-1 9.424 9.424 0 0 1 2.517-6.391A1.001 1.001 0 1 1 6.854 5.8a7.43 7.43 0 0 0-1.988 5.037 1 1 0 0 1-1 .995Zm16.268 0a1 1 0 0 1-1-1A7.431 7.431 0 0 0 17.146 5.8a1 1 0 0 1 1.471-1.354 9.424 9.424 0 0 1 2.517 6.391 1 1 0 0 1-1 .995ZM8.823 19a3.453 3.453 0 0 0 6.354 0H8.823Z"/>
// </svg>

//       ),
//     },
//     {
//       name: "admin-recurrences-cancelled",
//       label: "Cancelled",
//       link: "/admin/recurrences/cancelled",
//       icon: (
//        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
//       ),
//     },
//   ],
// },
//   {
//     name: "leads",
//     label: "Leads",
//     link: "/admin/leads",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />
//         <path d="M8 15H7a4 4 0 0 0-4 4v2" />
//         <circle cx="10" cy="7" r="4" />
//       </svg>
//     ),
//   },
//   {
//     name: "providers",
//     label: "Teams",
//     link: "/admin/providers",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
//       </svg>
//     ),
//   },
//   {
//     name: "providers availability",
//     label: "Availability",
//     link: "/admin/teamavailability",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
//         <rect x="3" y="14" width="7" height="7" rx="1" />
//         <circle cx="17.5" cy="17.5" r="3.5" />
//       </svg>
//     ),
//   },
//   {
//     name: "staff",
//     label: "Staff",
//     link: "/admin/staffs",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M16 2v2" />
//         <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
//         <path d="M8 2v2" />
//         <circle cx="12" cy="11" r="3" />
//         <rect x="3" y="4" width="18" height="18" rx="2" />
//       </svg>
//     ),
//   },
//   {
//     name: "services",
//     label: "Services",
//     link: "/admin/services",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="ml-[1px] h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
//         <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
//       </svg>
//     ),
//     children: [
//       {
//         name: "services",
//         label: "Services",
//         link: "/admin/services",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="ml-[1px] h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
//             <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
//           </svg>
//         ),
//       },
//       {
//         name: "categories",
//         label: "Categories",
//         link: "/admin/categories",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M11 13v4" />
//             <path d="M15 5v4" />
//             <path d="M3 3v16a2 2 0 0 0 2 2h16" />
//             <rect x="7" y="13" width="9" height="4" rx="1" />
//             <rect x="7" y="5" width="12" height="4" rx="1" />
//           </svg>
//         ),
//       },
//       {
//         name: "variables",
//         label: "Variables",
//         link: "/admin/variables",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
//           </svg>
//         ),
//       },
//       {
//         name: "addons",
//         label: "Add-ons",
//         link: "/admin/addons",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M5 12h14" />
//             <path d="M12 5v14" />
//           </svg>
//         ),
//       },
//       {
//         name: "frequencies",
//         label: "Frequencies",
//         link: "/admin/frequencies",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M12 6v6h4" />
//             <circle cx="12" cy="12" r="10" />
//           </svg>
//         ),
//       },
//     ],
//   },
//   {
//     name: "promotions",
//     label: "Promotions",
//     link: "/admin/promotions",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
//         <path d="M9 18h6" />
//         <path d="M10 22h4" />
//       </svg>
//     ),
//     children: [
//       {
//         name: "promotions",
//         label: "Promotions",
//         link: "/admin/promotions",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="m7 11 2-2-2-2" />
//             <path d="M11 13h4" />
//             <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
//           </svg>
//         ),
//       },
//       {
//         name: "referrals",
//         label: "Referrals",
//         link: "/admin/referrals",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M15 13a3 3 0 1 0-6 0" />
//             <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
//             <circle cx="12" cy="8" r="2" />
//           </svg>
//         ),
//       },
//       {
//         name: "giftcards",
//         label: "Gift Cards",
//         link: "/admin/giftcards",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <rect x="3" y="8" width="18" height="4" rx="1" />
//             <path d="M12 8v13" />
//             <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
//             <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
//           </svg>
//         ),
//       },
//       {
//         name: "giftcards-widget",
//         label: "Gift Card Widget",
//         link: "/admin/giftcards/form-widget",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M10 10.5 8 13l2 2.5" />
//             <path d="m14 10.5 2 2.5-2 2.5" />
//             <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
//           </svg>
//         ),
//       },
//     ],
//   },
//   {
//     name: "locations",
//     label: "Locations",
//     link: "/admin/locations",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728" />
//         <circle cx="12" cy="10" r="3" />
//         <path d="m16 18 2 2 4-4" />
//       </svg>
//     ),
//   },
//   {
//     name: "bookingSpots",
//     label: "Booking Times",
//     link: "/admin/booking-spots",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M12 6v6l4 2" />
//         <circle cx="12" cy="12" r="10" />
//       </svg>
//     ),
//   },
//   {
//     name: "emails",
//     label: "Emails",
//     link: "/admin/emails",
//     icon: (
//       <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//       </svg>
//     ),
//   },
//   {
//     name: "integrations",
//     label: "Integrations",
//     link: "/admin/integrations",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <rect width="8" height="8" x="3" y="3" rx="2" />
//         <path d="M7 11v4a2 2 0 0 0 2 2h4" />
//         <rect width="8" height="8" x="13" y="13" rx="2" />
//       </svg>
//     ),
//   },
//   {
//     name: "settings",
//     label: "Settings",
//     link: "/admin/settings",
//     icon: (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         stroke-width="1.5"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//         className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//       >
//         <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
//         <circle cx="12" cy="12" r="3" />
//       </svg>
//     ),
//     children: [
//       {
//         name: "form-builder",
//         label: "Form Builder",
//         link: "/admin/form-builder",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M15 5h6" />
//             <path d="M15 12h6" />
//             <path d="M3 19h18" />
//             <path d="m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12" />
//             <path d="M3.92 10h6.16" />
//           </svg>
//         ),
//       },
//       {
//         name: "tags",
//         label: "Tags",
//         link: "/admin/tags",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" />
//             <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" />
//             <circle cx="10.5" cy="6.5" r=".5" fill="currentColor" />
//           </svg>
//         ),
//       },
//        {
//         name: "recurrences",
//         label: "Recurring Bookings",
//         link: "/admin/recurringbookings",
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg"
//            width="24" height="24" viewBox="0 0 24 24"
//             fill="none" stroke="currentColor" stroke-width="2" 
//             stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-repeat2-icon lucide-repeat-2">
//               <path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/>
//               <path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>
//         ),
//       },
//       {
//         name: "cancel",
//         label: "Cancellation",
//         link: "/admin/cancel",
//         icon: (
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="1.5"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//           >
//             <path d="M4.929 4.929 19.07 19.071" />
//             <circle cx="12" cy="12" r="10" />
//           </svg>
//         ),
//       },
//       {
//         name: "sales-tax",
//         label: "Sales Tax",
//         link: "/admin/sales-tax",
//         icon: (
//           <svg
//             className="h-5 w-5 transition duration-75 group-hover:text-gray-900"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3m0-6V5m0 9v3m-7 3h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
//             />
//           </svg>
//         ),
//       },
//       {
//         name: "automated-tasks",
//         label: "Automated Tasks",
//         link: "/admin/automated-tasks",
//         icon: (
//           <svg
//             className="h-5 w-5"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             {/* clock + gear-ish look for "scheduled tasks" */}
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 8v4l2 2"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 3a9 9 0 100 18 9 9 0 000-18z"
//             />
//           </svg>
//         ),
//       },
//       {
//         name: "google-analytics",
//         label: "Google Analytics",
//         link: "/admin/integrations/google-analytics",
//         icon: (
//           <svg
//             className="h-5 w-5"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             {/* simple chart-like icon */}
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M4 19h16M5 15l4-4 4 3 6-7"
//             />
//           </svg>
//         ),
//       },
//       {
//         name: "google-calendar",
//         label: "Google Calendar",
//         link: "/admin/integrations/google-calendar",
//         icon: (
//           <svg
//             className="h-5 w-5"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             {/* calendar icon */}
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M8 7V3m8 4V3M5 9h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//             />
//           </svg>
//         ),
//       },
//       {
//         name: "quickbooks",
//         label: "QuickBooks",
//         link: "/admin/integrations/quickbooks",
//         icon: (
//           <svg
//             className="h-5 w-5"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             {/* simple ledger / accounting icon */}
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M6 4h9a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M9 8h6M9 12h4M9 16h3"
//             />
//           </svg>
//         ),
//       },
//     ],
//   },
// ];


import { MenuItem } from "./types";

/* =======================
   ICON IMPORTS
======================= */
import {
  HiHome,
  HiChatAlt2,
  HiClipboardList,
  HiCalendar,
  HiOutlineUsers,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineMail,
  HiCog,
  HiOutlineTag,
  HiOutlineXCircle,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
} from "react-icons/hi";

import {
  FiRepeat,
  FiCheck,
  FiX,
  FiPlus,
  FiGift,
} from "react-icons/fi";

import {
  TbChartLine,
  TbBuildingStore,
  TbSettings,
  TbCategory,
  TbTimeline,
  TbShoppingCart,
} from "react-icons/tb";

import { MdCampaign } from "react-icons/md";
import { BiGroup, BiGridAlt } from "react-icons/bi";

/* =======================
   SHARED ICON CLASS
======================= */
const iconClass = "h-5 w-5";

/* =======================
   MENU
======================= */
export const adminMenuItems: MenuItem[] = [
  {
    name: "dashboard",
    label: "Dashboard",
    link: "/admin/dashboard",
    icon: <HiHome className={iconClass} />,
  },

  {
    name: "messaging",
    label: "Messaging",
    link: "/admin/messaging",
    icon: <HiChatAlt2 className={iconClass} />,
  },

  {
    name: "bookings",
    label: "Bookings",
    link: "/admin/bookings",
    icon: <HiClipboardList className={iconClass} />,
  },

  {
    name: "calendar",
    label: "Calendar",
    link: "/admin/calendar",
    icon: <HiCalendar className={iconClass} />,
  },

  {
    name: "customers",
    label: "Customers",
    link: "/admin/customers",
    icon: <HiOutlineUsers className={iconClass} />,
  },

  /* =======================
     RECURRENCES
  ======================= */
  {
    name: "recurrences",
    label: "Recurrences",
    link: "/admin/recurrences/active",
    icon: <FiRepeat className={iconClass} />,
    children: [
      {
        name: "admin-recurrences-active",
        label: "Active",
        link: "/admin/recurrences/active",
        icon: <FiCheck className={iconClass} />,
      },
      {
        name: "admin-recurrences-cancelled",
        label: "Cancelled",
        link: "/admin/recurrences/cancelled",
        icon: <FiX className={iconClass} />,
      },
    ],
  },
  
  {
    name: "analytics",
    label: "Analytics",
    link: "/admin/analytics",
    icon: <HiOutlineChartBar className={iconClass} />,
  },

  {
    name: "leads",
    label: "Leads",
    link: "/admin/leads",
    icon: <TbTimeline className={iconClass} />,
  },

  {
    name: "providers",
    label: "Teams",
    link: "/admin/providers",
    icon: <BiGroup className={iconClass} />,
  },

  {
    name: "providers availability",
    label: "Availability",
    link: "/admin/teamavailability",
    icon: <HiOutlineClock className={iconClass} />,
  },

  {
    name: "staff",
    label: "Staff",
    link: "/admin/staffs",
    icon: <HiOutlineUsers className={iconClass} />,
  },

  /* =======================
     SERVICES
  ======================= */
  {
    name: "services",
    label: "Services",
    link: "/admin/services",
    icon: <BiGridAlt className={iconClass} />,
    children: [
      {
        name: "services",
        label: "Services",
        link: "/admin/services",
        icon: <TbBuildingStore className={iconClass} />,
      },
      {
        name: "categories",
        label: "Categories",
        link: "/admin/categories",
        icon: <TbCategory className={iconClass} />,
      },
      {
        name: "variables",
        label: "Variables",
        link: "/admin/variables",
        icon: <TbSettings className={iconClass} />,
      },
      {
        name: "addons",
        label: "Add-ons",
        link: "/admin/addons",
        icon: <FiPlus className={iconClass} />,
      },
      {
        name: "frequencies",
        label: "Frequencies",
        link: "/admin/frequencies",
        icon: <HiOutlineClock className={iconClass} />,
      },
    ],
  },

  /* =======================
     PROMOTIONS
  ======================= */
  {
    name: "promotions",
    label: "Promotions",
    link: "/admin/promotions",
    icon: <MdCampaign className={iconClass} />,
    children: [
      {
        name: "promotions",
        label: "Promotions",
        link: "/admin/promotions",
        icon: <MdCampaign className={iconClass} />,
      },
      {
        name: "referrals",
        label: "Referrals",
        link: "/admin/referrals",
        icon: <HiOutlineUsers className={iconClass} />,
      },
      {
        name: "giftcards",
        label: "Gift Cards",
        link: "/admin/giftcards",
        icon: <FiGift className={iconClass} />,
      },
      {
        name: "giftcards-widget",
        label: "Gift Card Widget",
        link: "/admin/giftcards/form-widget",
        icon: <TbShoppingCart className={iconClass} />,
      },
    ],
  },

  {
    name: "locations",
    label: "Locations",
    link: "/admin/locations",
    icon: <HiOutlineLocationMarker className={iconClass} />,
  },

  {
    name: "bookingSpots",
    label: "Booking Times",
    link: "/admin/booking-spots",
    icon: <HiOutlineClock className={iconClass} />,
  },

  {
    name: "emails",
    label: "Emails",
    link: "/admin/emails",
    icon: <HiOutlineMail className={iconClass} />,
  },

  {
    name: "integrations",
    label: "Integrations",
    link: "/admin/integrations",
    icon: <TbChartLine className={iconClass} />,
  },

  /* =======================
     SETTINGS
  ======================= */
  {
    name: "settings",
    label: "Settings",
    link: "/admin/settings",
    icon: <HiCog className={iconClass} />,
    children: [
      {
        name: "form-builder",
        label: "Form Builder",
        link: "/admin/form-builder",
        icon: <BiGridAlt className={iconClass} />,
      },
      {
        name: "tags",
        label: "Tags",
        link: "/admin/tags",
        icon: <HiOutlineTag className={iconClass} />,
      },
      {
        name: "recurrences",
        label: "Recurring Bookings",
        link: "/admin/recurringbookings",
        icon: <FiRepeat className={iconClass} />,
      },
      {
        name: "cancel",
        label: "Cancellation",
        link: "/admin/cancel",
        icon: <HiOutlineXCircle className={iconClass} />,
      },
      {
        name: "sales-tax",
        label: "Sales Tax",
        link: "/admin/sales-tax",
        icon: <HiOutlineCurrencyDollar className={iconClass} />,
      },
      {
        name: "automated-tasks",
        label: "Automated Tasks",
        link: "/admin/automated-tasks",
        icon: <TbTimeline className={iconClass} />,
      },
      {
        name: "google-analytics",
        label: "Google Analytics",
        link: "/admin/integrations/google-analytics",
        icon: <TbChartLine className={iconClass} />,
      },
      {
        name: "google-calendar",
        label: "Google Calendar",
        link: "/admin/integrations/google-calendar",
        icon: <HiCalendar className={iconClass} />,
      },
      {
        name: "quickbooks",
        label: "QuickBooks",
        link: "/admin/integrations/quickbooks",
        icon: <TbBuildingStore className={iconClass} />,
      },
    ],
  },
];
