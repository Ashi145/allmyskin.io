/**
 * Newsletter signup is deliberately sent to a server-side endpoint.  Do not
 * put an email-provider API key in this Vite app: anything prefixed VITE_ is
 * visible to every site visitor.
 *
 * Set VITE_NEWSLETTER_ENDPOINT to a small serverless endpoint (or your email
 * platform's public subscription form endpoint). That endpoint should add the
 * contact with marketing consent and trigger the welcome/newsletter sequence.
 */
const NEWSLETTER_ENDPOINT = import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined;

export async function subscribeToNewsletter(email: string): Promise<void> {
  if (!NEWSLETTER_ENDPOINT) {
    throw new Error("Newsletter service has not been configured yet.");
  }

  const response = await fetch(NEWSLETTER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "allmyskin.io", marketingConsent: true }),
  });

  if (!response.ok) {
    throw new Error("We couldn't add that email right now. Please try again.");
  }
}
