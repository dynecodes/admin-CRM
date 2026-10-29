// // src/App/SalesTaxes/New/index.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "flowbite-react";
import { Percent } from "lucide-react";
import SalesTaxForm from "../../../components/salesTax/SalesTaxForm";
import { HiExclamationCircle, HiCog, HiOutlineCurrencyDollar } from "react-icons/hi";
const NewSalesTax: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1] || "admin";

  const handleSuccess = () => {
    navigate(`/${pathPrefix}/sales-tax`);
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/sales-tax`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 pt-4 pb-10 sm:px-5">
      {/* Breadcrumbs */}
      <nav
        className="mb-4 flex items-center text-gray-700"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/sales-tax`}
              className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-600 sm:text-sm"
            >
              Sales Taxes
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
               <HiOutlineCurrencyDollar className="h-6 w-6 text-white"/>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                New Sales Tax
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header outside the card – match Promotions */}
      <div className="mb-4 flex items-center gap-3 pt-1 sm:gap-4">
        <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-12 sm:w-12">
            <HiOutlineCurrencyDollar className="h-6 w-6 text-white"/>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            New Sales Tax
          </h1>
          <p className="text-sm text-gray-500">
            Configure how sales tax is applied to bookings
          </p>
        </div>
      </div>

      {/* Main card – only fields inside, like Promotions */}
      <div className="min-h-[700px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
        <div className="px-6 py-9">
          <SalesTaxForm formId="sales-tax-form" onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Buttons OUTSIDE the card, like Promotions */}
      <div className="mt-4 flex justify-end gap-3">
        <Button
          type="button"
          color="light"
          className="w-full cursor-pointer sm:w-auto"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="sales-tax-form"
          color="gray"
          className="w-full cursor-pointer sm:w-auto"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default NewSalesTax;
