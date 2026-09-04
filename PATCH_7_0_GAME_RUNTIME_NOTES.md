# Game Runtime Split / 7.0 구조 개편

- 런처 버전 기준: 3.3.2
- 번들 게임 seed 버전: 3.3.2.0
- APK/IPA 네이티브 계층과 웹 게임 계층 분리
- Android/iOS `GameRuntime/current` 고정 실행 경로 추가
- bundled www를 최초 1회 current로 seed
- `previous` 1단계 롤백 추가
- 업데이트 health confirmation + 다음 기동 자동 복구 추가
- 원격 패치: HTTPS + SHA-256 + staging + 안전 ZIP 해제
- 수동 `Fantasyac-Game-vX.zip` 가져오기 추가
- game patch 자체에 `game-patch.json`과 `game-runtime.json` 포함
- `src/ai`, native Gemini interpreter prompt 등 웹 번들 AI 지시문을 game patch로 업데이트 가능
- 모델/세이브/Gemini 보안키/사용자 백업 영역은 game runtime swap에서 제외
- `.github/workflows/game-patch.yml` 추가
- `game-stable` 고정 채널 배포 구조 추가
- Private 저장소에서는 수동 ZIP 가져오기를 기본 권장
