"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 rounded-full bg-[#DF2935]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#DF2935]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#080708] mb-2">문제가 발생했습니다</h2>
        <p className="text-[#080708]/60 mb-6">
          페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[#3772FF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#3772FF]/90 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
