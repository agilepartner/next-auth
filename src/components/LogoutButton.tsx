"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = () => {
    signOut({
      callbackUrl: "/", // Redirect to this URL after logging out (e.g., home page)
    });
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}