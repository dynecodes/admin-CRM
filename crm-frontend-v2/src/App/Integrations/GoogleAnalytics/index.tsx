// // src/App/Integrations/GoogleAnalytics/index.tsx
// import React, { useEffect, useState } from "react";
// import { Button, Alert } from "flowbite-react";
// import { HiExclamationCircle } from "react-icons/hi";
// import { useGoogleAnalytics } from "../../../hooks/Integrations/useGoogleAnalytics";
// import { TbChartLine } from "react-icons/tb";

// const inputCls =
//   "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 " +
//   "text-sm text-gray-900 placeholder-gray-400 " +
//   "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

// const GoogleAnalyticsPage: React.FC = () => {
//   const { settings, loading, updateSettings } = useGoogleAnalytics();

//   const [trackingId, setTrackingId] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (settings) {
//       setTrackingId(settings.trackingId || "");
//     }
//   }, [settings]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSaved(false);
//     setError(null);

//     const trimmed = trackingId.trim();

//     if (!trimmed) {
//       setError("Please enter your Google Analytics Tracking ID.");
//       return;
//     }

//     setSaving(true);
//     try {
//       await updateSettings({ trackingId: trimmed });
//       setSaved(true);
//     } catch (err: any) {
//       setError(err?.message || "Failed to save Tracking ID.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="px-4 py-6 text-sm text-gray-600 sm:px-5">
//         Loading Google Analytics settings…
//       </div>
//     );
//   }
// type EventMapping = {
//   key: string;        // internal action
//   label: string;      // human readable
//   eventName: string;  // GA4 event name
//   enabled: boolean;
// };

// const DEFAULT_EVENTS: EventMapping[] = [
//   {
//     key: "form_submit",
//     label: "Form Submit",
//     eventName: "form_submit",
//     enabled: true,
//   },
//   {
//     key: "booking_complete",
//     label: "Booking Completed",
//     eventName: "booking_completed",
//     enabled: true,
//   },
//   {
//     key: "booking_cancel",
//     label: "Booking Cancelled",
//     eventName: "booking_cancelled",
//     enabled: false,
//   },
// ];
// const [events, setEvents] = useState<EventMapping[]>(DEFAULT_EVENTS);

//   return (
//     <div className="px-4 pb-5 sm:px-5">
//         {/* Header (same spacing/behavior as Automated Tasks) */}
//         <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
//           <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
//             <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
//               <TbChartLine className="h-6 w-6 text-white"/>
//             </div>
//             <div className="font-medium">
//               <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
//                 Google Analytics
//               </span>
//               <div className="text-sm text-gray-500">
//                 Configure your Google Analytics tracking ID
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main card – sits right under the header like the filter card on Automated Tasks */}
//         <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6">
//           {/* Step 1 */}
//           <section className="space-y-3">
//             <h2 className="text-base font-semibold text-gray-900">
//               Step 1. Make sure you have Google Analytics installed on your
//               site.
//             </h2>

//             <div className="space-y-2 text-sm leading-relaxed text-gray-800">
//               <p className="font-semibold">
//                 No, I have not installed Google Analytics.
//               </p>
//               <p>
//                 If you have not installed Google Analytics on your site, please
//                 follow these instructions on how to do it:{" "}
//                 <a
//                   href="https://support.google.com/analytics/answer/9304153"
//                   target="_blank"
//                   rel="noreferrer"
//                   className="text-blue-600 hover:underline"
//                 >
//                   How to Setup Google Analytics (GA4)
//                 </a>
//                 .
//               </p>

//               <p className="font-semibold">
//                 Yes, I have installed Google Analytics.
//               </p>
//               <p>
//                 Awesome! Please make sure you&apos;re using Google Analytics 4.
//                 If you&apos;re not, please follow these instructions on how to
//                 upgrade to Google Analytics 4:{" "}
//                 <a
//                   href="https://support.google.com/analytics/answer/10089681"
//                   target="_blank"
//                   rel="noreferrer"
//                   className="text-blue-600 hover:underline"
//                 >
//                   Make the switch to Google Analytics 4
//                 </a>
//                 .
//               </p>
//             </div>
//           </section>

//           {/* Divider */}
//           <div className="my-6 h-px bg-gray-200" />

//           {/* Step 2 */}
//           <section className="space-y-4">
//             <h2 className="text-base font-semibold text-gray-900">
//               Step 2: Enter your Google Analytics Tracking ID
//             </h2>

