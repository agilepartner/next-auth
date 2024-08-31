import LogoutButton from "@/components/LogoutButton";
import UserProfile from "@/components/UserProfile";
import Wrapper from "@/components/Wrapper";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next App with Azure AD authentication",
  description: "This app uses next-auth to authenticate against Azure AD",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Wrapper>
          <header className="flex items-center justify-between p-4">
            <UserProfile />
            <LogoutButton />
          </header>
          <main>
            {children}
          </main>
        </Wrapper>
      </body>
    </html>
  );
}
