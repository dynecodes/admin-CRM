import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import LeadForm from "../../../components/leads/LeadForm";

const NewLeadPage: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix =
    (typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "admin") || "admin";

  const goBackToList = () => navigate(`/${pathPrefix}/leads`);

  return (
    <div className="px-5 pb-10 text-gray-900 antialiased">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/leads`}
              className="text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Leads
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="mx-1 h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium text-gray-500 sm:text-sm">New Lead</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page header (matches the screenshot style) */}
      <div className="mb-4 flex items-start gap-3">
        <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0Zm-3 7H7a4 4 0 00-4 4v2h18v-2a4 4 0 00-4-4h-4Z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Add New Lead</h1>
          <p className="mt-1 text-sm text-gray-500">Add a new lead to your list</p>
        </div>
      </div>

      <LeadForm onSuccess={goBackToList} onCancel={goBackToList} />
    </div>
  );
};

export default NewLeadPage;
