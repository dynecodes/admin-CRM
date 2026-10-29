import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "./menus/types";
import useTheme from "../hooks/useTheme";

interface SidebarProps {
  isMobile: boolean;
  s1OpenDesktop: boolean;
  s1OpenMobile: boolean;
  s2Open: boolean;
  activeParent: string | null;
  activeChild: string | null;
  S1_W: number;
  S2_W: number;
  SHOW_SIDEBAR_HEADER: boolean;
  SIDEBAR_HEADER_HEIGHT_PX: number;
  handleParentClick: (menuName: string, hasChildren: boolean) => void;
  setActiveChild: (name: string) => void;
  setS1OpenDesktop: (val: boolean) => void;
  setS1OpenMobile: (val: boolean) => void;
  setS2Open: (val: boolean) => void;
  menuItems: MenuItem[];
  unreadCount?: number;
}

const DynamicSidebar: React.FC<SidebarProps> = ({
  isMobile,
  s1OpenDesktop,
  s1OpenMobile,
  s2Open,
  activeParent,
  S2_W,
  SHOW_SIDEBAR_HEADER,
  SIDEBAR_HEADER_HEIGHT_PX,
  handleParentClick,
  setActiveChild,
  setS1OpenDesktop,
  setS1OpenMobile,
  setS2Open,
  menuItems,
  unreadCount = 0,
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const { getColorByPath } = useTheme();

  const s1Ref = React.useRef<HTMLElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  const [suppressParentHighlight, setSuppressParentHighlight] =
    React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = React.useState<string | null>(null);

  const SIDEBAR_WIDTH = 200;
  const COLLAPSED_WIDTH = 60;
  const submenuWidth = s2Open ? S2_W : 0;

  const scrollParentIntoView = (menuName: string) => {
    const container = s1Ref.current;
    const el = itemRefs.current[menuName];
    if (!container || !el) return;

    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const padding = 8;
    const targetTop = container.scrollTop + (eRect.top - cRect.top) - padding;

    container.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  };

  const onParentClickMobile = (menuName: string) => {
    setSuppressParentHighlight(false);
    handleParentClick(menuName, true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollParentIntoView(menuName);
      });
    });
  };

  const isLinkActive = (link?: string) =>
    !!link && (pathname === link || pathname.startsWith(link + "/"));

  React.useEffect(() => {
    if (isMobile) {
      if (s1OpenMobile) setS1OpenMobile(false);
      if (s2Open) setS2Open(false);
    }
  }, [pathname]);

  const activeMenu = menuItems.find((item) => item.name === activeParent);

  const anyParentOwnsRoute = React.useMemo(
    () =>
      menuItems.some(
        (p) => p.children && p.children.some((c: any) => isLinkActive(c.link)),
      ),
    [pathname],
  );

  // ===== HEADER COLORS (Top "MENU" bar) =====
  // const headerBgColor = getColorByPath("sidebar", "header", "background");
  // const headerTextColor = getColorByPath("sidebar", "header", "text");
  // const headerBorderColor = getColorByPath("sidebar", "header", "border");

  // // ===== MENU COLORS (Main navigation area) =====
  // const menuBgColor = getColorByPath("sidebar", "menu", "background");
  // const menuTextColor = getColorByPath("sidebar", "menu", "text");
  // const menuActiveBgColor = "#EFF6FF"; // Fixed color for active/hovered background
  // const menuActiveTextColor = "#1A1A1A"; // Fixed color for active/hovered text and icons
  // const menuBorderColor = getColorByPath("sidebar", "menu", "border");

  // // ===== SUBMENU COLORS (Right panel with sub-items) =====
  // const submenuBgColor = getColorByPath("sidebar", "submenu", "background");
  // const submenuTextColor = getColorByPath("sidebar", "submenu", "text");
// ===== HEADER COLORS (Red + Black Theme) =====
const headerTextColor = "#FF6F70";     // muted red
const headerBorderColor = "#FFFFFF";   // dark red border

// ===== SIDEBAR (S1) COLORS =====
const menuBgColor = "#FFFFFF";         // white
const menuTextColor = "#1A1A1A";       // white text
const menuActiveBgColor = "#FFFFFF";   // for hover/active
const menuActiveTextColor = "#FF0000"; // for active icons/text
const menuBorderColor = "#FFFFFF"     // borders 

