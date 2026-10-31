import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLogout from "../hooks/Auth/useLogout";
import useAuth from "../hooks/Auth/useAuth";
import useTheme from "../hooks/useTheme";
import { useStaffs } from "../hooks/Staffs/useStaffs";

interface HeaderProps {
    isMobile: boolean;
    togglePrimaryFromHeader: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMobile, togglePrimaryFromHeader }) => {
    const navigate = useNavigate();
    const logout = useLogout();
    const { auth }: any = useAuth();
    const { staffs } = useStaffs();
    const currentStaff = staffs.find((s: any) => s.email === auth?.user?.username);
    const userProfilePic = currentStaff?.profilePicUrl;
    const { getColorByPath } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const headerBgColor = getColorByPath("header", "header", "background");
    const headerTextColor = getColorByPath("header", "header", "text");
    const headerBorderColor = getColorByPath("header", "header", "border");

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getUserInitials = () => {
        if (auth?.user?.fullName) {
            const names = auth.user.fullName.split(' ');
            if (names.length >= 2) {
                return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
            }
            return auth.user.fullName.charAt(0).toUpperCase();
        } else if (auth?.user?.username) {
            return auth.user.username.charAt(0).toUpperCase();
        }
        return "U";
    };

    const getFullName = () => {
        if (auth?.user?.fullName) {
            return auth.user.fullName;
        } else if (auth?.user?.username) {
            return auth.user.username;
        }
        return "User";
    };

    const getRoleName = () => {
        if (auth?.roles && auth.roles.length > 0) {
            const roleMap: { [key: number]: string } = {
            1: "Super Admin",
            2: "Admin",
            3: "Provider",
            4: "Staff",
            5: "Customer",
            6: "Technical Admin",
            };
            return roleMap[auth.roles[0]] || "User";
        }
        return "User";
        };

    return (
        <header 
            className="fixed top-0 left-0 right-0 z-50 h-14 border-b flex items-center justify-between px-4 transition-colors duration-300"
            style={{
                backgroundColor: headerBgColor,
                color: headerTextColor,
                borderColor: headerBorderColor,
            }}
            
        >
            <div className="flex items-center space-x-3">
                {isMobile && (
                    <button
                        onClick={togglePrimaryFromHeader}
                        aria-label="Toggle primary sidebar"
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-opacity-20 hover:bg-gray-400 transition-colors"
                        style={{ color: headerTextColor }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}

                <img src="/logo.png" alt="Logo" className="h-8" />
            </div>

            <div className="flex items-center relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="cursor-pointer relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full transition-colors hover:bg-opacity-80"
                    style={{
                        backgroundColor: userProfilePic ? 'transparent' : `${headerTextColor}20`,
                        color: headerTextColor,
                    }}
                >
                    {userProfilePic ? (
                        <img 
                            src={userProfilePic} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <span className="font-medium text-sm">{getUserInitials()}</span>
                    )}
                </button>

                {isDropdownOpen && (
                    <div 
                        className="absolute right-0 top-12 z-50 rounded-lg shadow-lg w-48 border divide-gray-200 divide-y transition-colors duration-300"
                        style={{
                            backgroundColor: headerBgColor,
                            borderColor: headerBorderColor,
                            color: headerTextColor,
                        }}
                    >
                        <div className="px-4 py-3 text-sm">
                            <div className="font-medium truncate">{getFullName()}</div>
                            <div className="truncate text-xs mt-0.5 opacity-75">{getRoleName()}</div>
                        </div>
                        <ul className="py-2 text-sm">
                            <li>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                    }}
                                    className="cursor-pointer w-full text-left px-4 py-2 flex items-center gap-2 transition-colors hover:bg-opacity-50 hover:bg-gray-200"
                                    style={{ color: headerTextColor }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Account
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                    }}
                                    className="cursor-pointer w-full text-left px-4 py-2 flex items-center gap-2 transition-colors hover:bg-opacity-50 hover:bg-gray-200"
                                    style={{ color: headerTextColor }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </button>
                            </li>
                        </ul>
                        <div className="py-2 ">
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer w-full text-left px-4 py-2 flex items-center gap-2 transition-colors hover:bg-opacity-50 hover:bg-red-200"
                                style={{ color: "#dc2626" }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;