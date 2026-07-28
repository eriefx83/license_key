"use client";

import { useState } from "react";
import Link from "next/link";
import { updateUser } from "@/app/admin/users/actions";

type EditUserFormProps = {
  user: {
    agent_limit: number;
    agent_type: string;
    email: string;
    id: number;
    name: string;
    role: string;
    status: string;
  };
};

export function EditUserForm({ user }: EditUserFormProps) {
  const [role, setRole] = useState(user.role);
  const [agentType, setAgentType] = useState(user.agent_type);
  const [agentLimit, setAgentLimit] = useState(String(user.agent_limit || 5));
  const isAgent = role === "agent";
  const isLimitedAgent = isAgent && agentType === "limited";

  return (
    <form className="edit-user-form" action={updateUser}>
      <input name="id" type="hidden" value={user.id} />

      <div className="form-grid">
        <label className="form-field">
          <span>Name</span>
          <input
            defaultValue={user.name}
            minLength={2}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="form-field">
          <span>Email address</span>
          <input
            autoComplete="email"
            defaultValue={user.email}
            name="email"
            required
            type="email"
          />
        </label>

        <label className="form-field">
          <span>Role</span>
          <select
            name="role"
            onChange={(event) => setRole(event.target.value)}
            required
            value={role}
          >
            <option value="admin">Admin</option>
            <option value="partner">Partner</option>
            <option value="agent">Agent</option>
            <option value="customer">Customer</option>
            <option value="support">Support</option>
          </select>
        </label>

        <label className="form-field">
          <span>Status</span>
          <select defaultValue={user.status} name="status" required>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        {isAgent && (
          <div className="agent-settings form-field-full">
            <div className="agent-settings-heading">
              <div>
                <strong>Agent access</strong>
                <span>Choose whether this agent has a usage limit.</span>
              </div>
            </div>

            <div className="agent-settings-grid">
              <label className="form-field">
                <span>Agent type</span>
                <select
                  name="agent_type"
                  onChange={(event) => setAgentType(event.target.value)}
                  value={agentType}
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="limited">Limited</option>
                </select>
              </label>

              {isLimitedAgent && (
                <label className="form-field">
                  <span>Agent limit</span>
                  <input
                    inputMode="numeric"
                    min={1}
                    name="agent_limit"
                    onChange={(event) => setAgentLimit(event.target.value)}
                    required
                    type="number"
                    value={agentLimit}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <label className="form-field form-field-full">
          <span>New password</span>
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            placeholder="Leave blank to keep the current password"
            type="password"
          />
          <small>Only enter a value when you want to reset the password.</small>
        </label>
      </div>

      <div className="form-actions">
        <Link className="secondary-link" href="/admin/users">
          Cancel
        </Link>
        <button className="save-button" type="submit">
          Save changes
        </button>
      </div>
    </form>
  );
}