// ===== SUBMENU (S2) COLORS =====
const submenuBgColor = "#FFFFFF";    
const submenuTextColor = "#1A1A1A";

  const currentSidebarWidth = s1OpenDesktop ? SIDEBAR_WIDTH : COLLAPSED_WIDTH;

  return (
    <>
      {/* HEADER BAR - Top "MENU" bar */}
      {SHOW_SIDEBAR_HEADER && (
        <div
          className="flex h-14 items-center justify-between border border-r border-b"
          style={{
            width: currentSidebarWidth + submenuWidth,
            backgroundColor: "#F9FAFB",
            color: headerTextColor,
            borderColor: headerBorderColor,
            transition: "width 0.3s ease-in-out",
            paddingLeft: "12px",
            paddingRight: "12px",
          }}
        >
          <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1">
            <button
              onClick={() => {
                setS2Open(false);
                isMobile
                  ? setS1OpenMobile(!s1OpenMobile)
                  : setS1OpenDesktop(!s1OpenDesktop);
              }}
              aria-label="Toggle Sidebar 1"
              className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
              style={{
                color: headerTextColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#FF6F70";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = headerTextColor;
              }}
            >
              <div className="cursor-pointer">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </button>
            {s1OpenDesktop && (
              <h2
                className="truncate text-sm font-medium transition-opacity duration-200"
                style={{ color: headerTextColor }}
              >
                Menu
              </h2>
            )}
          </div>

          {s2Open && (
            <button
              onClick={() => setS2Open(false)}
              aria-label="Close Sidebar 2"
              className="relative ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
              style={{
                color: headerTextColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FF6F70";
                e.currentTarget.style.color = "#FF6F70";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = headerTextColor;
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* MAIN NAVIGATION SIDEBAR */}
      <aside
        ref={s1Ref}
        className="group &::-webkit-scrollbar-thumb]:bg-gray-600 &::-webkit-scrollbar-thumb]:hover:bg-gray-500 absolute left-0 mt-2 border-r transition-all duration-300 [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent"
        style={{
          width: currentSidebarWidth,
          top: SHOW_SIDEBAR_HEADER ? SIDEBAR_HEADER_HEIGHT_PX : 0,
          bottom: 0,
          backgroundColor: menuBgColor,
          color: menuTextColor,
          borderColor: menuBorderColor,
          overflowY: "auto",
          overflowX: "visible",
        }}
      >
        {(!isMobile || s1OpenMobile) && (
          <ul className="space-y-1 py-2 pr-2 pl-[2px] font-medium">
            {menuItems.map((item) => {
              const hasChildren = !!(item.children && item.children.length > 0);
              const routeClaimsThisParent =
                hasChildren &&
                item.children!.some((c: any) => isLinkActive(c.link));
              const isOpen = activeParent === item.name;

              const parentIsActive = anyParentOwnsRoute
                ? routeClaimsThisParent
                : suppressParentHighlight
                  ? false
                  : isOpen;

              const isActive = hasChildren
                ? parentIsActive
                : isLinkActive(item.link);

              const baseClasses = `group flex items-center rounded-lg p-2.5 w-full text-left cursor-pointer transition-all text-sm ${
                isActive ? "font-semibold" : ""
              } ${isMobile ? "justify-start" : s1OpenDesktop ? "justify-start" : "justify-center"} relative`;

              return (
                <li
                  key={item.name}
                  ref={(el) => {
                    itemRefs.current[item.name] = el;
                  }}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {hasChildren ? (
                    <button
                      onClick={() => {
                        setSuppressParentHighlight(false);
                        isMobile
                          ? onParentClickMobile(item.name)
                          : handleParentClick(item.name, true);
                      }}
                      className={baseClasses}
                      style={
                        isActive || hoveredItem === item.name
                          ? {
                              backgroundColor: menuActiveBgColor,
                              color: menuActiveTextColor,
                            }
                          : {}
                      }
                      aria-expanded={isMobile ? isOpen : undefined}
                      aria-controls={
                        isMobile ? `submenu-${item.name}` : undefined
                      }
                    >
                      <div className="flex flex-1 items-center">
                        <span
                          style={{
                            display: "inline-flex",
                          }}
                          className={
                            isActive || hoveredItem === item.name
                              ? "[&_svg]:!stroke-[#FF0000] [&_svg]:!text-[#FF0000]"
                              : ""
                          }
                        >
                          {React.isValidElement(item.icon)
                            ? React.cloneElement(
                                item.icon as React.ReactElement<any>,
                                {
                                  style: {
                                    ...((item.icon as React.ReactElement<any>)
                                      .props?.style || {}),
                                    color:
                                      isActive || hoveredItem === item.name
                                        ? menuActiveTextColor
                                        : undefined,
                                    stroke:
                                      isActive || hoveredItem === item.name
                                        ? menuActiveTextColor
                                        : undefined,
                                  },
                                },
                              )
                            : item.icon}
                        </span>
                        {(s1OpenDesktop || isMobile) && (
                          <span className="ml-3 text-sm">{item.label}</span>
                        )}
                        {item.name === "messaging" && unreadCount > 0 && (
                          <span className="ml-auto min-w-[20px] rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>

                      {isMobile && (
                        <svg
                          className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                      {(isActive || hoveredItem === item.name) && (
                        <div
                          className="absolute top-0 bottom-0 left-0 w-1 rounded-r"
                          style={{ backgroundColor: "#FF6F70" }}
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.link || "#"}
                      onClick={() => {
                        setSuppressParentHighlight(true);
                        if (isMobile) setS1OpenMobile(false);
                        if (!isMobile) setS2Open(false);
                      }}
                      className={baseClasses}
                      style={
                        isActive || hoveredItem === item.name
                          ? {
                              backgroundColor: menuActiveBgColor,
                              color: menuActiveTextColor,
                            }
                          : {}
                      }
                      role="menuitem"
                    >
                      <span
                        style={{
                          display: "inline-flex",
                        }}
                        className={
                          isActive || hoveredItem === item.name
                            ? "[&_svg]:!stroke-[#FF0000] [&_svg]:!text-[#FF0000]"

                            : ""
                        }
                      >
                        {React.isValidElement(item.icon)
                          ? React.cloneElement(
                              item.icon as React.ReactElement<any>,
                              {
                                style: {
                                  ...((item.icon as React.ReactElement<any>)
                                    .props?.style || {}),
                                  color:
                                    isActive || hoveredItem === item.name
                                      ? menuActiveTextColor
                                      : undefined,
                                  stroke:
                                    isActive || hoveredItem === item.name
                                      ? menuActiveTextColor
                                      : undefined,
                                },
                              },
                            )
                          : item.icon}
                      </span>
                      {(s1OpenDesktop || isMobile) && (
                        <span className="ml-3 text-sm">{item.label}</span>
                      )}
                      {item.name === "messaging" && unreadCount > 0 && (
                        <span className="ml-auto min-w-[20px] rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                      {(isActive || hoveredItem === item.name) && (
                        <div
                          className="absolute top-0 bottom-0 left-0 w-1 rounded-r"
                          style={{ backgroundColor: "#FF6F70" }}
                        />
                      )}
                    </Link>
                  )}

                  {!s1OpenDesktop && !isMobile && hoveredItem === item.name && (
                    <div
                      className="pointer-events-none fixed z-50"
                      style={{
                        left: `${currentSidebarWidth + 8}px`,
                        top: `${(() => {
                          const rect =
                            itemRefs.current[
                              item.name
                            ]?.getBoundingClientRect();
                          if (!rect) return 0;
                          return rect.top + rect.height / 2;
                        })()}px`,
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div
                        className="relative rounded-lg px-3 py-2 text-center text-xs font-medium text-white shadow-xl"
                        style={{ backgroundColor: "#FF6F70" }}
                      >
                        <div
                          className="absolute top-1/2 left-0"
                          style={{
                            transform: "translate(-100%, -50%)",
                            width: 0,
                            height: 0,
                            borderTop: "6px solid transparent",
                            borderBottom: "6px solid transparent",
                            borderRight: "6px solid #FF6F70",
                          }}
                        />
                        {item.label}
                      </div>
                    </div>
                  )}

                  {hasChildren && isMobile && isOpen && (
                    <ul
                      id={`submenu-${item.name}`}
                      className="mt-1 ml-6 space-y-1"
                      role="menu"
                      aria-label={`${item.label} submenu`}
                    >
                      {item.children?.map((child) => {
                        const childActive = isLinkActive(child.link);
                        const isChildHovered = hoveredChild === child.name;
                        return (
                          <li key={child.name}>
                            {child.link && (
                              <Link
                                to={child.link}
                                onClick={() => {
                                  setActiveChild(child.name);
                                  setSuppressParentHighlight(false);
                                  if (isMobile) {
                                    setS1OpenMobile(false);
                                    setS2Open(false);
                                  }
                                }}
                                onMouseEnter={() => setHoveredChild(child.name)}
                                onMouseLeave={() => setHoveredChild(null)}
                                className="relative flex w-full cursor-pointer items-center rounded-lg p-3.5 text-sm transition-all"
                                style={
                                  childActive || isChildHovered
                                    ? {
                                        backgroundColor: menuActiveBgColor,
                                        color: menuActiveTextColor,
                                      }
                                    : {}
                                }
                                role="menuitem"
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                  }}
                                  className={
                                    childActive || isChildHovered
                                      ? "[&_svg]:!stroke-[#FF0000] [&_svg]:!text-[#FF0000]"
                                      : ""
                                  }
                                >
                                  {React.isValidElement(child.icon)
                                    ? React.cloneElement(
                                        child.icon as React.ReactElement<any>,
                                        {
                                          style: {
                                            ...((
                                              child.icon as React.ReactElement<any>
                                            ).props?.style || {}),
                                            color:
                                              childActive || isChildHovered
                                                ? menuActiveTextColor
                                                : undefined,
                                            stroke:
                                              childActive || isChildHovered
                                                ? menuActiveTextColor
                                                : undefined,
                                          },
                                        },
                                      )
                                    : child.icon}
                                </span>
                                <span className="ml-3 text-sm">
                                  {child.label}
                                </span>
                                {(childActive || isChildHovered) && (
                                  <div
                                    className="absolute top-0 bottom-0 left-0 w-1 rounded-r"
                                    style={{ backgroundColor: "#FF6F70" }}
                                  />
                                )}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* SUBMENU SIDEBAR - Right panel */}
      {!isMobile && s2Open && (
        <aside
          className="group &::-webkit-scrollbar-thumb]:bg-gray-600 &::-webkit-scrollbar-thumb]:hover:bg-gray-500 absolute mt-2 overflow-y-auto border-r transition-all duration-300 [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent"
          style={{
            width: SIDEBAR_WIDTH,
            left: currentSidebarWidth,
            top: SHOW_SIDEBAR_HEADER ? SIDEBAR_HEADER_HEIGHT_PX : 0,
            bottom: 0,
            backgroundColor: submenuBgColor,
            color: submenuTextColor,
            borderColor: menuBorderColor,
            scrollbarWidth: "thin",
          }}
        >
          {activeMenu && (
            <div className="flex items-center px-3 py-3">
              <div className="flex items-center text-sm font-semibold">
                {activeMenu.icon}
                <span className="ml-3">{activeMenu.label}</span>
              </div>
            </div>
          )}

          {activeMenu?.children?.length ? (
            <ul className="space-y-1 py-2 pr-3 pl-1 font-medium">
              {activeMenu.children.map((child: any) => {
                const childActive = isLinkActive(child.link);
                const isChildHovered = hoveredChild === child.name;
                return (
                  <li key={child.name}>
                    <Link
                      to={child.link}
                      onClick={() => setActiveChild(child.name)}
                      onMouseEnter={() => setHoveredChild(child.name)}
                      onMouseLeave={() => setHoveredChild(null)}
                      className="relative flex w-full cursor-pointer items-center rounded-lg p-3.5 text-sm transition-all"
                      style={
                        childActive || isChildHovered
                          ? {
                              backgroundColor: menuActiveBgColor,
                              color: menuActiveTextColor,
                            }
                          : {}
                      }
                    >
                      <span
                        style={{
                          display: "inline-flex",
                        }}
                        className={
                          childActive || isChildHovered
                            ? "[&_svg]:!stroke-[#FF0000] [&_svg]:!text-[#FF0000]"
                            : ""
                        }
                      >
                        {React.isValidElement(child.icon)
                          ? React.cloneElement(
                              child.icon as React.ReactElement<any>,
                              {
                                style: {
                                  ...((child.icon as React.ReactElement<any>)
                                    .props?.style || {}),
                                  color:
                                    childActive || isChildHovered
                                      ? menuActiveTextColor
                                      : undefined,
                                  stroke:
                                    childActive || isChildHovered
                                      ? menuActiveTextColor
                                      : undefined,
                                },
                              },
                            )
                          : child.icon}
                      </span>
                      <span className="ml-3 text-sm">{child.label}</span>
                      {(childActive || isChildHovered) && (
                        <div
                          className="absolute top-0 bottom-0 left-0 w-1 rounded-r"
                          style={{ backgroundColor: "#FF6F70" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-sm text-gray-400">No submenu</div>
          )}
        </aside>
      )}
    </>
  );
};

export default DynamicSidebar;
