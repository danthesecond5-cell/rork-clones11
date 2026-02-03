import 'react-native-webview';

declare module 'react-native-webview' {
  interface WebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
  interface IOSWebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
  interface AndroidWebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
  interface WindowsWebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
  interface MacOSWebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
}
