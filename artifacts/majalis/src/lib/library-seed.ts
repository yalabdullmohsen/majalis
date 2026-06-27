/**
 * مكتبة علمية — كتب ومراجع موثقة
 */
import { getLibrarySeedRows } from "./library/catalog";

export type LibrarySeedItem = {
  id: string;
  slug?: string;
  title: string;
  author?: string;
  type: string;
  category: string;
  description: string;
  external_url?: string;
  status?: "approved";
};

export const LIBRARY_SEED: LibrarySeedItem[] = getLibrarySeedRows();
