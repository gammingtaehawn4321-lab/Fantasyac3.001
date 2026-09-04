# Fantasyac Local AI 6차 검증

## 이번 단계
- GitHub Actions 검증 워크플로 추가
- Git 태그/수동 실행 기반 멀티플랫폼 Release 워크플로 추가
- Windows self-contained 배포 ZIP 생성기 추가
  - CI의 Node.exe 포함
  - production `node_modules` 포함
- Android arm64 APK 자동 빌드/서명 경로 추가
- iPadOS/iOS unsigned compile 검증 + 선택적 서명 IPA export 추가
- 버전/빌드번호 동기화 스크립트 추가
- SHA-256/update-manifest 자동 생성 추가
- GitHub `releases/latest/download/update-manifest.json` 릴리스 빌드 자동 내장
- Android llama.cpp CMake 경로 오류 수정

## 발견 및 수정한 실제 빌드 오류
Stage 5의 Android 준비 스크립트는 llama.cpp를:
`native/third_party/llama.cpp`
에 설치하지만, CMake는 프로젝트 루트의 `third_party/llama.cpp`를 찾고 있었다.
6차에서 CMake 경로를 `native/third_party/llama.cpp`와 일치시켰다.

## 정적/스크립트 검증
- 전체 TS/TSX parser: 오류 0
- GitHub Actions YAML 2개: 파싱 성공
- iOS Swift 소스: `swiftc -parse` 통과
- Bash release/native script: `bash -n` 통과
- release tree 검사: 통과
- update-manifest 생성 테스트: 통과
- 버전 동기화 테스트: 통과
- Android CMake llama.cpp 경로: 실제 `native/third_party/llama.cpp`로 해석됨

## 보존성
- Stage 5 대비 삭제 파일: 0
- `src/user_content/petReferences.ts` SHA-256 동일
  `18981e6b6f290ec94d6279b8aea24fc44cef1a4fa8dfb9f9e1c21f40d150ac8e`

## 이 환경에서 실행하지 못한 항목
- 실제 GitHub Actions runner 실행
- Android SDK/NDK를 통한 APK 링크 빌드
- Android 실제 keystore 서명/업데이트 설치
- Xcode를 통한 signed IPA Archive/Export
- 실기기 Galaxy A17/iPad 설치 및 Local AI 속도/메모리 측정

위 항목들은 실제 GitHub 리포지터리와 플랫폼 서명 비밀값이 필요하다.
