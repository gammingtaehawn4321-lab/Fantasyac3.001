# Stage 4 Verification

검증일: 2026-08-31

## 정적 검증
- src 전체 TS/TSX parser: parse error 0
- 프로젝트 tsc 결과에서 외부 패키지 미설치 오류를 제외한 신규 내부 진단: 0
- iOS Swift source `swiftc -parse`: 통과
- Android Kotlin 소스 기본 괄호/구조 검사: 통과
- Stage 3 대비 삭제 파일: 0
- 웹 코드의 `/api/rpg/pet-interaction` 직접 호출: 제거됨
- Android native inference placeholder marker: 제거됨
- Native Gemini bridge method Android/iOS 양쪽 연결 확인
- Stage 3 `input.requestId` 오참조 수정 확인

## 외부 의존성 고정
- llama.cpp ref: b10516
- Gemini Interpreter model: gemini-3.6-flash

## 이 환경에서 불가능한 검증
- Android SDK/NDK가 없어 APK 링크 빌드 및 실기기 추론 미검증
- Xcode/iOS SDK가 없어 IPA/XCFramework 링크 빌드 및 Metal 실기기 추론 미검증

실제 첫 APK/IPA 빌드에서 네이티브 ABI/API 차이가 발견되면 해당 플랫폼 래퍼만 수정하며 React/GameEngine 인터페이스는 유지한다.
