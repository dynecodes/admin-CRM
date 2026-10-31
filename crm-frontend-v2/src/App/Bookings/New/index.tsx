import * as React from "react";
import { useNavigate } from "react-router-dom";
import BookingForm from "../../../components/bookings/BookingForm";

import { useBookings } from "../../../hooks/Bookings/useBookings";

const NewBooking: React.FC = () => {
  const navigate = useNavigate();
  const { createBooking } = useBookings();            // ← use the hook
  const pathPrefix = window.location.pathname.split('/')[1];

  const handleComplete = async (payload: any) => {
    await createBooking(payload as any);              // ← DO THE POST
    navigate(`/${pathPrefix}/bookings`);             // ← then navigate
  };

  return (
    <div className="px-5 pb-5">
      <BookingForm
        onComplete={handleComplete}
        onCancel={() => navigate(`/${pathPrefix}/bookings`)}
      />
    </div>
  );
};


export default NewBooking;
