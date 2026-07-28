type LicenseEmailDetails = {
  customerEmail: string;
  customerName: string;
  expiresAt: Date | string | null;
  licenseId: number;
  licenseKey: string;
  mt5AccountNumbers: string[];
  productName: string;
};

type SendLicenseEmailOptions = {
  idempotencyKey?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExpiry(value: Date | string | null) {
  if (!value) {
    return "Lifetime";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "long",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

export async function sendLicenseEmail(
  details: LicenseEmailDetails,
  options: SendLicenseEmailOptions = {},
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("License email not sent: RESEND_API_KEY is not configured.");
    return { error: "not_configured", ok: false } as const;
  }

  const customerName = escapeHtml(details.customerName);
  const licenseKey = escapeHtml(details.licenseKey);
  const productName = escapeHtml(details.productName);
  const expiry = formatExpiry(details.expiresAt);
  const accountItems = details.mt5AccountNumbers
    .map(
      (accountNumber) =>
        `<span style="display:inline-block;margin:0 6px 6px 0;padding:7px 10px;border:1px solid #b9eeea;border-radius:7px;background:#effcfb;color:#123b3a;font-family:monospace">${escapeHtml(accountNumber)}</span>`,
    )
    .join("");
  const textAccounts = details.mt5AccountNumbers.join(", ");
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "License Key Portal <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from,
        to: [details.customerEmail],
        subject: `${details.productName} license key`,
        text: [
          `Hello ${details.customerName},`,
          "",
          `Your ${details.productName} license is ready.`,
          `License key: ${details.licenseKey}`,
          `MT5 account numbers: ${textAccounts}`,
          `License duration: ${expiry}`,
          "",
          "Keep this license key private.",
        ].join("\n"),
        html: `
          <!doctype html>
          <html lang="en">
            <body style="margin:0;background:#061113;color:#effcfb;font-family:Arial,sans-serif">
              <div style="padding:36px 16px">
                <div style="max-width:580px;margin:0 auto;overflow:hidden;border:1px solid #1f5554;border-radius:18px;background:#0b1e21">
                  <div style="padding:28px 30px;border-bottom:1px solid #183d3d;background:#0c2023">
                    <div style="color:#63e6dc;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">License Key Portal</div>
                    <h1 style="margin:10px 0 0;color:#effcfb;font-size:26px">Your license is ready</h1>
                  </div>
                  <div style="padding:30px">
                    <p style="margin:0 0 20px;color:#c5dcda;line-height:1.6">Hello ${customerName}, your <strong style="color:#effcfb">${productName}</strong> license has been generated.</p>
                    <div style="margin-bottom:24px;padding:18px;border:1px solid #2f7773;border-radius:12px;background:#0e292b">
                      <div style="margin-bottom:8px;color:#89aaa8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">License key</div>
                      <div style="color:#63e6dc;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:1px">${licenseKey}</div>
                    </div>
                    <div style="margin-bottom:20px">
                      <div style="margin-bottom:10px;color:#89aaa8;font-size:12px;font-weight:700">MT5 account numbers</div>
                      <div>${accountItems}</div>
                    </div>
                    <div style="padding-top:18px;border-top:1px solid #183d3d;color:#c5dcda;font-size:14px">
                      <strong style="color:#effcfb">License duration:</strong> ${escapeHtml(expiry)}
                    </div>
                    <p style="margin:26px 0 0;color:#789b98;font-size:12px;line-height:1.6">Keep this license key private. Contact support if any account information is incorrect.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("License email failed:", response.status, errorBody);
      return { error: "send_failed", ok: false } as const;
    }

    return { ok: true } as const;
  } catch (error) {
    console.error("License email failed:", error);
    return { error: "send_failed", ok: false } as const;
  }
}
