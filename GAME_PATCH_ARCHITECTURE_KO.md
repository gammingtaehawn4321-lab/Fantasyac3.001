# 판타지악 고정 런처 + 게임 패치 구조

## 목표

판타지악을 두 층으로 분리한다.

1. **런처/네이티브 엔진** — Android APK / iPadOS·iOS 앱의 서명된 네이티브 계층. 자주 바꾸지 않는다.
2. **게임 콘텐츠** — React 게임 본체, 데이터, AI 지시문, 이미지 등을 `Fantasyac-Game-vX.zip`으로 갱신한다.

현재 앱 내부 게임 패치 엔진은 **Android + iPadOS/iOS**에 구현되어 있다. Windows는 기존 `127.0.0.1:3000` 런처/Release 업데이트 방식을 유지한다.

Android에서 외부 APK 설치가 다시 제한되더라도, 네이티브 코드를 바꾸지 않는 일반 패치는 앱 안에서 계속 적용할 수 있다.

## 앱 내부 저장 위치

Android:
- 활성 게임: `files/game_runtime/current/`
- 이전 게임: `files/game_runtime/previous/`
- 작업 공간: `files/game_runtime/staging/`
- 모델: 기존 `files/models/`
- 백업: 기존 `files/backups/`
- Gemini 키: Android Keystore

패드/iOS:
- 활성 게임: `Application Support/Fantasyac/GameRuntime/current/`
- 이전 게임: `Application Support/Fantasyac/GameRuntime/previous/`
- 모델/백업/Keychain은 별도 영역을 그대로 사용한다.

`current/index.html`의 경로를 고정해 WebView/WKWebView 저장 origin이 패치마다 달라지지 않게 한다.

## game-update.zip으로 바꿀 수 있는 것

기본 원칙: **웹 빌드(`dist/`)에 들어가는 것은 게임 패치 대상**이다.

- `src/App.tsx`, React UI
- `src/gameEngine.ts`
- 전투/퀘스트/장비/지역/몬스터/펫/밸런스 데이터
- `src/ai/*` 로컬 Narrator 프롬프트/검증기/요청 규칙
- `src/services/nativeInterpreterPrompt.ts` Gemini Interpreter 지시문
- 로그 생성 규칙, 컨텍스트 구성 규칙, 재시도/검증 로직
- 사용자 참조를 포함해 웹 번들에 컴파일되는 데이터
- 이미지/웹 에셋

즉 **AI 지시문 수정은 보통 APK 재설치가 필요 없다.**

## 새 APK/IPA가 필요한 것

- Android Kotlin 코드
- AndroidManifest / 새 권한
- Android Keystore 처리
- JNI / CMake / llama.cpp 네이티브 코드
- 네이티브 Bridge 메서드 추가/변경
- iOS Swift / Objective-C++ 코드
- iOS entitlements / Info.plist / Framework 변경
- 앱 자체 패키지 ID/서명 방식 변경

향후 새 기능을 설계할 때 가능한 로직은 `src/` 계층에 두어 게임 패치만으로 갱신할 수 있게 한다.

## 패치 적용 안전장치

원격 자동 패치:
1. manifest HTTPS 다운로드
2. manifest의 SHA-256 확인
3. ZIP 전체 다운로드
4. SHA-256 일치 확인
5. ZIP path traversal 차단
6. staging에만 압축 해제
7. `index.html`, `game-runtime.json`, `game-patch.json` 검증
8. 최소 런처 버전 검증
9. `current -> previous`, `staging -> current` 교체
10. 새 게임 UI가 정상 기동하면 health confirmation

새 패치가 정상 기동 신호를 보내지 못한 채 앱이 종료되면 다음 기동 때 `previous`로 자동 복구한다.

## Private GitHub에서 가장 간단한 사용법

자동 다운로드 서버를 공개할 필요가 없다.

1. GitHub Actions에서 **Build Fantasyac Game Patch** 실행
2. 만들어진 `Fantasyac-Game-vX.zip`을 로그인된 GitHub에서 다운로드
3. 판타지악 제목 화면 → **게임 패치 ZIP 가져오기**
4. 파일 선택
5. 검증/적용 후 자동 재시작

이 과정은 APK 설치가 아니라 앱 데이터 교체이므로 Android의 `알 수 없는 출처 앱 설치` 권한을 사용하지 않는다.

## 자동 업데이트 채널은 선택사항

`FANTASYAC_UPDATE_REPO`를 공개 release 전용 저장소 등으로 **명시적으로 설정했을 때만** `game-stable` Release의 manifest를 앱이 직접 확인한다.

현재 소스 저장소가 Private이라면 토큰 없는 앱은 해당 Release를 직접 받을 수 없으므로, **당장은 수동 ZIP 가져오기 방식이 가장 단순하고 비공개성도 유지된다.**


## 7.1 안전성 보강

부분 소스 패치 ZIP은 저장소에 오버레이만 하며, ZIP에 없는 파일을 자동 삭제하지 않는다. 삭제가 필요한 경우 `.fantasyac-delete.txt`를 통해 명시한다. 게임 패치 적용 전 세이브 백업 실패 시 업데이트를 중단하고, 교체 도중 프로세스가 종료되어도 pending health-check 상태를 이용해 이전 런타임으로 복구한다.
