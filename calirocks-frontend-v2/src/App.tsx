import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import usePersistLogin from "./hooks/Auth/usePersistLogin";
import useAuthRefresh from "./hooks/Auth/useAuthRefresh";
import { ThemeProvider } from "./context/ThemeProvider.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";

// Layouts
import SuperAdminLayout from "./Layout/SuperAdminLayout";
import AdminLayout from "./Layout/AdminLayout";
import ProviderLayout from "./Layout/ProviderLayout";
import StaffLayout from "./Layout/StaffLayout";
import TechnicalAdminLayout from "./Layout/TechnicalAdminLayout.tsx";
import CustomerLayout from "./Layout/CustomerLayout";

// Public Pages
import Login from "./App/Login";
import SetPassword from "./App/SetPassword";

// Admin Pages
import MessagingPage from "./App/Messaging";
import Services from "./App/Services";
import Categories from "./App/Categories";
import NewCategory from "./App/Categories/New";
import EditCategory from "./App/Categories/Edit";
import Variables from "./App/Variables";
import NewVariable from "./App/Variables/New";
import EditVariable from "./App/Variables/Edit";
import NewService from "./App/Services/New";
import EditService from "./App/Services/Edit";
import ServiceSettingsPage from "./App/Services/Settings";
import Locations from "./App/Locations";
import NewLocation from "./App/Locations/New";
import EditLocation from "./App/Locations/Edit";
import Frequencies from "./App/Frequencies";
import NewFrequency from "./App/Frequencies/New";
import EditFrequency from "./App/Frequencies/Edit";
import Tags from "./App/Tags";
import FormBuilder from "./App/FormBuilder";
import Customers from "./App/Customers";
import NewCustomers from "./App/Customers/New";
import EditCustomers from "./App/Customers/Edit";
import Providers from "./App/Providers";
import NewProviders from "./App/Providers/New";
import EditProviders from "./App/Providers/Edit";
import Staffs from "./App/Staffs";
import NewStaff from "./App/Staffs/New";
import EditStaffPage from "./App/Staffs/Edit";
import EditStaffEmailPreferencesPage from "./App/Staffs/emailPreferences";
import Addons from "./App/Addons";
import NewAddon from "./App/Addons/New";
import EditAddon from "./App/Addons/Edit";
import TeamAvailability from "./App/Availability";

import Promotions from "./App/Promotions";
import NewPromotions from "./App/Promotions/New";
import EditPromotions from "./App/Promotions/Edit";

import Referrals from "./App/Referrals";
import NewReferral from "./App/Referrals/New";
import EditReferral from "./App/Referrals/Edit";

import Giftcards from "./App/Giftcards/index.tsx";
import NewGiftcard from "./App/Giftcards/New/index.tsx";
import EditGiftcard from "./App/Giftcards/Edit/index.tsx";
import GiftcardSettingsForm from "./App/Giftcards/Settings/index.tsx";
import GiftcardFormWidget from "./App/Giftcards/FormWidget/index.tsx";
import ThemeSettingsPage from "./App/SuperAdmin/ThemeSettings";

import Emails from "./App/Emails";
import EmailLogs from "./App/Emails/Logs";

// Route Guards
import PublicRoute from "./components/Authentication/PublicRoute";
import RoleBasedRoute from "./components/Authentication/RoleBasedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Bookings from "./App/Bookings/index.tsx";
import NewBooking from "./App/Bookings/New/index.tsx";
import EditBookings from "./App/Bookings/Edit/index.tsx";
import Quotes from "./App/Quotes/index.tsx";
import EditQuotes from "./App/Quotes/Edit/index.tsx";
import Leads from "./App/Leads/index.tsx";
import NewLeadPage from "./App/Leads/New/index.tsx";
import FunnelBoardPage from "./components/leads/FunnelBoardPage.tsx";
import BookingSpots from "./App/BookingSpots/index.tsx";
// import CancelBooking from "./components/cancelBookings/cancelBooking.tsx";
import TwilioIntegrationPage from "./App/Integrations/index.tsx";
import TagCustomersPage from "./components/tags/TagCustomersPage.tsx";
import Recurrences from "./App/Recurring/indexActive.tsx";

import TrackingDashboard from "./App/Analytics/TrackingDashboard.tsx";


