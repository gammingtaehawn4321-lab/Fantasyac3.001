# Fantasyac Local AI 2차 통합

## 추가된 기반
- Windows / Android / iPadOS / iOS / macOS / Linux 플랫폼 판별
- 플랫폼별 업데이트 패키지 manifest 형식
- 앱 ID 고정 정책: `com.fantasyac.game`
- 업데이트 시 사용자 데이터 보존 정책
- iPadOS 로컬 Narrator 지원 계획 추가
- iPad 안전/고품질 모델 프로필 추가
- Android/iOS 네이티브 shell 브리지 명세 추가

## 세이브 유지 원칙
프로그램/웹 asset과 사용자 데이터를 분리한다. 같은 app/bundle id를 유지한 업데이트는 기존 세이브를 그대로 사용한다. 업데이트 전 JSON 전체 백업 기능은 계속 유지한다.

## 아직 실제 바이너리가 아닌 것
이 ZIP은 Windows EXE/APK/IPA 바이너리를 포함하지 않는다. Android NDK와 iOS Xcode 프로젝트의 실제 네이티브 빌드/서명은 다음 패키징 단계에서 수행한다.
