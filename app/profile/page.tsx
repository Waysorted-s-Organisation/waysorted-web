import TopBanner from "@/app/profile/components/TopBanner";
import Sidebar from "@/app/profile/components/Sidebar";
import ProfileCard from "@/app/profile/components/ProfileCard";
import { getCurrentUser } from "@/app/profile/lib/user";



export default async function Page() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen w-full">
      {/* Dynamic header depending on user early access */}
      <TopBanner earlyAccess={user.earlyAccess} />

      <div className="mx-auto flex max-w-full gap-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content - full width area */}
        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6">
          <div className="mx-auto max-w-screen-2xl py-10 pl-18">
            <ProfileCard
              initials={user.initials}
              earlyAccess={user.earlyAccess}
              name={user.name}
              email={user.email}
            />
          </div>
        </main>
      </div>
    </div>
  );
}