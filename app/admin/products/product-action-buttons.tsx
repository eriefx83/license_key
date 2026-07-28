"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { deleteProduct } from "./actions";

type ProductActionButtonsProps = {
  licenseCount: number;
  productId: number;
  productName: string;
};

export function ProductActionButtons({
  licenseCount,
  productId,
  productName,
}: ProductActionButtonsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const headingId = useId();
  const isInUse = licenseCount > 0;

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
    <div className="product-row-actions">
      <Link
        className="product-edit-button"
        href={`/admin/products/${productId}/edit`}
      >
        Edit
      </Link>
      <button
        className="product-delete-button"
        onClick={() => setIsDeleteOpen(true)}
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
                <h3 id={headingId}>{productName}</h3>
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
                <h4>
                  {isInUse
                    ? "This product cannot be deleted"
                    : "Delete this product permanently?"}
                </h4>
                <p>
                  {isInUse
                    ? `This product has ${licenseCount} generated license${
                        licenseCount === 1 ? "" : "s"
                      }. Revoke or remove those licenses before deleting the product.`
                    : "The product will be removed from the license generator. This action cannot be undone."}
                </p>
              </div>
            </div>

            <form action={deleteProduct} className="license-confirm-form">
              <input name="id" type="hidden" value={productId} />
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
                  disabled={isInUse}
                  type="submit"
                >
                  {isInUse ? "Product in use" : "Yes, delete product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
