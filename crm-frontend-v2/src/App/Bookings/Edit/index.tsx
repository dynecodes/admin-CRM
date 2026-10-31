// src/pages/Admin/Bookings/Edit.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditFormBookings from "../../../components/bookings/EditBookingForm";

const EditBookings: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);

  if (!Number.isFinite(bookingId)) {
    return <div className="p-5 text-gray-500">Invalid booking id</div>;
  }

  return (
    <div className="px-5 pb-5">
      <EditFormBookings
        bookingId={bookingId}
        basePath="/bookings"         // adjust to your API route
        redirectToOnSave={`/${pathPrefix}/bookings`}
        onCancel={() => navigate(`/${pathPrefix}/bookings`)}
      />
    </div>
  );
};

export default EditBookings;
