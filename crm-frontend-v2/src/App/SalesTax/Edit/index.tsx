// src/App/SalesTaxes/Edit/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner } from "flowbite-react";
import SalesTaxForm from "../../../components/salesTax/SalesTaxForm";
import { useSalesTax } from "../../../hooks/SalesTax/useSalesTax";
import { SalesTax } from "../../../types/salesTax";

const EditSalesTax: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];

  const { rules, fetchRules, loading: rulesLoading } = useSalesTax();

  const [salesTax, setSalesTax] = useState<SalesTax | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Sales tax ID is required");
        setLocalLoading(false);
        return;
      }

      try {
        // ensure rules are loaded
        if (!rules.length) {
          await fetchRules();
        }
        const numericId = parseInt(id, 10);
        const found = (rules.length ? rules : []).find(
          (r) => r.id === numericId,
        );
        if (!found) {
          setError("Sales tax not found");
        } else {
          setSalesTax(found);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load sales tax");
      } finally {
        setLocalLoading(false);
      }
    };

    load();
  }, [id, rules, fetchRules]);

  const handleSuccess = () => {
    navigate(`/${pathPrefix}/sales-tax`);
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/sales-tax`);
  };

  if (rulesLoading || localLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !salesTax) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Sales tax not found"}</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/sales-tax`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to Sales Taxes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <SalesTaxForm
        rule={salesTax}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditSalesTax;
