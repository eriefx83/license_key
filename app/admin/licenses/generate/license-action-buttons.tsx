"use client";

import { deleteLicense, revokeLicense } from "./actions";

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
  const revokeAction = revokeLicense.bind(null, licenseId);
  const deleteAction = deleteLicense.bind(null, licenseId);

  return (
    <div className="license-row-actions">
      <form
        action={revokeAction}
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
        <button
          className="license-action-button license-revoke-button"
          disabled={status === "revoked"}
          type="submit"
        >
          {status === "revoked" ? "Revoked" : "Revoke"}
        </button>
      </form>

      <form
        action={deleteAction}
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
