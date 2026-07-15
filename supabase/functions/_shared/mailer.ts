// Resend's HTTP API — plain fetch, no SDK/import needed. Requires a verified
// sending domain (oneaicare.com) so mail can go to any subscriber, not just
// the Resend account owner.
type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "OneAICare <no-reply@oneaicare.com>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}