//             <form
//               onSubmit={handleSubmit}
//               className="flex flex-col gap-3 sm:flex-row sm:items-end"
//             >
//               <div className="flex-1">
//                 <div className="flex items-center justify-between text-xs text-gray-600 sm:text-sm">
//                   <label htmlFor="ga-tracking-id" className="font-medium">
//                     Tracking ID
//                   </label>
//                   <button
//                     type="button"
//                     onClick={(e) => e.preventDefault()}
//                     className="text-[11px] text-blue-600 hover:underline cursor-pointer"
//                   >
//                     What&apos;s this?
//                   </button>
//                 </div>

//                 <input
//                   id="ga-tracking-id"
//                   type="text"
//                   value={trackingId}
//                   onChange={(e) => setTrackingId(e.target.value)}
//                   placeholder="Example: G-XXXXXXXXXX"
//                   className={`${inputCls} mt-1`}
//                 />
//               </div>

//               <div className="sm:ml-2 sm:flex sm:items-end">
//                 <Button
//                   type="submit"
//                   color="gray"
//                   className="w-full cursor-pointer sm:w-24"
//                   disabled={saving}
//                 >
//                   {saving ? "Saving…" : "Save"}
//                 </Button>
//               </div>
//             </form>

//             {error && (
//               <Alert
//                 color="failure"
//                 icon={HiExclamationCircle}
//                 className="mt-2"
//               >
//                 <span className="text-xs sm:text-sm">{error}</span>
//               </Alert>
//             )}

//             {!error && saved && (
//               <p className="mt-1 text-xs text-green-600 sm:text-sm">
//                 Tracking ID saved.
//               </p>
//             )}
//           </section>
//           {/* Divider */}
// <div className="my-6 h-px bg-gray-200" />

// {/* Step 3: Event Mapping */}
// <section className="space-y-4">
//   <h2 className="text-base font-semibold text-gray-900">
//     Step 3: Event Mapping
//   </h2>

//   <p className="text-sm text-gray-600">
//     Map internal UI actions to Google Analytics event names.
//   </p>

//   <div className="overflow-x-auto">
//     <table className="w-full text-sm">
//       <thead className="border-b text-left text-gray-500">
//         <tr>
//           <th className="py-2">Action</th>
//           <th className="py-2">GA4 Event Name</th>
//           <th className="py-2 text-center">Enabled</th>
//         </tr>
//       </thead>
//       <tbody>
//         {events.map((event, idx) => (
//           <tr key={event.key} className="border-b last:border-0">
//             <td className="py-2 font-medium text-gray-800">
//               {event.label}
//             </td>

//             <td className="py-2">
//               <input
//                 className={inputCls}
//                 value={event.eventName}
//                 onChange={(e) => {
//                   const next = [...events];
//                   next[idx].eventName = e.target.value;
//                   setEvents(next);
//                 }}
//               />
//             </td>

//             <td className="py-2 text-center">
//               <input
//                 type="checkbox"
//                 checked={event.enabled}
//                 onChange={() => {
//                   const next = [...events];
//                   next[idx].enabled = !next[idx].enabled;
//                   setEvents(next);
//                 }}
//               />
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// </section>


//           {/* Divider */}
//           <div className="my-6 h-px bg-gray-200" />

//           {/* Tip section */}
//           <section className="space-y-2 text-sm text-gray-800">
//             <h3 className="font-semibold">
//               Tip: Track Conversions to Measure ROI
//             </h3>
//             <p>
//               <a
//                 href="https://support.google.com/analytics/answer/10089681"
//                 target="_blank"
//                 rel="noreferrer"
//                 className="text-blue-600 hover:underline"
//               >
//                 Click here to see how you can migrate from UA to GA4.
//               </a>
//             </p>
//             <p>
//               Or, read the documentation for more info on tracking booking
//               conversion data and creating goals in Google Analytics.
//             </p>
//           </section>
//         </div>
//       </div>
//   );
// };

// export default GoogleAnalyticsPage;

// src/App/Integrations/GoogleAnalytics/index.tsx
import React, { useEffect, useState } from "react";
import { Button, Alert } from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import { useGoogleAnalytics } from "../../../hooks/Integrations/useGoogleAnalytics";
import { TbChartLine } from "react-icons/tb";

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 " +
  "text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

// ------------------------
// TypeScript types
// ------------------------
export type EventMapping = {
  key: string;
  label: string;
  eventName: string;
  enabled: boolean;
};

// Extend GoogleAnalyticsSettings to include eventMappings
export type GoogleAnalyticsSettings = {
  trackingId?: string;
  eventMappings?: EventMapping[];
  // add other properties if your backend has them
};

const DEFAULT_EVENT_MAPPINGS: EventMapping[] = [
  { key: "form_submit", label: "Form Submit", eventName: "form_submit", enabled: true },
  { key: "booking_complete", label: "Booking Completed", eventName: "booking_completed", enabled: true },
  { key: "booking_cancel", label: "Booking Cancelled", eventName: "booking_cancelled", enabled: false },
];

