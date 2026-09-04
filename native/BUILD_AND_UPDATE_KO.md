# 판타지악 네이티브 빌드 / 업데이트

## Android
1. Node.js 22+, Android Studio (SDK 35), NDK, CMake 3.22+ 설치.
2. `bash native/android/scripts/build_release.sh` 또는 Android Studio에서 `native/android` 열기.
3. 실제 배포는 반드시 이전 버전과 **같은 signing key**를 사용한다.
4. `applicationId`는 `com.fantasyac.game`으로 고정한다.
5. 같은 ID/서명 APK를 업데이트 설치하면 WebView IndexedDB, `files/models`, `files/backups`, Keystore Gemini 키가 유지된다.

## iPad / iPhone
1. macOS + Xcode + XcodeGen 필요.
2. `bash native/ios/scripts/build_release.sh` 실행 후 Xcode에서 프로젝트를 연다.
3. `com.fantasyac.game` Bundle ID와 같은 signing identity/team으로 업데이트한다.
4. TestFlight/App Store 또는 개인 서명 배포를 사용한다. iOS 보안 정책상 앱이 임의 IPA를 스스로 무인 설치할 수는 없다.
5. 정상 업데이트에서는 WKWebView 저장소, Application Support의 Models/Backups, Keychain API 키가 유지된다.

## 업데이트 공통
- 앱이 원격 update manifest에서 새 버전을 확인한다.
- 사용자가 `백업 후 업데이트`를 누르면 IndexedDB 전체 백업을 먼저 만든다.
- Android/iPad는 플랫폼 설치 URL을 연다.
- 앱 삭제 후 재설치와 '업데이트 설치'는 다르다. 세이브 보존을 원하면 앱을 삭제하지 말고 업데이트 설치한다.

## 모델
- GGUF는 앱 패키지에 넣지 않는다.
- 최초 실행 화면에서 추천 모델 다운로드 또는 `내 GGUF 파일 가져오기`를 사용한다.
- 모델은 프로그램 업데이트와 별도 사용자 데이터에 저장된다.
