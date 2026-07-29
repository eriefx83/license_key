"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { deleteUser } from "@/app/admin/users/actions";

type UserActionButtonsProps = {
  isCurrentUser: boolean;
  userEmail: string;
  userId: number;
  userName: string;
};

export function UserActionButtons({
  isCurrentUser,
  userEmail,
  userId,
  userName,
}: UserActionButtonsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const headingId = useId();

  useEffect(() => {
    if (!isDeleteOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDeleteOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDeleteOpen]);

  return (
    <div className="user-row-actions">
      <Link
        className="product-edit-button"
        href={`/admin/users/${userId}/edit`}
      >
        Edit
      </Link>
      <button
        className="product-delete-button"
        disabled={isCurrentUser}
        onClick={() => setIsDeleteOpen(true)}
        title={
          isCurrentUser
            ? "You cannot delete the account you are currently using."
            : undefined
        }
        type="button"
      >
        Delete
      </button>

      {isDeleteOpen && (
        <div
          className="license-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDeleteOpen(false);
            }
          }}
        >
          <section
            aria-labelledby={headingId}
            aria-modal="true"
            className="license-modal license-confirm-modal license-confirm-modal-delete"
            role="dialog"
          >
            <div className="license-modal-heading">
              <div>
                <p className="eyebrow">Confirm deletion</p>
                <h3 id={headingId}>{userName}</h3>
              </div>
              <button
                aria-label="Close"
                className="license-modal-close"
                onClick={() => setIsDeleteOpen(false)}
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
                <h4>Delete this user permanently?</h4>
                <p>
                  {userEmail} will lose access to the portal immediately. This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <form action={deleteUser} className="license-confirm-form">
              <input name="id" type="hidden" value={userId} />
              <div className="license-modal-actions">
                <button
                  className="secondary-link"
                  onClick={() => setIsDeleteOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="license-confirm-submit license-confirm-delete-submit"
                  type="submit"
                >
                  Yes, delete user
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
