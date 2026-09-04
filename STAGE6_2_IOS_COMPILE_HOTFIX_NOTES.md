# Stage 6.2 — iOS/iPad compile hotfix

첫 GitHub Actions Xcode 실빌드에서 확인된 Swift/Objective-C importer 오류 3건을 수정합니다.

- `NSError **`가 Swift에서 `throws`로 import되는 규칙에 맞춰 `FantasyacLlamaBridge` 호출부를 `try` 방식으로 변경.
- `generateRequestJSON(..., error:)`의 명시적 `error:` 인자를 제거.
- `FantasyacLlamaBridge(..., error:)` 초기화의 명시적 `error:` 인자를 제거.
- `ModelManager.findFile(modelId:)`에서 파라미터 `modelId`가 메서드 `modelId(for:)`를 가리던 shadowing 문제를 `self.modelId(for:)`로 수정.

Android/Windows/게임 본체/사용자 펫 참조 파일은 변경하지 않습니다.
