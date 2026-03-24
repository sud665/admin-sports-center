import { MemberNav } from "@/components/member/member-nav";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <main className="pb-20 max-w-lg mx-auto">{children}</main>
      <MemberNav />
    </div>
  );
}
