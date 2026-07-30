/**
 * NFT trace markers for Vercel serverless bundling.
 *
 * Handlers under lib/ are loaded via dynamic import() (see api-dispatch.mjs),
 * so NFT cannot follow them from api/index.js. Side-effect imports here ensure
 * runtime packages required by those handlers are present in /var/task.
 *
 * Keep this list to packages that are actually imported at runtime — do not
 * add app source modules (that would defeat lazy handler loading).
 */
import "@supabase/supabase-js";
import "@upstash/redis";
import "@upstash/ratelimit";
import "@anthropic-ai/sdk";
import "pg";
