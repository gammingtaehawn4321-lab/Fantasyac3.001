# Fantasyac iPadOS / iOS Native Shell — 3차

아이패드는 정식 지원 대상이다.

## 현재 구현
- XcodeGen `project.yml`
- Bundle ID `com.fantasyac.game`
- iOS/iPadOS 16+
- WKWebView persistent data store
- Swift ↔ JavaScript bridge
- 업데이트 전 세이브를 Application Support/Fantasyac/Backups에 저장
- 모델 위치: Application Support/Fantasyac/Models
- llama.cpp XCFramework + Metal을 붙일 수 있도록 AI 계층 분리

## 빌드
1. macOS에 Xcode/XcodeGen 설치
2. 루트에서 `npm install && npm run build`
3. `native/ios/sync_web_assets.sh`
4. `cd native/ios && xcodegen generate`
5. 생성된 Xcode 프로젝트에 고정 revision의 `llama.xcframework`를 연결
6. 동일 Bundle ID/Signing Team으로 빌드/업데이트

## 현재 제한
이 Linux 작업 환경에서는 Xcode/서명 빌드가 불가능하므로 IPA는 포함하지 않는다.
3차는 앱 프로젝트, 세이브 보존, bridge까지 실제 구현된 단계다. llama.cpp sampling과 native Gemini Interpreter는 4차에서 pin/연결한다.