// ------------------------
// Component
// ------------------------
const GoogleAnalyticsPage: React.FC = () => {
  const { settings, loading, updateSettings } = useGoogleAnalytics();

  const [trackingId, setTrackingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event mappings state
  const [eventMappings, setEventMappings] = useState<EventMapping[]>(DEFAULT_EVENT_MAPPINGS);

  useEffect(() => {
    if (settings) {
      setTrackingId(settings.trackingId || "");
      if (settings.eventMappings) {
        setEventMappings(settings.eventMappings);
      }
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const trimmed = trackingId.trim();

    if (!trimmed) {
      setError("Please enter your Google Analytics Tracking ID.");
      return;
    }

    setSaving(true);
    try {
      // Save tracking ID and event mappings together
      await updateSettings({ trackingId: trimmed, eventMappings });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save Tracking ID.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 text-sm text-gray-600 sm:px-5">
        Loading Google Analytics settings…
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <TbChartLine className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Google Analytics
            </span>
            <div className="text-sm text-gray-500">
              Configure your Google Analytics tracking ID
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6">
        {/* Step 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            Step 1. Make sure you have Google Analytics installed on your
            site.
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-gray-800">
            <p className="font-semibold">No, I have not installed Google Analytics.</p>
            <p>
              If you have not installed Google Analytics on your site, please
              follow these instructions on how to do it:{" "}
              <a
                href="https://support.google.com/analytics/answer/9304153"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                How to Setup Google Analytics (GA4)
              </a>.
            </p>
            <p className="font-semibold">Yes, I have installed Google Analytics.</p>
            <p>
              Awesome! Please make sure you&apos;re using Google Analytics 4.
              If you&apos;re not, follow instructions to upgrade:{" "}
              <a
                href="https://support.google.com/analytics/answer/10089681"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Make the switch to Google Analytics 4
              </a>.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="my-6 h-px bg-gray-200" />

        {/* Step 2 */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Step 2: Enter your Google Analytics Tracking ID
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-600 sm:text-sm">
                <label htmlFor="ga-tracking-id" className="font-medium">
                  Tracking ID
                </label>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  What&apos;s this?
                </button>
              </div>

              <input
                id="ga-tracking-id"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Example: G-XXXXXXXXXX"
                className={`${inputCls} mt-1`}
              />
            </div>

            <div className="sm:ml-2 sm:flex sm:items-end">
              <Button
                type="submit"
                color="gray"
                className="w-full cursor-pointer sm:w-24"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>

          {error && (
            <Alert
              color="failure"
              icon={HiExclamationCircle}
              className="mt-2"
            >
              <span className="text-xs sm:text-sm">{error}</span>
            </Alert>
          )}

          {!error && saved && (
            <p className="mt-1 text-xs text-green-600 sm:text-sm">
              Tracking ID and event mappings saved.
            </p>
          )}
        </section>

        {/* Divider */}
        {/* <div className="my-6 h-px bg-gray-200" /> */}

        {/* Step 3: Event Mapping */}
        {/* <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Step 3: Event Mapping
          </h2>

          <p className="text-sm text-gray-600">
            Map internal UI actions to Google Analytics events. You can rename
            or disable events without code changes.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-gray-500">
                <tr>
                  <th className="py-2">UI Action</th>
                  <th className="py-2">GA4 Event Name</th>
                  <th className="py-2 text-center">Enabled</th>
                </tr>
              </thead>

              <tbody>
                {eventMappings.map((event, idx) => (
                  <tr key={event.key} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-800">{event.label}</td>
                    <td className="py-2">
                      <input
                        className={inputCls}
                        value={event.eventName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const next = [...eventMappings];
                          next[idx] = { ...next[idx], eventName: e.target.value };
                          setEventMappings(next);
                        }}
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={event.enabled}
                        onChange={() => {
                          const next = [...eventMappings];
                          next[idx] = { ...next[idx], enabled: !next[idx].enabled };
                          setEventMappings(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section> */}

        {/* Divider */}
        <div className="my-6 h-px bg-gray-200" />

        {/* Tip section */}
        <section className="space-y-2 text-sm text-gray-800">
          <h3 className="font-semibold">Tip: Track Conversions to Measure ROI</h3>
          <p>
            <a
              href="https://support.google.com/analytics/answer/10089681"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Click here to see how you can migrate from UA to GA4.
            </a>
          </p>
          <p>
            Or, read the documentation for more info on tracking booking
            conversion data and creating goals in Google Analytics.
          </p>
        </section>
      </div>
    </div>
  );
};

export default GoogleAnalyticsPage;
