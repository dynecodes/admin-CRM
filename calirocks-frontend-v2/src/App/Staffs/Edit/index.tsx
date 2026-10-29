import { useNavigate, useParams } from "react-router-dom";
import { useStaffs } from "../../../hooks/Staffs/useStaffs";
import EditStaffForm from "../../../components/Staffs/EditStaffForm";

export default function EditStaffPage() {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { staffs, updateStaff } = useStaffs();

  const staff = staffs.find((s) => s.id === Number(id));
  if (!staff) {
    return (
      <div className="px-5 pb-5">
        <div className="py-8 text-center text-gray-500">Staff not found</div>
        <div className="text-center">
          <button className="text-blue-600" onClick={() => navigate(`/${pathPrefix}/staffs`)}>
            Back to Staffs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <EditStaffForm
        staff={staff}
        onSubmit={(patch) => {
          updateStaff(staff.id, patch);
          navigate(`/${pathPrefix}/staffs`);
        }}
        onCancel={() => navigate(`/${pathPrefix}/staffs`)}
      />
    </div>
  );
}
