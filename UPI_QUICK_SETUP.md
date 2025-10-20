# 🚀 Quick UPI Setup Guide

## Get Started in 5 Minutes!

### Step 1: Configure Your UPI ID (2 min)

Edit `backend/src/main/resources/application.properties`:

```properties
# Change this to your UPI ID
upi.id=yourname@paytm

# Change this to your business name
upi.merchant.name=My Food Business
```

**Where to get UPI ID?**
- Personal: Your PhonePe/Paytm/GPay UPI ID (for testing)
- Business: Contact Razorpay/PayU/Paytm Business (for production)

### Step 2: Start the Application (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Test Payment (2 min)

1. **Open App:** http://localhost:5173
2. **Login:** customer@food.com / customer123
3. **Order:**
   - Browse restaurants → Select "Pizza Palace"
   - View menu → Add items
   - Checkout → Place order
4. **See QR Code:** UPI payment QR appears! 🎉

### Step 4: Scan & Pay

1. Open any UPI app on your phone:
   - Google Pay
   - PhonePe  
   - Paytm
   - BHIM
   - Any banking app

2. Tap "Scan QR Code"
3. Scan the QR code on screen
4. You'll see:
   - Merchant: (your merchant name)
   - Amount: (your order total)
   - Note: Order Payment - Order #X

5. (Optional) Complete payment or cancel

### Step 5: Update Status (Admin)

1. **Logout** and login as admin
   - Email: admin@food.com
   - Password: admin123

2. **Go to Admin Dashboard**
   - Click "Admin Dashboard"
   - You'll see the order in the table

3. **Update Payment:**
   - Find "Payment" column
   - Click dropdown → Select "PAID"
   - Click "📱 View UPI QR" to see customer's QR

✅ **Done!** Your UPI payment system is working!

---

## 🎯 What You Get

### Customer Side:
- ✅ Instant UPI QR code after order
- ✅ Works with all UPI apps
- ✅ Clear payment instructions
- ✅ Payment status tracking

### Admin Side:
- ✅ View all payment QR codes
- ✅ Update payment status
- ✅ Track pending/paid orders
- ✅ Order ID in QR for reference

---

## 🔧 Customize Settings

### Change Merchant Name:
```properties
upi.merchant.name=My Restaurant
```
This appears when customer scans QR

### Change UPI ID:
```properties
upi.id=myshop@paytm
```
Where payments will be received

### Change Merchant Category:
```properties
upi.merchant.code=5814
```
- `5814` = Fast Food
- `5812` = Restaurant
- `5411` = Grocery

---

## 📱 Supported UPI Apps

Works with **all** UPI apps in India:
- ✅ Google Pay (GPay)
- ✅ PhonePe
- ✅ Paytm
- ✅ BHIM (NPCI's official app)
- ✅ Amazon Pay
- ✅ All banking apps (SBI, HDFC, ICICI, etc.)
- ✅ 300+ other UPI apps

---

## ⚡ Testing Tips

### Test Different Amounts:
- Small order: ₹50-100
- Medium order: ₹500-1000
- Large order: ₹2000+

All should generate valid QR codes!

### Test Multiple Orders:
Each order gets a **unique QR code** with:
- Unique order ID
- Correct amount
- Transaction reference

### Test Admin Features:
- View QR codes for all orders
- Update payment status
- Track order history

---

## 🚀 Ready for Production?

### For Testing:
✅ Use your personal UPI ID (yourname@paytm)
✅ Current setup works perfectly!

### For Production:
1. **Get merchant account** from:
   - Razorpay: https://razorpay.com
   - PayU: https://payu.in
   - Paytm Business: https://business.paytm.com

2. **Update UPI ID** in application.properties

3. **Add webhooks** for auto payment verification

4. **Enable HTTPS** for security

Read `UPI_INTEGRATION.md` for complete production guide!

---

## ❓ Common Questions

### Q: Can I use my personal UPI ID?
**A:** Yes for testing! For production, get a merchant account.

### Q: How do I know if payment is received?
**A:** Check your UPI app transaction history or bank statement.

### Q: Can customers pay from any bank?
**A:** Yes! UPI works with 300+ banks in India.

### Q: What if customer doesn't pay?
**A:** Order stays as "PENDING". Admin can cancel unpaid orders.

### Q: Is it safe?
**A:** Yes! UPI is regulated by RBI and NPCI (India's payment authority).

### Q: What about payment failures?
**A:** Customer can retry. Admin can update status to "FAILED" if needed.

---

## 🐛 Troubleshooting

### QR Code Not Showing?
1. Check backend is running (port 8080)
2. Check browser console for errors
3. Restart backend: `./mvnw spring-boot:run`

### QR Code Not Scannable?
1. Make sure UPI ID is correct format: `name@provider`
2. Check application.properties has correct values
3. Try different UPI apps

### Payment Not Updating?
Admin must manually update status:
1. Login as admin
2. Admin Dashboard → Orders
3. Change payment dropdown to "PAID"

---

## 📞 Need Help?

1. **Full Documentation:** Read `UPI_INTEGRATION.md`
2. **Testing Guide:** Read `TESTING_GUIDE.md`
3. **Payment Feature:** Read `PAYMENT_FEATURE.md`

---

## 🎉 You're All Set!

Your Food Delivery App now accepts UPI payments - India's most popular payment method!

**Happy Testing! 🚀**
