/**
 * Dedicated Vercel Function for /api/readyz.
 * NFT: pg must be resolvable for the readiness DB probe.
 */
import "pg";
export { default } from "../lib/api-handlers/readyz.js";
