"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isOnAddPage = pathname === "/add";

  function handlePostClick(e: React.MouseEvent) {
    if (isOnAddPage) {
      e.preventDefault();
      const form = document.getElementById("add-camp-form") as HTMLFormElement | null;
      if (form) form.requestSubmit();
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center px-4 py-2">
        {/* Find — large, takes most of the space */}
        <Link
          href="/"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-colors ${
            pathname === "/"
              ? "bg-emerald-700 text-white font-semibold"
              : "text-foreground hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Find Bhandara
        </Link>

        {/* Post — small button on the side; submits form when on /add */}
        <Link
          href="/add"
          onClick={handlePostClick}
          className={`ml-3 shrink-0 flex items-center gap-1.5 px-3 h-11 rounded-xl text-xs font-medium transition-colors ${
            isOnAddPage
              ? "bg-emerald-700 text-white"
              : "bg-gray-100 text-muted hover:bg-emerald-50 hover:text-emerald-700"
          }`}
          aria-label={isOnAddPage ? "Submit bhandara" : "Post free bhandara"}
          title={isOnAddPage ? "Submit bhandara" : "Post free bhandara"}
        >
          {isOnAddPage ? (
            <>
              Submit
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Post Bhandara
            </>
          )}
        </Link>
      </div>
    </nav>
  );
}
