// profile.js

const USER_PROFILE_KEY = "mini-chat-user-profile";

export const defaultProfile = {
  name: "",
  ageRange: "",
  tonePref: "",
  interests: ""
};

export function loadUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch (e) {
    console.error("프로필 로드 실패:", e);
    return { ...defaultProfile };
  }
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("프로필 저장 실패:", e);
  }
}

export function buildUserProfilePrompt(profile) {
  const p = profile || defaultProfile;

  return `
[사용자 정보]
- 이름/닉네임: ${p.name || "알 수 없음"}
- 나이대: ${p.ageRange || "알 수 없음"}
- 말투/호칭 선호: ${p.tonePref || "특별한 선호 없음"}
- 요즘 관심사/고민: ${p.interests || "정보 없음"}

이 정보를 참고해서, 사용자의 성향과 상황에 맞게 말투와 예시를 조정하라.
`.trim();
}
