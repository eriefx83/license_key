"use client";

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

export function LicenseActionButtons({
  licenseId,
  licenseKey,
  status,
}: LicenseActionButtonsProps) {
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

      <form
        action={revokeLicense}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Revoke ${licenseKey}? This license will no longer be usable.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="license_id" type="hidden" value={licenseId} />
        <button
          className="license-action-button license-revoke-button"
          disabled={status === "revoked"}
          type="submit"
        >
          {status === "revoked" ? "Revoked" : "Revoke"}
        </button>
      </form>

      <form
        action={deleteLicense}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Delete ${licenseKey}? This action cannot be undone.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="license_id" type="hidden" value={licenseId} />
        <button
          className="license-action-button license-delete-button"
          type="submit"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
