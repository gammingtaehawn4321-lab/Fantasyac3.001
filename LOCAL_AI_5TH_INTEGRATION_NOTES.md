# Local AI 5차 통합

- Android/iPad 최초 실행용 Local Narrator 모델 관리 UI 추가.
- Qwen3 1.7B Q4_K_M 모바일 기본 모델 다운로드 지원.
- Qwen3 4B Q4_K_M 고품질 선택 모델 지원.
- Android `files/models`, iOS Application Support `Fantasyac/Models` 영구 저장.
- GGUF 시스템 파일 선택기 가져오기 지원.
- 설치 모델 목록/활성화/삭제/성능 프리셋 적용 지원.
- 절전/균형/고품질 프리셋이 실제 context/maxTokens/threads 설정에 연결됨.
- 최초 설정 완료 조건: Gemini API 키 + 활성 로컬 모델.
- 네이티브 업데이트 확인이 Express `/api/update/status`에 의존하던 오류 수정. 네이티브는 원격 manifest를 직접 조회.
- 버전 alpha.5 / Android versionCode 3305.
- Android/iOS 배포 빌드 스크립트 및 업데이트 보존 규칙 문서 추가.
