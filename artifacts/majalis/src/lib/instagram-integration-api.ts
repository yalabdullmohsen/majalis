import { adminFetch } from "@/lib/admin-api";

export type InstagramIntegrationStatus = {
  ok?: boolean;
  configured: boolean;
  status: string;
  message: string;
  manualAssistMode: boolean;
  appId?: string | null;
  businessAccountId?: string | null;
  accessTokenSet: boolean;
  accessTokenPreview?: string | null;
  linkedSources?: Array<{
    id: string;
    name: string;
    url: string;
    handle?: string;
    instagram_business_account_id?: string | null;
  }>;
};

async function postInstagram(body: Record<string, unknown>) {
  const res = await adminFetch("/api/admin/instagram-integration", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getInstagramIntegrationStatus(): Promise<InstagramIntegrationStatus> {
  return postInstagram({ action: "status" });
}

export async function testInstagramIntegration() {
  return postInstagram({ action: "test-connection" });
}

export async function refreshInstagramTokenInfo() {
  return postInstagram({ action: "refresh-token" });
}

export async function linkInstagramSource(sourceId: string, instagramBusinessAccountId?: string, handle?: string) {
  return postInstagram({ action: "link-source", sourceId, instagramBusinessAccountId, handle });
}

export async function runInstagramManualAssist(body: {
  sourceId: string;
  mode: "upload" | "url" | "caption";
  imageBase64?: string;
  mimeType?: string;
  postUrl?: string;
  imageUrl?: string;
  caption?: string;
}) {
  return postInstagram({ action: "manual-assist", ...body });
}
