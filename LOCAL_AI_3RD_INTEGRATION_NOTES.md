# Fantasyac Local AI 3차 통합

## 이번 단계에서 실제로 추가된 것
- 공통 JS ↔ Native bridge (`src/platform/nativeBridge.ts`)
- 네이티브 Local Narrator 우선, 서버 Narrator fallback
- 업데이트 직전 IndexedDB 전체 세이브 자동 백업
- Windows 런처/업데이트 스크립트
- Android Studio 프로젝트
  - applicationId `com.fantasyac.game`
  - WebView 영구 데이터 저장소
  - JS bridge
  - 앱 내부 Backups/Models 경로
  - llama.cpp NDK/CMake 연결 경계
- iPadOS/iOS XcodeGen 프로젝트
  - Bundle ID `com.fantasyac.game`
  - WKWebView persistent data store
  - Swift JS bridge
  - Application Support/Backups/Models 경로
  - Metal/XCFramework 연결 준비
- 메인 Gemini Interpreter 호출을 `interpreterClient.ts` 뒤로 격리
- Vite 정적 asset 경로를 native shell 친화적인 상대 경로로 변경

## 세이브 유지
Windows는 항상 동일한 `http://127.0.0.1:3000` 원점으로 실행한다. 프로그램 파일을 교체해도 브라우저 IndexedDB는 유지된다.
Android/iPadOS는 동일 applicationId/Bundle ID로 정상 업데이트하면 WebView 앱 데이터가 유지된다.
업데이트 버튼을 누르면 먼저 전체 세이브 bundle을 JSON으로 백업한다.

## 아직 남은 핵심 (4차)
Android/iPadOS 완전 독립 실행을 위해 Gemini Interpreter를 네이티브 보안 저장소 + 직접 Gemini API transport로 이동해야 한다.
현재 메인 자유행동은 `interpreterClient -> /api/rpg/action` 경로를 사용한다.
또한 모바일 llama.cpp inference tokenization/sampling은 특정 llama.cpp revision을 pin한 뒤 완성한다.

즉 3차 모바일 앱은 '실제 프로젝트/브리지/데이터 보존 구조'까지이며, 완전 독립 APK/IPA의 최종 AI 실행 경로는 4차 작업이다.
