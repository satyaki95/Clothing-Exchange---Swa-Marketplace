import { NavLink } from "react-router-dom";

const icons = {
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-5 5" />
    </>
  ),
  members: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  clothing: (
    <>
      <path d="m16 4 4 2 2 5-4 2-2-3v10H8V10l-2 3-4-2 2-5 4-2a4 4 0 0 0 8 0Z" />
    </>
  ),
  swaps: (
    <>
      <path d="m17 1 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 23-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
};

const SidebarIcon = ({ name }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0"
  >
    {icons[name]}
  </svg>
);

const Sidebar = () => {
  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/dashboard"
        >
          <SidebarIcon name="analytics" />
          <p className="hidden md:block">Analytics</p>
        </NavLink>
        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/users"
        >
          <SidebarIcon name="members" />
          <p className="hidden md:block">Members</p>
        </NavLink>
        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/listings"
        >
          <SidebarIcon name="clothing" />
          <p className="hidden md:block">Clothing</p>
        </NavLink>
        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/swaps"
        >
          <SidebarIcon name="swaps" />
          <p className="hidden md:block">Swaps & disputes</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
