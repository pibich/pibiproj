import { Footer } from "@/components/layout/Footer";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { getUser } from "@/lib/dal";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <div className={user ? "hidden md:block" : ""}>
        <NavbarWrapper user={user} />
      </div>
      {user && <MobileHeader userId={user.id} />}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      {user && <MobileNav userId={user.id} username={user.username} />}
    </div>
  );
}
