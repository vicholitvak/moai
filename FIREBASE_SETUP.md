# Firebase Setup Guide

## 🚨 Fix Permission Denied Error

The "Missing or insufficient permissions" error occurs because Firestore security rules are not configured. Follow these steps to fix it:

### Step 1: Deploy Firestore Security Rules

1. **Open Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com)
2. **Select your project**: Click on your LicanÑam app project
3. **Navigate to Firestore**: Click "Firestore Database" in the left sidebar
4. **Go to Rules tab**: Click on the "Rules" tab
5. **Replace the rules**: Copy the content from `firestore.rules` file and paste it into the Firebase Console
6. **Publish**: Click "Publish" to deploy the new rules

### Step 2: Alternative - Quick Fix (Development Only)

For immediate testing, you can temporarily use these permissive rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Verify Rules Deployment

After deploying the rules, the permission error should be resolved. You can verify by:
1. Refreshing your app
2. Checking the browser console for errors
3. Testing the cooker dashboard functionality

## 🌱 Seed Initial Data

Once the rules are deployed, you can seed the database with initial data:

### Option 1: Using the Setup Script
```bash
# Install tsx if not already installed
npm install -g tsx

# Run the setup script
npx tsx scripts/setupFirebase.ts
```

### Option 2: Manual Data Creation
You can also create data manually through the Firebase Console:

1. Go to Firestore Database → Data tab
2. Create collections: `cooks`, `dishes`, `orders`, `reviews`
3. Add sample documents following the TypeScript interfaces

## 📋 Required Collections Structure

### Cooks Collection
```typescript
{
  id: string,
  displayName: string,
  email: string,
  avatar: string,
  bio: string,
  location: string,
  rating: number,
  // ... other fields as defined in Cook interface
}
```

### Dishes Collection
```typescript
{
  id: string,
  name: string,
  description: string,
  price: number,
  cookerId: string,
  category: string,
  isAvailable: boolean,
  // ... other fields as defined in Dish interface
}
```

### Orders Collection
```typescript
{
  id: string,
  customerId: string,
  cookerId: string,
  dishes: Array<{dishId: string, quantity: number, price: number}>,
  total: number,
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered',
  // ... other fields as defined in Order interface
}
```

## 🔧 Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side Firebase Admin (for API routes)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com
```

## 🎯 Testing the Integration

After completing the setup:

1. **Login** to the app as a cooker
2. **Navigate** to the cooker dashboard
3. **Verify** that data loads without permission errors
4. **Test** editing dishes and updating order statuses
5. **Check** real-time updates work properly

## 🔍 Troubleshooting

### Still getting permission errors?
- Double-check that rules are published in Firebase Console
- Verify user is authenticated (check browser dev tools → Application → Local Storage)
- Ensure the user's UID matches the document IDs in Firestore

### No data showing?
- Run the seeding script to populate initial data
- Check Firestore Console to verify collections exist
- Verify environment variables are correctly set

### Real-time updates not working?
- Check browser console for WebSocket connection errors
- Verify Firestore rules allow read access for the user
- Test with a simple query first

## 📚 Next Steps

Once Firebase is working:
1. Integrate remaining app sections (dishes page, cook profiles)
2. Add more sophisticated data validation
3. Implement proper error handling and user feedback
4. Add data backup and recovery procedures
