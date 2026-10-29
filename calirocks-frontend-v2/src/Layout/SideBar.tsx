import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "./menus/types";

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
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  s1OpenDesktop,
  s1OpenMobile,
  s2Open,
  activeParent,
  S1_W,
  S2_W,
  SHOW_SIDEBAR_HEADER,
  SIDEBAR_HEADER_HEIGHT_PX,
  handleParentClick,
  setActiveChild,
  setS1OpenDesktop,
  setS1OpenMobile,
  setS2Open,
  menuItems, // Use the passed menuItems instead of importing
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  const s1Ref = React.useRef<HTMLElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  const [suppressParentHighlight, setSuppressParentHighlight] =
    React.useState(false);

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

  return (
    <>
      {SHOW_SIDEBAR_HEADER && (
        <div
          className="flex h-12 items-center justify-between border-r border-b border-gray-200 bg-gray-100 px-2"
          style={{ width: S1_W + S2_W }}
        >
          <div className="ms-1 flex items-center">
            <button
              onClick={() => {
                setS2Open(false);
                isMobile
                  ? setS1OpenMobile(!s1OpenMobile)
                  : setS1OpenDesktop(!s1OpenDesktop);
              }}
              aria-label="Toggle Sidebar 1"
              className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-md mr-2 font-semibold text-gray-700">
              {s1OpenDesktop ? "Menu" : ""}
              {s2Open ? "Menu" : ""}
            </h2>
          </div>

          {s2Open && (
            <button
              onClick={() => setS2Open(false)}
              aria-label="Close Sidebar 2"
              className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M5 12l4-4m-4 4 4 4"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      <aside
        ref={s1Ref}
        className="absolute left-0 overflow-y-auto border-r border-gray-200 bg-white transition-all duration-300"
        style={{
          width: S1_W,
          top: SHOW_SIDEBAR_HEADER ? SIDEBAR_HEADER_HEIGHT_PX : 0,
          bottom: 0,
        }}
      >
        {(!isMobile || s1OpenMobile) && (
          <ul className="space-y-1 p-2 font-medium">
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

              const baseClasses = `group flex items-center rounded-lg p-2 w-full text-left cursor-pointer transition-all ${
                isActive ? "text-red-700 font-semibold" : "text-gray-700"
              } ${isMobile ? "justify-start" : s1OpenDesktop ? "justify-start" : "justify-center"} hover:ms-2`;

              return (
                <li
                  key={item.name}
                  ref={(el) => {
                    if (hasChildren) itemRefs.current[item.name] = el;
                  }}
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
                      aria-expanded={isMobile ? isOpen : undefined}
                      aria-controls={
                        isMobile ? `submenu-${item.name}` : undefined
                      }
                    >
                      {item.icon}
                      {(s1OpenDesktop || isMobile) && (
                        <span className="ml-3">{item.label}</span>
                      )}

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
                      role="menuitem"
                    >
                      {item.icon}
                      {(s1OpenDesktop || isMobile) && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </Link>
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
                                className={`flex cursor-pointer items-center rounded-lg p-2 transition-all ${
                                  childActive
                                    ? "font-semibold text-red-700"
                                    : "text-gray-700"
                                } hover:ms-2`}
                                role="menuitem"
                              >
                                {child.icon}
                                <span className="ml-3">{child.label}</span>
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

      {!isMobile && (
        <aside
          className="absolute overflow-y-auto border-r border-gray-200 bg-gray-50 transition-all duration-300"
          style={{
            width: S2_W,
            left: S1_W,
            top: SHOW_SIDEBAR_HEADER ? SIDEBAR_HEADER_HEIGHT_PX : 0,
            bottom: 0,
          }}
        >
          {activeMenu && (
            <div className="flex items-center bg-gray-50 px-3 py-3">
              <div className="flex items-center font-semibold text-gray-800">
                {activeMenu.icon}
                <span className="ml-3">{activeMenu.label}</span>
              </div>
            </div>
          )}

          {activeMenu?.children?.length ? (
            <ul className="space-y-1 pt-2 pr-2 pl-8 font-medium">
              {activeMenu.children.map((child: any) => {
                const childActive = isLinkActive(child.link);
                return (
                  <li key={child.name}>
                    <Link
                      to={child.link}
                      onClick={() => setActiveChild(child.name)}
                      className={`flex cursor-pointer items-center rounded-lg p-2 transition-all ${
                        childActive
                          ? "font-semibold text-red-700"
                          : "text-gray-700"
                      } hover:ms-2`}
                    >
                      {child.icon}
                      <span className="ml-3">{child.label}</span>
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

export default Sidebar;
