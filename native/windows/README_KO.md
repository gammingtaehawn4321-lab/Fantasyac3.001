# Windows 실행/업데이트 (3차)

- `FantasyacLauncher.ps1`: 같은 `http://127.0.0.1:3000` 원점으로 실행한다. 브라우저 IndexedDB 세이브가 버전 교체 후에도 유지된다.
- `ApplyUpdate.ps1 -PackageZip <새 ZIP>`: 프로그램 파일만 교체한다.
- `.env`와 `src/user_content/petReferences.ts`는 업데이트에서 보존한다.
- 게임 UI의 업데이트 버튼은 먼저 전체 세이브 JSON을 자동 다운로드한 뒤 패키지를 연다.

주의: 브라우저 사이트 데이터 자체를 사용자가 삭제하면 IndexedDB도 삭제될 수 있으므로 자동/수동 JSON 백업 기능을 함께 사용한다.
