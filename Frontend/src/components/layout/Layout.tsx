import { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import ChatWidget from "@/components/social/ChatWidget";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-16">{children}</main>
      <ChatWidget />
    </div>
  );
};

export default Layout;
