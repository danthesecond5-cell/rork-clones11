import { WebViewProps } from 'react-native-webview';

declare module 'react-native-webview' {
  interface IOSWebViewProps {
    /**
     * Enable Enterprise WebKit features (iOS only).
     * When enabled, applies custom WebKit preferences for media capture capabilities.
     */
    enterpriseWebKitEnabled?: boolean;
  }

  interface WebViewProps {
    /**
     * Enable Enterprise WebKit features (iOS only).
     * When enabled, applies custom WebKit preferences for media capture capabilities.
     */
    enterpriseWebKitEnabled?: boolean;
  }
}
