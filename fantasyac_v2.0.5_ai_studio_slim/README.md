# AI Studio 경량화본

이 버전은 Google AI Studio 임포트 시 파일 수 초과/잘림을 줄이기 위해 런타임에 불필요한 누적 문서, 검증 로그, CC0 원본 보존 파일을 제거한 버전입니다.
게임 실행 코드와 실제 사용 중인 장비 삽화는 유지됩니다.
사용자가 직접 수정할 위치는 `USER_EDIT_INDEX.md` 한 파일을 보세요.

---

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a39b8841-d6e0-4410-9e99-b2f661009870

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
