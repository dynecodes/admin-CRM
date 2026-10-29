import React from "react";
import { useNavigate } from "react-router-dom";
import StaffsForm from "../../../components/Staffs/StaffsForm";
import { useStaffs } from "../../../hooks/Staffs/useStaffs";
import { Staff } from "../../../types/staffs";

const NewStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addStaff } = useStaffs();

  const handleSuccess = (
    values: Omit<Staff, "id" | "created_at" | "updated_at">,
  ) => {
    addStaff(values);
    navigate(`/${pathPrefix}/staffs`);
  };

  return (
    <div className="px-5 pb-5">
      <StaffsForm
        onSubmit={handleSuccess}
        onCancel={() => navigate(`/${pathPrefix}/staffs`)}
      />
    </div>
  );
};

export default NewStaffPage;
