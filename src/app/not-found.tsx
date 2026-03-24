import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <p className="text-6xl font-bold text-[#3772FF] mb-4">404</p>
        <h2 className="text-xl font-bold text-[#080708] mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-[#080708]/60 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/dashboard"
          className="bg-[#3772FF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#3772FF]/90 transition inline-block"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
