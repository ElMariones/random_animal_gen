// Public configuration for the "Creations" gallery, submission form and admin panel.
//
// Everything in here is SAFE to ship to the browser / commit to git:
//   • Cloudinary cloud name + UNSIGNED upload preset are meant to be public.
//   • Supabase URL + ANON key are public by design — your data is protected by
//     Row-Level Security policies (see SETUP.md), not by hiding this key.
//
// Fill these four values after creating your free Cloudinary + Supabase accounts.
// See SETUP.md for the exact step-by-step. Until they're filled, the gallery shows
// a friendly "not configured yet" notice instead of erroring.

export const CLOUDINARY = {
  cloudName:    "ddek5aaoa",          // Cloudinary dashboard → "Cloud name"
  uploadPreset: "animal_showcase",    // Settings → Upload → unsigned preset
};

export const SUPABASE = {
  url:     "https://jitwtdnywhlwwuxtzoyd.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdHd0ZG55d2hsd3d1eHR6b3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDcxNDMsImV4cCI6MjA5Nzc4MzE0M30.4bxVn83hfeauZDdx0BktqwUiM8u6h43tHlqCapeYC94",
};

// Helper: true once you've replaced the placeholders above.
export const isConfigured = () =>
  !CLOUDINARY.cloudName.startsWith("YOUR_") &&
  !CLOUDINARY.uploadPreset.startsWith("YOUR_") &&
  !SUPABASE.url.includes("YOUR_PROJECT") &&
  !SUPABASE.anonKey.startsWith("YOUR_");
