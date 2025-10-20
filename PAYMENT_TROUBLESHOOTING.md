# 🔧 Payment Modal Troubleshooting Guide

## Issue: Cannot find QR code payment page in checkout

### Quick Solution ✅

I've added a **test button** in the checkout page that you can click to see the payment modal!

## How to See the Payment Modal

### Method 1: Test Button (Easiest)
1. **Start the application:**
   ```bash
   # Backend
   cd backend
   ./mvnw spring-boot:run
   
   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

2. **Login as customer:**
   - Go to http://localhost:5173
   - Email: `customer@food.com`
   - Password: `customer123`

3. **Add items to cart:**
   - Browse restaurants
   - View menu
   - Add 2-3 items

4. **Go to Checkout page**

5. **Click the test button:**
   - You'll see a button: **"🧪 Test Payment Modal (Click to see payment interface)"**
   - Click it!
   - **Payment modal opens!** 🎉

### Method 2: Place Real Order
1. Follow steps 1-3 above
2. Go to Checkout page
3. Click **"Place order"** button
4. Payment modal should open automatically
5. **Check browser console (F12)** for debug logs:
   ```
   Order result: { orderId: 1, paymentQrCode: "...", paymentStatus: "PENDING" }
   QR Code: Present (or Missing)
   Order ID: 1
   Opening payment modal...
   ```

## What the Payment Modal Looks Like

When it opens, you should see:

```
┌──────────────────────────────────────────┐
│  Complete Payment               [×]      │
├──────────────────────────────────────────┤
│         Total Amount                     │
│           $XX.XX                         │
├──────────────────────────────────────────┤
│  [📱 Scan QR] [💳 UPI ID] [💵 COD]     │
├──────────────────────────────────────────┤
│                                          │
│        QR CODE DISPLAYED HERE            │
│                                          │
│  [Download QR Code]                     │
│  [Verify Payment]                       │
│                                          │
└──────────────────────────────────────────┘
```

## Debug Checklist

### ✅ Check if Payment Modal Component Exists
```bash
ls frontend/src/components/PaymentModal.tsx
```
Should show: `PaymentModal.tsx`

### ✅ Check Browser Console for Errors
1. Open browser (F12)
2. Go to Console tab
3. Look for:
   - ✅ "Test button clicked - opening payment modal"
   - ✅ "Order result: ..."
   - ✅ "Opening payment modal..."
   - ❌ Any red error messages

### ✅ Check if Modal CSS is Loaded
1. Open browser DevTools (F12)
2. Go to Elements/Inspector
3. Search for `.modal-overlay`
4. Should find the CSS class

### ✅ Verify Backend Returns QR Code
1. Place an order
2. Check Network tab in browser (F12)
3. Look for POST to `/api/orders`
4. Check response - should contain:
   ```json
   {
     "orderId": 1,
     "paymentQrCode": "data:image/png;base64,...",
     "paymentStatus": "PENDING"
   }
   ```

## Common Issues & Solutions

### Issue 1: Test Button Not Visible
**Solution:** Make sure you have items in your cart!

### Issue 2: Modal Opens but No Content
**Cause:** QR code not generated
**Solution:**
1. Check backend logs for errors
2. Verify ZXing library is installed:
   ```bash
   cd backend
   ./mvnw dependency:tree | grep zxing
   ```
3. Should see:
   ```
   com.google.zxing:core:jar:3.5.3
   com.google.zxing:javase:jar:3.5.3
   ```

### Issue 3: Internal Server Error
**Solution:**
1. Check backend console for stack trace
2. Look for QRCodeService errors
3. Check application.properties has:
   ```properties
   upi.id=8125358163@ybl
   upi.merchant.name=Arruri Bharath
   ```

### Issue 4: Modal Doesn't Open After "Place Order"
**Solution:**
1. Open browser console (F12)
2. Look for debug logs
3. Check if order was created successfully
4. Use test button to verify modal works
5. Check for JavaScript errors

### Issue 5: Black Screen/Overlay But No Modal
**Cause:** CSS might not be loaded correctly
**Solution:**
1. Check App.css is imported in main.tsx
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

## Manual Test Steps

### Step 1: Verify Frontend is Running
```bash
# Should see:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Step 2: Verify Backend is Running
```bash
# Should see:
# Started BackendApplication in x.xxx seconds
# Tomcat started on port 8080
```

### Step 3: Login and Navigate
1. Login as customer
2. Navigate: Browse Restaurants → View Menu → Checkout
3. Verify cart has items

### Step 4: Click Test Button
**Expected:**
- Modal appears with dark overlay
- Modal has payment tabs
- Can see QR code or placeholder
- Can close modal with X button

### Step 5: Try Real Order
1. Click "Place order"
2. Check console logs
3. Modal should open automatically

## Console Debug Commands

Open browser console (F12) and run:

```javascript
// Check if PaymentModal component exists
console.log(document.querySelector('.modal-overlay'))

// Check if modal CSS is loaded
console.log(getComputedStyle(document.body).getPropertyValue('--modal-test') || 'CSS Loaded')

// Force open modal (if state is accessible)
// This won't work directly but you can use the test button
```

## Video/Screenshot Guide

### What You Should See:

1. **Checkout Page:**
   - Cart with items
   - Total amount
   - "Place order" button
   - 🧪 Test button

2. **After Clicking Test/Place Order:**
   - Screen darkens (overlay)
   - Modal slides up
   - Payment interface visible
   - Three tabs: QR, UPI, COD

3. **QR Code Tab:**
   - White square with QR code
   - "Scan with any UPI app" text
   - Download button
   - Transaction ID field

## Still Not Working?

### Check These Files Exist:
```bash
frontend/src/components/PaymentModal.tsx ✅
frontend/src/components/OrderSummary.tsx ✅
frontend/src/App.css (with modal styles) ✅
```

### Verify Code is Updated:
1. Check OrderSummary.tsx has:
   ```typescript
   import PaymentModal from './PaymentModal'
   const [showPaymentModal, setShowPaymentModal] = useState(false)
   ```

2. Check App.css has:
   ```css
   .modal-overlay { ... }
   .modal-content { ... }
   .payment-modal { ... }
   ```

### Nuclear Option - Full Rebuild:
```bash
# Stop all running servers (Ctrl+C)

# Backend
cd backend
./mvnw clean install -DskipTests
./mvnw spring-boot:run

# Frontend (new terminal)
cd frontend
rm -rf node_modules
npm install
npm run dev
```

## Need More Help?

### Share These Details:
1. Browser console output (screenshot)
2. Network tab showing /api/orders request/response
3. Backend console logs
4. Which method you tried (test button or real order)
5. Any error messages

---

## Quick Win! 🎉

**Just click the 🧪 Test Button** in your cart to see the payment modal immediately - no need to place a real order first!

The test button will show you exactly what the payment interface looks like without creating an actual order.
