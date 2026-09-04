# 판타지악 로컬 실행 / 세이브 / 업데이트 전환 계획

## 현재 1차에서 완료

- Gemini = 자유 입력 해석/구조화 판정
- Fantasyac 엔진 = 실제 상태/수치 계산
- Local Narrator = 최종 본문 로그
- Local Narrator 실패 시 AUTO 모드에서 Gemini Narrator fallback
- Narrator 성공 전에는 RPG 상태를 실제 React 상태에 커밋하지 않음
- 저장 슬롯 전체 JSON 백업/복원 기능 추가
- 앱 버전/업데이트 manifest 규격 추가

## 세이브 유지 원칙

로컬 설치본은 같은 앱/같은 origin/package ID를 계속 사용한다. 프로그램 파일을 업데이트해도 사용자 데이터 영역은 건드리지 않는다.

- PC 웹 런타임 1차: `http://127.0.0.1:3000`의 IndexedDB를 계속 유지
- 향후 PC 패키지: OS 사용자 데이터 폴더에 저장
- 향후 Android 패키지: 앱 전용 영구 데이터 영역에 저장
- 앱 업데이트 시 저장 데이터 삭제 금지
- 업데이트 직전 strict 세이브 자동 백업 적용

현재 저장창의 `전체 백업`으로 모든 슬롯을 JSON 하나로 내보내고 다른 기기에서 `백업 가져오기`로 복원할 수 있다.

## 자동 업데이트 2차

GitHub 저장소/Release 주소가 확정되면 `runtime/update_manifest.example.json` 규격을 실제 updater에 연결한다.

1. 새 버전 manifest 확인
2. 업데이트 전 세이브 백업
3. 새 프로그램 패키지 다운로드/검증
4. 프로그램만 교체
5. Save Migration 실행
6. 재시작

브라우저 자체는 자기 소스 파일을 안전하게 교체할 수 없으므로, 런처/네이티브 업데이트는 플랫폼 패키징 계층이 담당한다. Android/iPadOS/iOS의 일반 게임 콘텐츠는 7.1부터 앱 내부 GameRuntime 패치 엔진이 담당한다.

---

## 7.0 이후: 런처와 게임 콘텐츠 분리

일반 게임 패치는 APK/IPA 교체가 아니라 `Fantasyac-Game-vX.zip`을 `GameRuntime/current`에 적용한다.
세이브, Local AI 모델, Gemini API 키, 백업은 GameRuntime 밖에 있으므로 게임 패치에 의해 삭제되지 않는다.
새 게임 패치 적용 전 기존 IndexedDB 세이브의 JSON 백업을 생성한다.
새 게임이 health confirmation을 보내지 못하고 앱이 재기동되면 previous 게임 런타임으로 자동 복구한다.
네이티브 코드/권한/llama.cpp Bridge 변경 때만 새 APK/IPA가 필요하다.


### 7.1 Private 저장소 기본값

`FANTASYAC_UPDATE_REPO`와 `FANTASYAC_LAUNCHER_UPDATE_MANIFEST_URL`을 설정하지 않으면 앱의 원격 자동 확인은 비활성화된다. Private GitHub에서는 Actions artifact의 게임 ZIP을 직접 내려받아 `게임 패치 ZIP 가져오기`로 적용하는 방식을 기본으로 한다.
