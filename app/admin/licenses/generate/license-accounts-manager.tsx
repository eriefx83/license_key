"use client";

import { useEffect, useId, useState } from "react";
import { addLicenseAccounts } from "./actions";

type LicenseAccountsManagerProps = {
  accountNumbers: string[];
  licenseId: number;
  licenseKey: string;
};

export function LicenseAccountsManager({
  accountNumbers,
  licenseId,
  licenseKey,
}: LicenseAccountsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = useId();
  const isAtLimit = accountNumbers.length >= 50;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <button
        className="manage-accounts-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Manage
      </button>

      {isOpen && (
        <div
          className="license-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            aria-labelledby={headingId}
            aria-modal="true"
            className="license-modal"
            role="dialog"
          >
            <div className="license-modal-heading">
              <div>
                <p className="eyebrow">Manage MT5 accounts</p>
                <h3 id={headingId}>{licenseKey}</h3>
              </div>
              <button
                aria-label="Close"
                className="license-modal-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="license-modal-current">
              <div>
                <strong>Current accounts</strong>
                <span>{accountNumbers.length} / 50</span>
              </div>
              {accountNumbers.length === 0 ? (
                <p>No MT5 accounts attached yet.</p>
              ) : (
                <div className="mt5-account-list">
                  {accountNumbers.map((accountNumber) => (
                    <code key={accountNumber}>{accountNumber}</code>
                  ))}
                </div>
              )}
            </div>

            <form action={addLicenseAccounts} className="license-modal-form">
              <input name="license_id" type="hidden" value={licenseId} />
              <label className="form-field">
                <span>Add MT5 account numbers</span>
                <textarea
                  autoFocus
                  disabled={isAtLimit}
                  inputMode="numeric"
                  name="new_mt5_account_numbers"
                  placeholder="12345678, 87654321"
                  required
                  rows={4}
                />
                <small>
                  Separate multiple account numbers with commas, spaces or new
                  lines.
                </small>
              </label>

              <div className="license-modal-actions">
                <button
                  className="secondary-link"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="save-button"
                  disabled={isAtLimit}
                  type="submit"
                >
                  Add accounts
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
