import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm from "../../../components/customers/CustomerForm";
import { useCustomers } from "../../../hooks/Customers/useCustomers";
import { Customer } from "../../../types/customers";

const NewCustomers: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addCustomer } = useCustomers();

  const handleSuccess = async (
    values: Omit<Customer, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await addCustomer(values);         // ← await the request
      navigate(`/${pathPrefix}/customers`);
    } catch (err: any) {
      // surface error (toast or alert)
      alert(err?.message || "Failed to create customer");
    }
  };

  return (
    <div className="px-5 pb-5">
      <CustomerForm
        onSubmit={handleSuccess}
        onCancel={() => navigate(`/${pathPrefix}/customers`)}
      />
    </div>
  );
};


export default NewCustomers;
