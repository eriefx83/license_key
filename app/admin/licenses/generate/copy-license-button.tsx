"use client";

import { useState } from "react";

export function CopyLicenseButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLicense() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="copy-license-button" onClick={copyLicense} type="button">
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
