import { useSupabaseAdmin } from "./supabaseAdmin.js";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map();

export function getCacheKey(mode, query) {
  if (mode === "imprint") return `imprint:${normalizeImprintForCache(query)}`;
  if (mode === "describe")
    return `describe:${String(query || "")
      .trim()
      .toLowerCase()}`;
  return null;
}

function normalizeImprintForCache(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getMemoryCached(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setMemoryCached(key, value) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function getCachedIdentifyResult(key) {
  if (!key) return null;

  const memory = getMemoryCached(key);
  if (memory) return memory;

  const supabase = useSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("identify_cache")
    .select("result, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase.from("identify_cache").delete().eq("cache_key", key);
    return null;
  }

  setMemoryCached(key, data.result);
  return data.result;
}

export async function setCachedIdentifyResult(key, mode, value) {
  if (!key || !value) return;

  setMemoryCached(key, value);

  const supabase = useSupabaseAdmin();
  if (!supabase) return;

  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();

  const { error } = await supabase.from("identify_cache").upsert({
    cache_key: key,
    mode,
    result: value,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Failed to cache identify result:", error.message);
  }
}
