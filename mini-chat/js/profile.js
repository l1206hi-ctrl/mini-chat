// profile.js

const USER_PROFILE_KEY = "mini-chat-user-profile";

export const defaultProfile = {
  name: "",
  ageRange: "",
  tonePref: "",
  interests: "",
};

export function loadUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to load profile:", e);
    return { ...defaultProfile };
  }
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
}

export function buildUserProfilePrompt(profile) {
  const p = profile || defaultProfile;

  return `
[User Profile]
- Name/nickname: ${p.name || "Not provided"}
- Age range: ${p.ageRange || "Not provided"}
- Tone preference: ${p.tonePref || "Not provided"}
- Interests: ${p.interests || "Not provided"}

Adapt responses to this profile.
`.trim();
}
