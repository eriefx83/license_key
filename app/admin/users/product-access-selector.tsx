"use client";

import { useState } from "react";

export type ProductAccessOption = {
  id: number;
  name: string;
  status: string;
};

type ProductAccessSelectorProps = {
  initialSelectedIds?: number[];
  products: ProductAccessOption[];
};

export function ProductAccessSelector({
  initialSelectedIds = [],
  products,
}: ProductAccessSelectorProps) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialSelectedIds),
  );
  const allSelected =
    products.length > 0 &&
    products.every((product) => selectedIds.has(product.id));

  function toggleAll() {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(products.map((product) => product.id)),
    );
  }

  function toggleProduct(productId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  return (
    <fieldset className="product-access-selector form-field-full">
      <legend className="visually-hidden">Product access</legend>
      <div className="product-access-heading">
        <div>
          <strong>Product access</strong>
          <p>Select the products this user is allowed to access.</p>
        </div>
        <label className="product-access-select-all">
          <input
            checked={allSelected}
            disabled={products.length === 0}
            onChange={toggleAll}
            type="checkbox"
          />
          <span>Select all</span>
        </label>
      </div>

      {products.length === 0 ? (
        <p className="product-access-empty">No products are available.</p>
      ) : (
        <div className="product-access-options">
          {products.map((product) => (
            <label className="product-access-option" key={product.id}>
              <input
                checked={selectedIds.has(product.id)}
                name="product_ids"
                onChange={() => toggleProduct(product.id)}
                type="checkbox"
                value={product.id}
              />
              <span>
                <strong>{product.name}</strong>
                <small>{product.status}</small>
              </span>
            </label>
          ))}
        </div>
      )}

      <small className="product-access-note">
        Admin accounts automatically have access to every active product.
      </small>
    </fieldset>
  );
}
