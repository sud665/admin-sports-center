import Link from "next/link";
import { CenterOnLogo } from "./centeron-logo";

export function LandingFooter() {
  return (
    <footer className="bg-[#080708] pt-12 pb-8 border-t border-[#FDCA40]/30">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1: Brand */}
          <div>
            <CenterOnLogo size="sm" />
            <p className="text-[#E6E8E6]/40 text-sm mt-2">센터 운영을 켜다</p>
          </div>

          {/* Column 2: Links */}
          <div>
            <h4 className="text-[#E6E8E6]/60 text-xs uppercase tracking-wider mb-4">
              바로가기
            </h4>
            <a
              href="#features"
              className="text-[#E6E8E6]/80 text-sm hover:text-[#FDCA40] transition block mb-2"
            >
              기능
            </a>
            <a
              href="#reviews"
              className="text-[#E6E8E6]/80 text-sm hover:text-[#FDCA40] transition block mb-2"
            >
              리뷰
            </a>
            <Link
              href="/login"
              className="text-[#E6E8E6]/80 text-sm hover:text-[#FDCA40] transition block mb-2"
            >
              로그인
            </Link>
            <a
              href="#"
              className="text-[#E6E8E6]/80 text-sm hover:text-[#FDCA40] transition block mb-2"
            >
              이용약관
            </a>
            <a
              href="#"
              className="text-[#E6E8E6]/80 text-sm hover:text-[#FDCA40] transition block mb-2"
            >
              개인정보처리방침
            </a>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-[#E6E8E6]/60 text-xs uppercase tracking-wider mb-4">
              연락처
            </h4>
            <p className="text-[#E6E8E6]/80 text-sm">hello@centeron.app</p>
            <p className="text-[#E6E8E6]/80 text-sm mt-1">02-1234-5678</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E6E8E6]/10 mt-8 pt-6">
          <p className="text-[#E6E8E6]/30 text-xs text-center">
            &copy; 2025 CenterOn. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
