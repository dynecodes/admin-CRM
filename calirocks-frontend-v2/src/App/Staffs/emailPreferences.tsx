import { useNavigate, useParams } from "react-router-dom";
import { useStaffs } from "../../hooks/Staffs/useStaffs"; // ensure this hook exists
import EditStaffEmailPrefs from "../../components/Staffs/EmialPreferences";

export default function EditStaffEmailPreferencesPage() {
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
      <EditStaffEmailPrefs
        staff={staff}
        onCancel={() => navigate(`/${pathPrefix}/staffs/edit/${staff.id}`)}
        onSubmit={(patch) => {
          updateStaff(staff.id, patch);
          // stay on this page after saving
        }}
      />
    </div>
  );
}
