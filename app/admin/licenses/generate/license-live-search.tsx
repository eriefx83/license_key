"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type LicenseLiveSearchProps = {
  initialQuery: string;
};

export function LicenseLiveSearch({
  initialQuery,
}: LicenseLiveSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const query = value.trim();

    if (query === initialQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      startTransition(() => {
        router.replace(
          query
            ? `/admin/licenses/generate?q=${encodeURIComponent(query)}`
            : "/admin/licenses/generate",
          { scroll: false },
        );
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [initialQuery, router, value]);

  return (
    <div className="license-search-form" role="search">
      <label className="visually-hidden" htmlFor="license-search">
        Search licenses
      </label>
      <input
        autoComplete="off"
        id="license-search"
        name="q"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search license key, customer, product or MT5 account"
        type="search"
        value={value}
      />
      <span className="license-search-status" aria-live="polite">
        {isPending ? "Searching…" : "Live search"}
      </span>
      {value && (
        <button
          className="license-search-clear"
          onClick={() => setValue("")}
          type="button"
        >
          Clear
        </button>
      )}
    </div>
  );
}
