# Stage 6.3 첫 실빌드 통합 핫픽스

## 포함 수정

### iPad / iOS (6.2 수정 포함)
- `LocalAIEngine.swift`: Objective-C `NSError **`가 Swift에서 `throws`로 import되는 시그니처에 맞춰 불필요한 `error: &error` 인자 제거.
- `ModelManager.swift`: `modelId` 파라미터와 함수 이름 충돌 제거.

### Android (6.3)
- `MainActivity.kt`: `BuildConfig.DEBUG` 직접 참조 제거.
- WebView 디버그 활성화 여부를 `ApplicationInfo.FLAG_DEBUGGABLE`로 판정하도록 변경.
- CI/AGP 설정에서 BuildConfig 생성 여부와 무관하게 Kotlin 컴파일 가능하도록 함.

## 영향 없음
- Windows 코드 변경 없음.
- 게임 본체/세이브/펫 사용자 참조 파일 변경 없음.
- Android 서명 Secrets 변경 필요 없음.
