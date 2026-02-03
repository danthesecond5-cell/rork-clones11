# Expo Go Quick Start Guide 🚀

## TL;DR

The app now works in **Expo Go** with full support for most protocols!

## Quick Start

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start development server
npm start

# 3. Open in Expo Go
# Scan the QR code with Expo Go app
# OR press 'i' for iOS simulator
# OR press 'a' for Android emulator
```

## What Works in Expo Go ✅

### Fully Functional Protocols

| Protocol | Status | Description |
|----------|--------|-------------|
| Protocol 1 | ✅ | Standard Injection - WebView-based |
| Protocol 2 | ✅ | Advanced Relay - Full features (minus native WebRTC) |
| Protocol 3 | ✅ | Protected Preview - Body detection & safety |
| Protocol 4 | ✅ | Local Test Harness - Development testing |
| Protocol 5 | ✅ | Holographic Stream - Advanced synthesis |
| Protocol 6 | ✅ | WebSocket Bridge - Frame streaming |

### Limited Functionality

| Feature | Status | Workaround |
|---------|--------|------------|
| WebRTC Loopback | ⚠️ | Use Protocols 1-6 or create dev build |
| VirtualCamera | ⚠️ | Use standard video injection |
| Ring Buffer Export | ⚠️ | Available in dev builds only |
| Enterprise WebKit | ⚠️ | Available in dev builds only |

## Key Features

### ✅ What You Can Do

- 📹 **Inject videos** into websites via getUserMedia
- 🎥 **Select videos** from your library
- 🌐 **Browse websites** with custom camera
- 🔄 **Switch protocols** on the fly
- 📱 **Test on real devices** instantly
- 🐛 **Debug easily** with fast refresh

### ⚠️ What Requires Dev Build

- Native WebRTC loopback
- Custom native camera modules
- Ring buffer video recording
- iOS Enterprise WebKit features

## Environment Detection

The app automatically detects if it's running in Expo Go:

```typescript
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
// true in Expo Go, false in dev builds
```

Features that require native modules are:
- Disabled by default in Expo Go
- Show clear error messages if enabled
- Work normally in dev builds

## Recommended Workflow

### For Quick Testing (Expo Go)
```bash
npm start → Scan QR → Test immediately
```
**Use for:**
- UI/UX development
- WebView injection testing
- Protocol development (1-6)
- Cross-platform testing

### For Native Features (Dev Build)
```bash
eas build --profile development
```
**Use for:**
- WebRTC loopback testing
- Custom native module testing
- Production-like environment

## Troubleshooting

### "Protocol not available in Expo Go"

**Solution:** Use a different protocol (1-6) or create a dev build.

### App crashes on launch

**Unlikely!** But if it happens:
1. Check console for error messages
2. Verify npm packages are installed
3. Try `npm start --clear`

### Video injection not working

1. Check protocol is enabled
2. Verify video is selected
3. Check console logs for errors
4. Try a different protocol

## Protocol Recommendations

### Best for Expo Go

**Protocol 1 (Standard Injection)**
- Simple and reliable
- No configuration needed
- Works everywhere

**Protocol 2 (Advanced Relay)**
- Most features
- Best quality
- GPU acceleration

**Protocol 6 (WebSocket Bridge)**
- Lowest latency
- Frame-by-frame control
- Great for testing

### Use Dev Build For

**Protocol 6 (WebRTC Loopback)**
- Native iOS implementation
- Ring buffer recording
- Best performance

## Next Steps

1. **Start testing:** `npm start`
2. **Read full docs:** `/docs/EXPO_GO_COMPATIBILITY.md`
3. **Check migration guide:** `/docs/EXPO_GO_MIGRATION.md`
4. **Build if needed:** `eas build --profile development`

## Support

### Documentation

- 📖 **Full Guide:** `/docs/EXPO_GO_COMPATIBILITY.md`
- 🔄 **Migration:** `/docs/EXPO_GO_MIGRATION.md`
- 🔧 **Troubleshooting:** See full guide

### Getting Help

- Check console logs first
- Review error messages (they're helpful!)
- Check documentation
- Create GitHub issue if needed

## Tips

💡 **Use Expo Go for 90% of development** - It's fast and convenient!

💡 **Protocol 1-6 work great** - No need for native builds most of the time

💡 **Error messages guide you** - They tell you exactly what to do

💡 **Dev builds for the 10%** - When you really need native features

## Summary

| Aspect | Expo Go | Dev Build |
|--------|---------|-----------|
| **Setup Time** | Instant | ~10-15 min |
| **Protocols** | 6/7 work | All work |
| **Use Case** | Development | Production-like |
| **Recommended** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Bottom Line:** Start with Expo Go, upgrade to dev build only when needed!

---

**Ready?** Run `npm start` and scan the QR code! 📱✨
