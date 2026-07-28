"use client";

import { useState } from "react";
import type { NewUserCredentials } from "@/lib/new-user-credentials";

type CreatedUserDetailsProps = {
  credentials: NewUserCredentials;
};

export function CreatedUserDetails({
  credentials,
}: CreatedUserDetailsProps) {
  const [copied, setCopied] = useState(false);
  const agentDetails =
    credentials.role === "agent"
      ? credentials.agentType === "limited"
        ? `Limited (${credentials.accountLimit} accounts)`
        : "Unlimited"
      : null;
  const copyText = [
    `Name: ${credentials.name}`,
    `Email: ${credentials.email}`,
    `Password: ${credentials.password}`,
    `Role: ${credentials.role}`,
    `Status: ${credentials.status}`,
    ...(agentDetails ? [`Agent access: ${agentDetails}`] : []),
  ].join("\n");

  async function copyDetails() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="created-user-card" aria-label="New user login details">
      <div className="created-user-card-heading">
        <div>
          <span>New user created</span>
          <h2>Login details</h2>
          <p>Copy these details now and send them to the client.</p>
        </div>
        <button
          className="copy-user-details-button"
          onClick={copyDetails}
          type="button"
        >
          {copied ? "Copied" : "Copy details"}
        </button>
      </div>

      <div className="created-user-details-grid">
        <div>
          <span>Name</span>
          <strong>{credentials.name}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{credentials.email}</strong>
        </div>
        <div>
          <span>Password</span>
          <code>{credentials.password}</code>
        </div>
        <div>
          <span>Role</span>
          <strong>{credentials.role}</strong>
        </div>
        {agentDetails && (
          <div>
            <span>Agent access</span>
            <strong>{agentDetails}</strong>
          </div>
        )}
      </div>

      <p className="created-user-security-note">
        This password is shown temporarily and is not stored as plain text.
      </p>
    </section>
  );
}
