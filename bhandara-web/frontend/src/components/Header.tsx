interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = "Bhandara", subtitle }: HeaderProps) {
  return (
    <header className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white px-5 pt-12 pb-7 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-700/20 rounded-full" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-700/15 rounded-full" />

      <div className="relative flex items-center gap-3">
        {/* App icon */}
        <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-emerald-300/80 text-sm">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
