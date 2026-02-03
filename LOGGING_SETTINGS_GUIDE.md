# Console Logging Settings Guide

## Overview

This feature allows you to control which types of console messages are displayed during app development and testing. Console warnings from protocol diagnostics and error handling can now be hidden via user-configurable settings.

## What Was Changed

### New Features

1. **Logging Settings Context** (`contexts/LoggingSettingsContext.tsx`)
   - Manages console logging preferences
   - Persists settings across app restarts using AsyncStorage
   - Provides easy-to-use hooks for accessing and updating settings

2. **Configurable Logger** (`utils/configurableLogger.ts`)
   - Wraps native console methods
   - Respects user settings before logging
   - Provides scoped loggers for different modules

3. **Settings Screen** (`app/settings.tsx`)
   - User-friendly interface to toggle logging options
   - Four independent toggles:
     - Console Warnings
     - Console Errors
     - Console Logs
     - Protocol Debug Logs
   - Reset to defaults button

4. **Updated Error Handling** (`utils/errorHandling.ts`)
   - All console calls now use the configurable logger
   - Console warnings from error handling respect settings
   - Protocol error logging is configurable

5. **Updated Protocol Utilities**
   - `utils/protocolValidation.ts` - Uses configurable logger
   - `utils/protocolVersioning.ts` - Uses configurable logger

## How to Use

### Accessing Settings

1. Open the app
2. Navigate to the Device Check screen (settings icon in header)
3. Tap the green settings icon (⚙️) in the top-right corner
4. You'll see the Logging Settings screen

### Available Settings

- **Console Warnings**: Show/hide `console.warn()` messages from protocol diagnostics and error handling
- **Console Errors**: Show/hide `console.error()` messages from error handling and validation
- **Console Logs**: Show/hide `console.log()` messages from general application flow
- **Protocol Debug Logs**: Show/hide detailed protocol operation and state transition logs

### Default Behavior

All logging options are **enabled by default** to maintain backward compatibility and aid in debugging during development.

### Resetting Settings

Use the "Reset to Defaults" button to restore all logging settings to their default values (all enabled).

## Technical Details

### Configurable Logger API

```typescript
import { clog, cwarn, cerror, plog, createScopedLogger } from '@/utils/configurableLogger';

// Basic usage
clog('This respects console logs setting');
cwarn('This respects console warnings setting');
cerror('This respects console errors setting');
plog('This respects protocol logs setting');

// Scoped logger
const logger = createScopedLogger('MyModule');
logger.log('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.protocol('Protocol debug message');
logger.always('Always logs, bypasses settings');
```

### Settings Storage

Settings are stored in AsyncStorage under the key `@logging_settings`:

```json
{
  "consoleWarningsEnabled": true,
  "consoleErrorsEnabled": true,
  "consoleLogsEnabled": true,
  "protocolLogsEnabled": true
}
```

### Architecture

1. **Context Layer**: `LoggingSettingsContext` manages settings state and persistence
2. **Utility Layer**: `configurableLogger` provides the actual logging functions
3. **UI Layer**: Settings screen allows users to modify preferences
4. **Sync Mechanism**: Context updates are automatically synced to the logger utility

## Benefits

1. **Cleaner Console Output**: Hide expected warnings during testing
2. **Better Debugging**: Keep important errors visible while hiding noise
3. **User Control**: Each developer can configure their preferred logging level
4. **Performance**: Reduced console output can improve performance during intensive operations
5. **Production Ready**: Easily disable verbose logging for production builds

## Migration Notes

### For Developers

Replace direct console calls with configurable logger calls:

```typescript
// Before
console.log('[MyModule] Info message');
console.warn('[MyModule] Warning message');
console.error('[MyModule] Error message');

// After
import { clog, cwarn, cerror } from '@/utils/configurableLogger';

clog('[MyModule] Info message');
cwarn('[MyModule] Warning message');
cerror('[MyModule] Error message');
```

### For Protocol-Specific Logging

Use `plog()` for protocol-related debug messages:

```typescript
import { plog } from '@/utils/configurableLogger';

plog(`[Protocol] State transition: ${from} -> ${to}`);
```

## Testing

The changes have been tested to ensure:
- Settings persist across app restarts
- Console messages respect the configured settings
- The UI updates correctly when settings change
- No linter errors or type issues
- Backward compatibility is maintained

## Future Enhancements

Potential improvements for future versions:
- Per-module logging configuration
- Log level filtering (debug, info, warn, error)
- Export logs functionality
- Log history viewer
- Remote logging configuration

## Notes

⚠️ **Important**: Disabling console warnings can help reduce noise during testing, but some warnings may indicate important issues that need attention. Use this feature judiciously.

💡 **Tip**: Changes take effect immediately. Reload the app if you need to see previously suppressed messages.

## Related Files

- `/contexts/LoggingSettingsContext.tsx` - Settings management
- `/utils/configurableLogger.ts` - Logger utility
- `/app/settings.tsx` - Settings UI
- `/utils/errorHandling.ts` - Updated error handling
- `/utils/protocolValidation.ts` - Updated protocol validation
- `/utils/protocolVersioning.ts` - Updated protocol versioning
- `/app/_layout.tsx` - Provider integration
- `/app/device-check.tsx` - Settings navigation
