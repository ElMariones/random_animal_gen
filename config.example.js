// Copy this file to `config.js` and fill in your own values.
// `config.js` is git-ignored so your keys stay out of the repo.
//
//   • Cloudinary cloud name + UNSIGNED upload preset are public by design.
//   • Supabase URL + ANON key are public by design — your data is protected by
//     Row-Level Security policies (see SETUP.md), not by hiding this key.
//
// Until config.js exists with real values, the gallery shows a friendly
// "not configured yet" notice instead of erroring.

export const CLOUDINARY = {
  cloudName:    "YOUR_CLOUD_NAME",       // Cloudinary dashboard → "Cloud name"
  uploadPreset: "YOUR_UPLOAD_PRESET",    // Settings → Upload → unsigned preset
};

export const SUPABASE = {
  url:     "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_KEY",
};

// Helper: true once you've replaced the placeholders above.
export const isConfigured = () =>
  !CLOUDINARY.cloudName.startsWith("YOUR_") &&
  !CLOUDINARY.uploadPreset.startsWith("YOUR_") &&
  !SUPABASE.url.includes("YOUR_PROJECT") &&
  !SUPABASE.anonKey.startsWith("YOUR_");
