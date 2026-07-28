"use client";

import { useEffect, useId, useState } from "react";
import {
  deleteLicense,
  resendLicenseEmail,
  revokeLicense,
} from "./actions";

type LicenseActionButtonsProps = {
  licenseId: number;
  licenseKey: string;
  status: string;
};

type ConfirmAction = "delete" | "revoke" | null;

export function LicenseActionButtons({
  licenseId,
  licenseKey,
  status,
}: LicenseActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const headingId = useId();

  useEffect(() => {
    if (!confirmAction) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmAction(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmAction]);

  const isDelete = confirmAction === "delete";

  return (
    <div className="license-row-actions">
      <form action={resendLicenseEmail} className="license-email-form">
        <input name="license_id" type="hidden" value={licenseId} />
        <button
          className="license-action-button license-email-button"
          type="submit"
        >
          Send email
        </button>
      </form>

      <button
        className="license-action-button license-revoke-button"
        disabled={status === "revoked"}
        onClick={() => setConfirmAction("revoke")}
        type="button"
      >
        {status === "revoked" ? "Revoked" : "Revoke"}
      </button>

      <button
        className="license-action-button license-delete-button"
        onClick={() => setConfirmAction("delete")}
        type="button"
      >
        Delete
      </button>

      {confirmAction && (
        <div
          className="license-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmAction(null);
            }
          }}
        >
          <section
            aria-labelledby={headingId}
            aria-modal="true"
            className={`license-modal license-confirm-modal ${
              isDelete
                ? "license-confirm-modal-delete"
                : "license-confirm-modal-revoke"
            }`}
            role="dialog"
          >
            <div className="license-modal-heading">
              <div>
                <p className="eyebrow">
                  {isDelete ? "Confirm deletion" : "Confirm revoke"}
                </p>
                <h3 id={headingId}>{licenseKey}</h3>
              </div>
              <button
                aria-label="Close"
                className="license-modal-close"
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="license-confirm-body">
              <span className="license-confirm-icon" aria-hidden="true">
                !
              </span>
              <div>
                <h4>
                  {isDelete
                    ? "Delete this license permanently?"
                    : "Revoke this license now?"}
                </h4>
                <p>
                  {isDelete
                    ? "The license and its attached MT5 account numbers will be removed. This action cannot be undone."
                    : "The license will remain in your records, but it can no longer be used for activation."}
                </p>
              </div>
            </div>

            <form
              action={isDelete ? deleteLicense : revokeLicense}
              className="license-confirm-form"
            >
              <input name="license_id" type="hidden" value={licenseId} />
              <div className="license-modal-actions">
                <button
                  className="secondary-link"
                  onClick={() => setConfirmAction(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`license-confirm-submit ${
                    isDelete
                      ? "license-confirm-delete-submit"
                      : "license-confirm-revoke-submit"
                  }`}
                  type="submit"
                >
                  {isDelete ? "Yes, delete license" : "Yes, revoke license"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
