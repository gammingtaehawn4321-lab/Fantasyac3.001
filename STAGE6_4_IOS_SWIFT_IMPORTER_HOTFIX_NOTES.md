# Stage 6.4 iOS Swift Importer Hotfix

첫 iOS 실빌드에서 확인된 Swift/Objective-C NSError importer 동작을 반영한 핫픽스입니다.

수정:
- `FantasyacLlamaBridge.generateRequestJSON(...error:)`는 Swift에서 `throws -> String`으로 import되므로 `guard let` 제거.
- `FantasyacLlamaBridge.init(...error:)`는 Swift에서 throwing non-optional initializer로 import되므로 `guard let` 제거.
- 빈 문자열 반환 검사는 별도의 `guard !text.isEmpty`로 유지.

영향 범위:
- `native/ios/Fantasyac/AI/LocalAIEngine.swift`만 변경.
- Android / Windows / 게임 데이터 / `src/user_content/petReferences.ts` 미변경.
