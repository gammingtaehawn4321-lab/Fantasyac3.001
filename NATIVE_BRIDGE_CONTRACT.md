# Fantasyac Native Bridge Contract

Web code accesses `window.fantasyacNative`, Android `window.AndroidFantasyac`, or iOS `webkit.messageHandlers.fantasyac` through `src/platform/nativeBridge.ts`.

Supported in Stage 3:
- getLocalAIStatus
- generateLocalNarration
- cancelLocalNarration
- saveUpdateBackup
- openExternalUrl
- getAppDataPath

Stage 4 addition:
- generateInterpreterAction (Gemini Interpreter direct native transport)
- secure Gemini API key read/write
- model download / verification / selection
