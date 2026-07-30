/**
 * NFT trace markers for Vercel — keep this file LIGHT.
 * Heavy SDKs (Anthropic, pg) must be imported only from the handlers that need them
 * so healthz/readyz/search cold starts do not pay AI/DB driver weight.
 */
import "@supabase/supabase-js";
import "@upstash/redis";
import "@upstash/ratelimit";
