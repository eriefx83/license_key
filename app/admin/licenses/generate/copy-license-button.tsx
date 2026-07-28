"use client";

import { useState } from "react";

export function CopyLicenseButton({
  compact = false,
  value,
}: {
  compact?: boolean;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLicense() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      aria-label={`Copy license key ${value}`}
      className={`copy-license-button${compact ? " copy-license-button-compact" : ""}`}
      onClick={copyLicense}
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
