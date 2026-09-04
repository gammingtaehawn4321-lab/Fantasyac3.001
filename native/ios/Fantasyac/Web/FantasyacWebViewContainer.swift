import SwiftUI
import WebKit
import UIKit

struct FantasyacWebViewContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // Persistent IndexedDB across normal app updates.
        config.userContentController.add(context.coordinator.bridge, name: "fantasyac")
        let webView = WKWebView(frame: .zero, configuration: config)
        context.coordinator.bridge.webView = webView
        webView.navigationDelegate = context.coordinator

        do {
            let url = try GameContentManager.shared.currentIndexURL()
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } catch {
            webView.loadHTMLString("<h2>Fantasyac game runtime unavailable.</h2><pre>\(error.localizedDescription)</pre>", baseURL: nil)
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        let bridge = FantasyacNativeBridge()

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            if GameContentManager.shared.isAllowedFileURL(url) { decisionHandler(.allow); return }
            decisionHandler(.cancel)
            Task { @MainActor in
                UIApplication.shared.open(url)
            }
        }
    }
}
