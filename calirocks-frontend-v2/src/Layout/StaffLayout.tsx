import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import DynamicSidebar from "./DynamicSidebar";
import { staffMenuItems } from "./menus/staffMenu";
import { useNotifications } from "../hooks/Notifications/useNotifications";
import NotificationBanner from "../components/Messaging/NotificationBanner";

const StaffLayout = () => {
  // Notification system
  const {
    preferences,
    savePreferences,
    doNotDisturb,
    toggleDoNotDisturb,
    notificationBanners,
    removeBanner,
    unreadCount,
  } = useNotifications();

  const [s1OpenDesktop, setS1OpenDesktop] = useState(true);
  const [s2Open, setS2Open] = useState(false);
  const [s1OpenMobile, setS1OpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const S1WDesktop = s1OpenDesktop ? 200 : 60;
  const S1WMobile = s1OpenMobile ? 200 : 0;
  const S2WDesktop = s2Open ? 200 : 0;

  const S1_W = isMobile ? S1WMobile : S1WDesktop;
  const S2_W = isMobile ? 0 : S2WDesktop;
  const TOTAL_W = S1_W + S2_W;

  const SHOW_SIDEBAR_HEADER = !isMobile && TOTAL_W > 0;
  const SIDEBAR_HEADER_HEIGHT_PX = 48;

  const togglePrimaryFromHeader = () => {
    if (isMobile) setS1OpenMobile(!s1OpenMobile);
    else setS1OpenDesktop(!s1OpenDesktop);
  };

  const handleParentClick = (menuName: string, hasChildren: boolean) => {
    if (!hasChildren) {
      setActiveParent(menuName);
      setActiveChild(null);
      return;
    }

    if (isMobile) {
      setActiveParent((prev) => (prev === menuName ? null : menuName));
    } else {
      setS2Open(true);
      setActiveParent(menuName);
      setS1OpenDesktop(false);
    }
  };

  const mainStyle = isMobile
    ? {
        left: 0,
        width: "100%",
        transform: `translateX(${S1WMobile}px)`,
        willChange: "transform",
      }
    : {
        left: TOTAL_W,
        width: `calc(100% - ${TOTAL_W}px)`,
      };

  return (
    <>
      <Header isMobile={isMobile} togglePrimaryFromHeader={togglePrimaryFromHeader} />

      <div className="fixed bg-gray-50 z-40" style={{ top: 56, left: 0, right: 0, bottom: 0 }}>
        <DynamicSidebar
          isMobile={isMobile}
          s1OpenDesktop={s1OpenDesktop}
          s1OpenMobile={s1OpenMobile}
          s2Open={s2Open}
          activeParent={activeParent}
          activeChild={activeChild}
          S1_W={S1_W}
          S2_W={S2_W}
          SHOW_SIDEBAR_HEADER={SHOW_SIDEBAR_HEADER}
          SIDEBAR_HEADER_HEIGHT_PX={SIDEBAR_HEADER_HEIGHT_PX}
          handleParentClick={handleParentClick}
          setActiveChild={setActiveChild}
          setS1OpenDesktop={setS1OpenDesktop}
          setS1OpenMobile={setS1OpenMobile}
          setS2Open={setS2Open}
          menuItems={staffMenuItems}
          unreadCount={unreadCount.total}
        />

        <main
          id="main-scroll-container"
          className="absolute top-0 bottom-0 bg-white transition-all duration-300 overflow-auto"
          style={mainStyle}
        >
          <div className="w-full max-w-[1070px] pt-10 mx-auto p-4">
            <Outlet
              context={{
                notificationPreferences: preferences,
                onSaveNotificationPreferences: savePreferences,
                doNotDisturb,
                onToggleDoNotDisturb: toggleDoNotDisturb,
              }}
            />
          </div>
        </main>
      </div>

      {/* Notification Banners - Rendered globally */}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {notificationBanners.map((banner) => (
          <NotificationBanner
            key={banner.id}
            type={banner.type} // ADD THIS
            chatId={banner.chatId} // ADD THIS
            chatName={banner.chatName}
            message={banner.message}
            senderName={banner.senderName}
            senderProfilePic={banner.senderProfilePic}
            onClose={() => removeBanner(banner.id)}
          />
        ))}
      </div>
    </>
  );
};

export default StaffLayout;