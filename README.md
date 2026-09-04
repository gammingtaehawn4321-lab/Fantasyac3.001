# AI Studio 경량화본

이 버전은 Google AI Studio 임포트 시 파일 수 초과/잘림을 줄이기 위해 런타임에 불필요한 누적 문서, 검증 로그, CC0 원본 보존 파일을 제거한 버전입니다.
게임 실행 코드와 실제 사용 중인 장비 삽화는 유지됩니다.
사용자가 직접 수정할 위치는 `USER_EDIT_INDEX.md` 한 파일을 보세요.
종족별 상시 서사 연출의 단일 원본은 `src/data/raceNarrativeReferences.ts`입니다.

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

## Local AI Stage 4
Android/iPadOS 네이티브 앱은 외부 Fantasyac Express 서버 없이 직접 Gemini Interpreter + 앱 내부 Local Narrator로 실행할 수 있는 경로가 추가되었습니다. 자세한 내용은 `LOCAL_AI_4TH_INTEGRATION_NOTES.md`, `native/README_STAGE4_KO.md`, `STAGE4_VERIFICATION.md`를 참고하세요.

## Local AI 5차
네이티브 모바일에서는 제목 화면에서 Gemini API 키 설정 후 Local Narrator GGUF를 직접 다운로드하거나 파일로 가져올 수 있다. 모델/세이브/백업은 앱 업데이트 패키지와 분리된다. 자세한 빌드/업데이트 절차는 `native/BUILD_AND_UPDATE_KO.md`와 `LOCAL_AI_5TH_INTEGRATION_NOTES.md` 참고.

## Local AI 6차 — GitHub 배포 자동화
`.github/workflows/release.yml`이 태그 `vX.Y.Z` 또는 수동 실행으로 Windows/Android/iOS 배포 산출물을 만든다.
정식 Android 업데이트를 사용하려면 최초 배포부터 동일 keystore를 GitHub Secrets에 보존해야 한다.
iPadOS/iOS IPA 자동 생성은 Apple 인증서/프로비저닝 프로파일 Secrets가 있을 때 활성화된다.
자세한 값은 `.github/RELEASE_SECRETS_KO.md` 참고.

## Game Runtime Split (3.3.2+)

네이티브 런처와 웹 게임 본체가 분리되었습니다. 일반 게임/밸런스/UI/AI 지시문 변경은 `Fantasyac-Game-vX.zip`으로 앱 내부에서 적용할 수 있습니다. 자세한 구조와 Private GitHub 사용법은 `GAME_PATCH_ARCHITECTURE_KO.md`를 참고하세요.


## Game Runtime 7.1 전수검토
부분 ZIP 소스 패치는 안전한 overlay 방식으로 변경되었고, Android/iPadOS/iOS 게임 런타임 교체의 백업·health-check·자동 복구를 강화했다. **구 7.0 workflow/patch ZIP 대신 7.1 수정본을 사용한다.** 자세한 내용은 `PATCH_7_1_RUNTIME_AUDIT_NOTES.md` 참고.
