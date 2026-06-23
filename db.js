// Shared data layer for the Creations gallery + admin panel.
// Buildless: the Supabase client is pulled straight from a CDN as an ES module.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE, CLOUDINARY, isConfigured } from "./config.js";

export { isConfigured };

// Anonymous, per-browser identity used to enforce "one like per person".
// True per-human uniqueness needs login; this is the standard lightweight stand-in.
export function voterId() {
  let id = localStorage.getItem("rag_voter_id");
  if (!id) {
    id = (crypto.randomUUID?.() ||
      String(Date.now()) + Math.random().toString(16).slice(2));
    localStorage.setItem("rag_voter_id", id);
  }
  return id;
}

// null until config.js is filled in — callers should check isConfigured() first.
export const supabase = isConfigured()
  ? createClient(SUPABASE.url, SUPABASE.anonKey)
  : null;

// Direct browser → Cloudinary upload using an UNSIGNED preset (no secret needed).
// Returns the hosted secure_url (lives on Cloudinary's CDN, not on your site).
export async function uploadToCloudinary(file, { onProgress } = {}) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY.uploadPreset);

  // XHR (not fetch) so we can report upload progress to the form.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data.secure_url);
        else reject(new Error(data?.error?.message || "Cloudinary upload failed"));
      } catch { reject(new Error("Cloudinary returned an unexpected response")); }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}
