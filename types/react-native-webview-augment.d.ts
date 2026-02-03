import 'react-native-webview';

declare module 'react-native-webview' {
  // Custom iOS WebKit flag injected by our Enterprise WebKit plugin.
  // This is not part of upstream react-native-webview types.
  interface WebViewSharedProps {
    enterpriseWebKitEnabled?: boolean;
  }

  // Some versions/types also expose `WebViewProps`; augment that too if present.
  interface WebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
}

declare module 'react-native-webview/lib/WebViewTypes' {
  interface WebViewSharedProps {
    enterpriseWebKitEnabled?: boolean;
  }

  interface WebViewProps {
    enterpriseWebKitEnabled?: boolean;
  }
}

