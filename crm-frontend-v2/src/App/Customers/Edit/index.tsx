// src\App\Customers\Edit\index.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomers } from "../../../hooks/Customers/useCustomers";
import EditCustomerForm from "../../../components/customers/EditCustomerForm";

const EditCustomers: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { customers } = useCustomers();

  const customer = customers.find((c) => c.id === Number(id));

  if (!customer) {
    return (
      <div className="px-5 pb-5">
        {/* <div className="py-8 text-center">
          <p className="text-lg text-gray-500">Customer not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/customers`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Customers
          </button>
        </div> */}
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <EditCustomerForm
        customer={customer}
        onCancel={() => navigate(`/${pathPrefix}/customers`)}
        onSaved={() => navigate(`/${pathPrefix}/customers`)}
      />
    </div>
  );
};

export default EditCustomers;
