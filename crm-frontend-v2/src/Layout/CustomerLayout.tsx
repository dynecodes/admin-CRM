import { Outlet } from "react-router-dom";
import Header from "./Header";

const CustomerLayout = () => {
  return (
    <>
      <Header isMobile={false} togglePrimaryFromHeader={() => {}} />
      <div className="pt-14 p-4">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default CustomerLayout;