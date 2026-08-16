/* Global types for Google Identity Services (GIS) – loaded from accounts.google.com/gsi/client */
interface GsiCredentialPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

interface GsiId {
  initialize(config: { client_id: string; callback: (resp: { credential: string }) => void; auto_select?: boolean; ux_mode?: "popup" | "redirect" }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
  decodeCredential(credential: string): GsiCredentialPayload;
  cancel(): void;
  prompt(listener?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; getNotDisplayedReason: () => string }) => void): void;
}

interface Window {
  google?: {
    accounts?: {
      id: GsiId;
    };
  };
}
