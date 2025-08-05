# Firebase Configuration

## Authorized Domains for OAuth

The following domains are authorized for Firebase Authentication OAuth operations:

### Production Domains
- `moai-wheat.vercel.app` - Primary Vercel deployment domain

### Development Domains
- `localhost` - Local development (default)

## Configuration Steps

1. **Firebase Console Setup:**
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add production domains as they are deployed
   - Ensure localhost is present for development

2. **Vercel Domain Authorization:**
   - Added `moai-wheat.vercel.app` to authorized domains
   - This enables Google sign-in/sign-up functionality on production

## Notes

- Changes to authorized domains take effect immediately
- No redeploy required after adding domains
- Both production and preview URLs should be authorized for full Vercel integration

## Project Information

- Firebase Project ID: `hometaste-tlpog`
- Primary deployment: Vercel
- Authentication providers: Google OAuth