// import NewQuotes from "./App/Quotes/New/index.tsx";
// *** Sales Tax pages ***
import SalesTaxPage from "./App/SalesTax"; // list + inline modals
import SalesTaxSettings from "./App/SalesTax/Settings/index.tsx";
import NewSalesTax from "./App/SalesTax/New/index.tsx";
import EditSalesTax from "./App/SalesTax/Edit/index.tsx";

// *** Automated Tasks page ***
import AutomatedTasksPage from "./App/AutomatedTasks";
import GoogleAnalyticsPage from "./App/Integrations/GoogleAnalytics";
import GoogleCalendarPage from "./App/Integrations/GoogleCalendar/index.tsx";
import QuickBooksPage from "./App/Integrations/QuickBooks/index.tsx";
import CancelBookingPage from "./App/CancelBookingSettings/index.tsx";
import RecurringBookingsPageIndex from "./App/RecurrencesBookingsSettings/index.tsx";
import CancelledRecurrences from "./App/Recurring/indexCancelled.tsx";
const ROLES = {
  SuperAdmin: 1,
  Admin: 2,
  Provider: 3,
  Staff: 4,
  Customer: 5,
  Technical: 6,
};

export default function App() {
  const { isLoading } = usePersistLogin();
  useAuthRefresh();

  // Show nothing while checking auth - prevents flashing
  if (isLoading) {
    return null;
  }

  return (
    <ToastProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Route - redirects to dashboard if logged in */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Set Password Route - Public */}
            <Route path="/set-password" element={<SetPassword />} />
            {/* Set Password Route - Public */}
            <Route path="/set-password" element={<SetPassword />} />

            {/* SuperAdmin Routes */}
            <Route
              path="/superadmin/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.SuperAdmin]}>
                  <SuperAdminLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/superadmin/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">SuperAdmin Dashboard</h1>
                  </div>
                }
              />
              <Route
                path="companies"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Companies</h1>
                  </div>
                }
              />
              <Route
                path="user-accounts"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">User Accounts</h1>
                  </div>
                }
              />
              <Route
                path="system-logs"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">System Logs</h1>
                  </div>
                }
              />

              <Route
                path="settings"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Settings</h1>
                  </div>
                }
              />
              <Route
                path="settings/general"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">General Settings</h1>
                  </div>
                }
              />
              <Route path="settings/theme" element={<ThemeSettingsPage />} />
              <Route
                path="settings/security"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Security Settings</h1>
                  </div>
                }
              />
              <Route
                path="reports"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Reports</h1>
                  </div>
                }
              />
              <Route
                path="*"
                element={<Navigate to="/superadmin/dashboard" replace />}
              />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.Admin]}>
                  <AdminLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  </div>
                }
              />
              <Route path="messaging" element={<MessagingPage />} />
              <Route
                path="calendar"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Calendar</h1>
                  </div>
                }
              />

             {/* Recurrences */}
                <Route path="recurrences" element={<Recurrences />} />

                {/* Recurrences */}
              <Route
                path="recurrences"
                element={<Navigate to="/admin/recurrences/active" replace />}
              />
              <Route path="recurrences/active" element={<Recurrences />} />
              <Route path="recurrences/cancelled" element={<CancelledRecurrences />} />


              <Route
                path="transactions"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Transactions</h1>
                  </div>
                }
              />

              <Route
                path="booking-form"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Booking Form</h1>
                  </div>
                }
              />
              <Route path="booking-spots" element={<BookingSpots />} />
              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />
              <Route
                path="reports"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Reports</h1>
                  </div>
                }
              />
              <Route
                path="booking-form"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Booking Form</h1>
                  </div>
                }
              />
              <Route
                path="booking-spots"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Booking Spots</h1>
                  </div>
                }
              />
              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />
              <Route
                path="reports"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Reports</h1>
                  </div>
                }
              />

              <Route path="emails" element={<Emails />} />
              <Route path="emails/logs" element={<EmailLogs />} />
              
              {/* Bookings */}
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/new" element={<NewBooking />} />
              <Route path="bookings/edit/:id" element={<EditBookings />} />
              {/* Promotions */}
              <Route path="promotions" element={<Promotions />} />
              <Route path="promotions/new" element={<NewPromotions />} />
              <Route path="promotions/edit/:id" element={<EditPromotions />} />
              {/* Referrals */}
              <Route path="referrals" element={<Referrals />} />
              <Route path="referrals/new" element={<NewReferral />} />
              <Route path="referrals/edit/:id" element={<EditReferral />} />
              {/* Services */}
              <Route path="services" element={<Services />} />
              <Route path="services/new" element={<NewService />} />
              <Route path="services/edit/:id" element={<EditService />} />
              {/* Giftcards */}
              <Route path="giftcards" element={<Giftcards />} />
              <Route path="giftcards/new" element={<NewGiftcard />} />
              <Route path="giftcards/edit/:id" element={<EditGiftcard />} />
              <Route
                path="giftcards/form-widget"
                element={<GiftcardFormWidget />}
              />
              <Route
                path="giftcards/settings"
                element={<GiftcardSettingsForm />}
              />
              {/* Services Settings */}
              <Route
                path="services/settings"
                element={<ServiceSettingsPage />}
              />

              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />

              {/* Categories */}
              <Route path="categories" element={<Categories />} />
              <Route path="categories/new" element={<NewCategory />} />
              <Route path="categories/edit/:id" element={<EditCategory />} />

              {/* Variables */}
              <Route path="variables" element={<Variables />} />
              <Route path="variables/new" element={<NewVariable />} />
              <Route path="variables/edit/:id" element={<EditVariable />} />

              {/* Customers */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<NewCustomers />} />
              <Route path="customers/edit/:id" element={<EditCustomers />} />

              {/* Quotes */}
              <Route path="quotes" element={<Quotes />} />
              {/* <Route path="quotes/new" element={<NewQuotes />} /> */}
              <Route path="quotes/edit/:id" element={<EditQuotes />} />

              {/* Providers */}
              <Route path="providers" element={<Providers />} />
              <Route path="providers/new" element={<NewProviders />} />
              <Route path="providers/edit/:id" element={<EditProviders />} />

              {/* Staffs */}
              <Route path="staffs" element={<Staffs />} />
              <Route path="staffs/new" element={<NewStaff />} />
              <Route path="staffs/edit/:id" element={<EditStaffPage />} />
              <Route
                path="staffs/edit/:id/email-preferences"
                element={<EditStaffEmailPreferencesPage />}
              />

              <Route path="analytics" element={<TrackingDashboard />} />

              {/* Leads */}
              <Route path="leads" element={<Leads />} />
              <Route path="leads/new" element={<NewLeadPage />} />
              <Route path="leads/funnels/:slug" element={<FunnelBoardPage />} />

              {/* Team Availability */}
              <Route path="teamavailability" element={<TeamAvailability />} />

              {/* Locations */}
              <Route path="locations" element={<Locations />} />
              <Route path="locations/new" element={<NewLocation />} />
              <Route path="locations/edit/:id" element={<EditLocation />} />

              {/* Frequencies */}
              <Route path="frequencies" element={<Frequencies />} />
              <Route path="frequencies/new" element={<NewFrequency />} />
              <Route path="frequencies/edit/:id" element={<EditFrequency />} />

              {/* Addons */}
              <Route path="addons" element={<Addons />} />
              <Route path="addons/new" element={<NewAddon />} />
              <Route path="addons/edit/:id" element={<EditAddon />} />

              {/* Tags */}
              <Route path="tags" element={<Tags />} />
              <Route
                path="tags/:tagId/customers"
                element={<TagCustomersPage />}
              />
              <Route path="recurringbookings" element={<RecurringBookingsPageIndex />} />
              <Route path="cancel" element={<CancelBookingPage />} />
              {/* *** SALES TAX (ADMIN) *** */}
              <Route path="sales-tax" element={<SalesTaxPage />} />
              <Route path="sales-tax/new" element={<NewSalesTax />} />
              <Route path="sales-tax/edit/:id" element={<EditSalesTax />} />
              <Route path="sales-tax/settings" element={<SalesTaxSettings />} />
              {/* Automated Tasks */}
              <Route path="automated-tasks" element={<AutomatedTasksPage />} />
              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />
              <Route
                path="integrations/google-analytics"
                element={<GoogleAnalyticsPage />}
              />
              <Route
                path="integrations/google-calendar"
                element={<GoogleCalendarPage />}
              />
              <Route
                path="integrations/quickbooks"
                element={<QuickBooksPage />}
              />

              {/* Form Builder */}
              <Route path="form-builder" element={<FormBuilder />} />

              {/* Submissions */}
              <Route
                path="submissions"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Submissions</h1>
                  </div>
                }
              />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Settings</h1>
                  </div>
                }
              />

              <Route
                path="*"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </Route>

            {/* Provider Routes */}
            <Route
              path="/provider/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.Provider]}>
                  <ProviderLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/provider/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Provider Dashboard</h1>
                  </div>
                }
              />
              <Route
                path="*"
                element={<Navigate to="/provider/dashboard" replace />}
              />
            </Route>
            <Route path="messaging" element={<MessagingPage />} />
            {/* Staff Routes */}
            <Route
              path="/staff/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.Staff]}>
                  <StaffLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/staff/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                  </div>
                }
              />
              <Route path="messaging" element={<MessagingPage />} />

              {/* Bookings */}
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/new" element={<NewBooking />} />
              <Route path="bookings/edit/:id" element={<EditBookings />} />

              {/* Services */}
              <Route path="services" element={<Services />} />
              <Route path="services/new" element={<NewService />} />
              <Route path="services/edit/:id" element={<EditService />} />
              {/* Services Settings */}
              <Route
                path="services/settings"
                element={<ServiceSettingsPage />}
              />

              {/* Categories */}
              <Route path="categories" element={<Categories />} />
              <Route path="categories/new" element={<NewCategory />} />
              <Route path="categories/edit/:id" element={<EditCategory />} />

              {/* Variables */}
              <Route path="variables" element={<Variables />} />
              <Route path="variables/new" element={<NewVariable />} />
              <Route path="variables/edit/:id" element={<EditVariable />} />

              {/* Customers */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<NewCustomers />} />
              <Route path="customers/edit/:id" element={<EditCustomers />} />

              {/* Quotes */}
              <Route path="quotes" element={<Quotes />} />

              {/* Providers */}
              <Route path="providers" element={<Providers />} />
              <Route path="providers/new" element={<NewProviders />} />
              <Route path="providers/edit/:id" element={<EditProviders />} />

              {/* Staffs */}
              <Route path="staffs" element={<Staffs />} />
              <Route path="staffs/new" element={<NewStaff />} />
              <Route path="staffs/edit/:id" element={<EditStaffPage />} />
              <Route
                path="staffs/edit/:id/email-preferences"
                element={<EditStaffEmailPreferencesPage />}
              />

              {/* Team Availability */}
              <Route path="teamavailability" element={<TeamAvailability />} />

              {/* Locations */}
              <Route path="locations" element={<Locations />} />
              <Route path="locations/new" element={<NewLocation />} />
              <Route path="locations/edit/:id" element={<EditLocation />} />

              {/* Frequencies */}
              <Route path="frequencies" element={<Frequencies />} />
              <Route path="frequencies/new" element={<NewFrequency />} />
              <Route path="frequencies/edit/:id" element={<EditFrequency />} />

              {/* Addons */}
              <Route path="addons" element={<Addons />} />
              <Route path="addons/new" element={<NewAddon />} />
              <Route path="addons/edit/:id" element={<EditAddon />} />

              {/* Tags */}
              <Route path="tags" element={<Tags />} />
              <Route path="cancel" element={<CancelBookingPage />} />
              {/* *** SALES TAX (STAFF) – if you want staff to access it *** */}
              <Route path="sales-tax" element={<SalesTaxPage />} />
              <Route path="sales-tax/new" element={<NewSalesTax />} />
              <Route path="sales-tax/edit/:id" element={<EditSalesTax />} />
              <Route path="sales-tax/settings" element={<SalesTaxSettings />} />
              {/* Automated Tasks */}
              <Route path="automated-tasks" element={<AutomatedTasksPage />} />
              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />
              <Route
                path="integrations/google-analytics"
                element={<GoogleAnalyticsPage />}
              />
              <Route
                path="integrations/google-calendar"
                element={<GoogleCalendarPage />}
              />
              <Route
                path="integrations/quickbooks"
                element={<QuickBooksPage />}
              />
              {/* Form Builder */}
              <Route path="form-builder" element={<FormBuilder />} />

              <Route
                path="*"
                element={<Navigate to="/staff/dashboard" replace />}
              />
            </Route>

            {/* Technical Admin Routes */}
            <Route
              path="/technical/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.Technical]}>
                  <TechnicalAdminLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/technical/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">
                      Technical Admin Dashboard
                    </h1>
                  </div>
                }
              />
              <Route path="messaging" element={<MessagingPage />} />
              {/* Bookings */}
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/new" element={<NewBooking />} />
              <Route path="bookings/edit/:id" element={<EditBookings />} />
              {/* Services */}
              <Route path="services" element={<Services />} />
              <Route path="services/new" element={<NewService />} />
              <Route path="services/edit/:id" element={<EditService />} />
              {/* Services Settings */}
              <Route
                path="services/settings"
                element={<ServiceSettingsPage />}
              />
              {/* Categories */}
              <Route path="categories" element={<Categories />} />
              <Route path="categories/new" element={<NewCategory />} />
              <Route path="categories/edit/:id" element={<EditCategory />} />
              {/* Variables */}
              <Route path="variables" element={<Variables />} />
              <Route path="variables/new" element={<NewVariable />} />
              <Route path="variables/edit/:id" element={<EditVariable />} />
              {/* Customers */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<NewCustomers />} />
              <Route path="customers/edit/:id" element={<EditCustomers />} />
              {/* Quotes */}
              <Route path="quotes" element={<Quotes />} />
              {/* Providers */}
              <Route path="providers" element={<Providers />} />
              <Route path="providers/new" element={<NewProviders />} />
              <Route path="providers/edit/:id" element={<EditProviders />} />
              {/* Staffs */}
              <Route path="staffs" element={<Staffs />} />
              <Route path="staffs/new" element={<NewStaff />} />
              <Route path="staffs/edit/:id" element={<EditStaffPage />} />
              <Route
                path="staffs/edit/:id/email-preferences"
                element={<EditStaffEmailPreferencesPage />}
              />
              {/* Leads */}
              <Route path="leads" element={<Leads />} />
              {/* Team Availability */}
              <Route path="teamavailability" element={<TeamAvailability />} />
              {/* Locations */}
              <Route path="locations" element={<Locations />} />
              <Route path="locations/new" element={<NewLocation />} />
              <Route path="locations/edit/:id" element={<EditLocation />} />
              {/* Frequencies */}
              <Route path="frequencies" element={<Frequencies />} />
              <Route path="frequencies/new" element={<NewFrequency />} />
              <Route path="frequencies/edit/:id" element={<EditFrequency />} />
              {/* Addons */}
              <Route path="addons" element={<Addons />} />
              <Route path="addons/new" element={<NewAddon />} />
              <Route path="addons/edit/:id" element={<EditAddon />} />
              {/* Tags */}
              <Route path="tags" element={<Tags />} />
              <Route path="cancel" element={<CancelBookingPage />} />
              {/* *** SALES TAX (TECHNICAL) *** */}
              <Route path="sales-tax" element={<SalesTaxPage />} />
              <Route path="sales-tax/new" element={<NewSalesTax />} />
              <Route path="sales-tax/edit/:id" element={<EditSalesTax />} />
              <Route path="sales-tax/settings" element={<SalesTaxSettings />} />
              {/* Automated Tasks */}
              <Route path="automated-tasks" element={<AutomatedTasksPage />} />
              {/* Integrations */}
              <Route path="integrations" element={<TwilioIntegrationPage />} />
              // child of /admin/*
              <Route
                path="integrations/google-analytics"
                element={<GoogleAnalyticsPage />}
              />
              <Route
                path="integrations/google-calendar"
                element={<GoogleCalendarPage />}
              />
              <Route
                path="integrations/quickbooks"
                element={<QuickBooksPage />}
              />
              {/* Form Builder */}
              <Route path="form-builder" element={<FormBuilder />} />
              {/* Form Builder */}
              <Route path="form-builder" element={<FormBuilder />} />
              <Route
                path="*"
                element={<Navigate to="/technical/dashboard" replace />}
              />
            </Route>

            {/* Customer Routes */}
            <Route
              path="/customer/*"
              element={
                <RoleBasedRoute allowedRoles={[ROLES.Customer]}>
                  <CustomerLayout />
                </RoleBasedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/customer/dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Customer Dashboard</h1>
                  </div>
                }
              />
              <Route
                path="*"
                element={<Navigate to="/customer/dashboard" replace />}
              />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}
