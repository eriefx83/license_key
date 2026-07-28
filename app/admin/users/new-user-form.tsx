"use client";

import { useState } from "react";
import { createUser } from "@/app/admin/users/actions";

export function NewUserForm() {
  const [role, setRole] = useState("customer");
  const [agentType, setAgentType] = useState("limited");
  const [agentLimit, setAgentLimit] = useState("5");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isAgent = role === "agent";
  const isLimitedAgent = isAgent && agentType === "limited";

  function generatePassword() {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*";
    const allCharacters = uppercase + lowercase + numbers + symbols;
    const randomIndex = (length: number) => {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] % length;
    };
    const generated = [
      uppercase[randomIndex(uppercase.length)],
      lowercase[randomIndex(lowercase.length)],
      numbers[randomIndex(numbers.length)],
      symbols[randomIndex(symbols.length)],
      ...Array.from(
        { length: 12 },
        () => allCharacters[randomIndex(allCharacters.length)],
      ),
    ];

    for (let index = generated.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [generated[index], generated[swapIndex]] = [
        generated[swapIndex],
        generated[index],
      ];
    }

    const nextPassword = generated.join("");
    setPassword(nextPassword);
    setConfirmPassword(nextPassword);
    setShowPassword(true);
  }

  return (
    <form action={createUser} className="edit-user-form new-user-form">
      <div className="new-user-heading">
        <h2>Add new user</h2>
        <p>Create a login account and assign its access level.</p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Name</span>
          <input
            autoComplete="name"
            minLength={2}
            name="name"
            placeholder="Enter user name"
            required
            type="text"
          />
        </label>

        <label className="form-field">
          <span>Email address</span>
          <input
            autoComplete="email"
            name="email"
            placeholder="user@example.com"
            required
            type="email"
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <div className="password-generator-field">
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              className="random-password-button"
              onClick={generatePassword}
              type="button"
            >
              Generate
            </button>
          </div>
        </label>

        <label className="form-field">
          <span>Confirm password</span>
          <input
            autoComplete="new-password"
            minLength={8}
            name="confirm_password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter password again"
            required
            type="password"
            value={confirmPassword}
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
          <select defaultValue="active" name="status" required>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        {isAgent && (
          <div className="agent-settings form-field-full">
            <div className="agent-settings-heading">
              <div>
                <strong>Agent access</strong>
                <span>Choose whether this agent has an account limit.</span>
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
                  <span>Account limit</span>
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
      </div>

      <div className="form-actions">
        <button className="save-button" type="submit">
          Add user
        </button>
      </div>
    </form>
  );
}
