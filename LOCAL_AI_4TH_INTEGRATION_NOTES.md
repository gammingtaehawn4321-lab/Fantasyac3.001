# Local AI 4차 통합

## 완료
- Android/iPadOS가 외부 Fantasyac Express 서버 없이 Gemini API를 직접 호출하는 Native Interpreter 추가.
- Android API 키: Android Keystore AES-GCM 암호화 저장.
- iPad/iOS API 키: Keychain 저장 (`AfterFirstUnlockThisDeviceOnly`).
- React/localStorage에는 API 키를 저장하지 않음.
- 제목 화면에서 모바일 Gemini 키 저장/삭제/설정 상태 확인.
- Native Interpreter는 `gemini-3.6-flash` 고정.
- API 키는 URL query가 아닌 `x-goog-api-key` 헤더로 전송.
- Android llama.cpp 실제 tokenization/decode/sampling 구현.
- iOS Objective-C++ llama.cpp bridge + Swift LocalAIEngine 구현.
- llama.cpp source/runtime ref: `b10516`.
- 펫 상호작용 로그가 `/api/rpg/pet-interaction` 대신 공통 Narrator client를 직접 사용.
- 모바일에서 로컬 모델 실패 시 Native Gemini Narrator fallback 가능.
- Stage 3 nativeBridge의 잘못된 `input.requestId` 참조 수정.

## 의도된 데이터 경계
Gemini: 자유 입력 해석 / Local Narrator fallback
Game Engine: 실제 수치 및 상태 커밋
Local llama.cpp: 최종 장문 로그

## 아직 실제 기기에서 해야 하는 검증
이 실행 환경에는 Android SDK/NDK와 Xcode/iOS SDK가 없으므로 APK/IPA 링크 빌드와 실기기 추론 성능은 실제 개발 PC/Mac에서 확인해야 한다.
