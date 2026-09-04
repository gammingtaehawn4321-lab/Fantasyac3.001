# Local AI 6차 — 배포 자동화

- GitHub Actions validate/release workflow 추가
- 태그 `vX.Y.Z` 또는 workflow_dispatch로 Windows/Android/iOS 빌드
- 릴리스 버전 단일 동기화 스크립트 추가
- Windows 배포 ZIP 자동 생성
- Android arm64 Release APK 자동 생성
- iOS/iPadOS unsigned device build 검증 + signing secrets 존재 시 IPA archive/export
- 릴리스 asset SHA-256 및 `update-manifest.json` 자동 생성
- GitHub Release에 산출물/manifest/checksum 자동 업로드
- Android llama.cpp CMake 경로 오류 수정 (`native/third_party/llama.cpp`)
- 사용자 콘텐츠/세이브/모델은 업데이트 패키지 교체 대상과 분리 유지
