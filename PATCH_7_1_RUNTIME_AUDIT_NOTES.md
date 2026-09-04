# 7.1 게임 런타임 전수검토 핫픽스

기준: 7.0 고정 런처 + 게임 패치 구조를 실제 사용 전에 다시 전수검토한 수정본.

## 중요 수정

1. **소스 패치 ZIP 안전 적용**
   - 기존 7.0 `unpack.yml`의 `rsync --delete-delay` 제거.
   - 부분 패치 ZIP은 이제 오버레이만 하며 ZIP에 없다는 이유로 기존 저장소 파일을 삭제하지 않는다.
   - 파일 삭제가 필요한 경우에만 `.fantasyac-delete.txt`에 명시한다.
   - 업로드 ZIP을 파일 mtime으로 고르지 않고, 실제 트리거 커밋에서 추가/수정된 루트 ZIP을 정확히 선택한다.
   - ZIP path traversal, symlink, 중복 경로, 과도한 엔트리/압축해제 크기 검사를 추가했다.

2. **Private GitHub 기본 동작 수정**
   - `FANTASYAC_UPDATE_REPO`가 비어 있으면 게임 자동 업데이트 채널을 조용히 비활성화한다.
   - `FANTASYAC_LAUNCHER_UPDATE_MANIFEST_URL`이 비어 있으면 런처 자동 업데이트 채널도 비활성화한다.
   - Private 소스 저장소를 앱이 로그인 없이 읽으려다 오류를 띄우는 동작을 방지한다.
   - 수동 `Fantasyac-Game-vX.zip` 가져오기는 항상 사용할 수 있다.

3. **세이브 백업 강화**
   - 수동 게임 패치 ZIP 가져오기와 수동 롤백에도 먼저 세이브 백업을 수행한다.
   - 업데이트 전 백업에서는 IndexedDB 읽기 오류를 빈 백업으로 숨기지 않는다.
   - 직전 저장 작업 자체가 실패했다면 이전 DB 스냅샷으로 업데이트를 강행하지 않고 백업/패치를 중단한다.

4. **게임 런타임 교체/롤백 안정성**
   - Android 상태 파일을 임시 파일 + atomic move 방식으로 기록한다.
   - 다운로드 패치는 `current -> previous` 이후, `staging -> current` 전에 health-check pending 상태를 기록한다.
   - 프로세스가 교체 도중 종료되어도 다음 실행에서 이전 런타임을 복구할 수 있게 했다.
   - 자동 health-check 실패 복구는 실패한 새 패치를 폐기하고 정상 previous만 current로 복원한다.
   - 수동 롤백은 기존처럼 current/previous를 교환해 사용자가 의도적으로 한 단계 전환할 수 있다.

5. **네이티브 런처 업데이트와 번들 게임 동기화**
   - 새 APK/IPA에 포함된 bundled 게임이 persistent `current`보다 새 버전이면 bundled 게임을 자동 승격한다.
   - 앱 내부 게임 패치가 bundled 게임보다 새 버전이면 그대로 유지한다.

6. **게임 패치 ZIP 검증 강화**
   - Android/iOS 양쪽에 archive 크기, 압축해제 크기, 엔트리 수, 중복 경로, path traversal 검사를 추가/강화했다.
   - iOS 저장형 ZIP 추출기는 CRC32까지 검증한다.
   - 원격 패치는 manifest size + 실제 크기 + SHA-256을 모두 확인한다.
   - 실제 `Build Fantasyac Game Patch` workflow도 업로드 전에 생성 ZIP을 audit한다.
   - 패키징 스크립트가 `dist/game-runtime.json` 버전과 요청 버전이 다르면 즉시 실패한다.
   - 절대 경로 output 디렉터리도 정상 지원한다.

7. **Android 네트워크 기본값**
   - `usesCleartextTraffic=false`로 고정한다.

## 지원 범위

현재 앱 내부 `GameRuntime/current` 패치 엔진은 **Android + iPadOS/iOS 네이티브 앱**에 구현되어 있다.
Windows는 기존 고정 `127.0.0.1:3000` 런처/Release 업데이트 방식을 유지한다. Windows용 동일한 in-app game-runtime updater는 별도 단계다.

## 적용 주의

**구 7.0 runtime patch/workflow ZIP은 사용하지 않는다.**
특히 구 `unpack.yml`은 부분 ZIP 적용 시 저장소 파일을 대량 삭제할 수 있으므로, 7.1의 안전한 workflow를 먼저 수동 교체한 뒤 7.1 runtime patch ZIP을 올린다.
