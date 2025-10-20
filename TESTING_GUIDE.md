# Quick Test Guide - Payment Feature

## Step-by-Step Testing

### 1. Start the Application

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Test Customer Checkout Flow

1. **Login as Customer**
   - Email: `customer@food.com`
   - Password: `customer123`

2. **Place an Order**
   - Click "Browse restaurants"
   - Select a restaurant
   - Click "View menu"
   - Add items to cart (click "Add to cart" on dishes)
   - Go to "Checkout" page
   - (Optional) Enter delivery address
   - Click "Place order"

3. **Verify QR Code**
   - ✅ QR code should appear after order is placed
   - ✅ Message: "Order placed! Please scan the QR code below to complete payment."
   - ✅ Payment status shows "PENDING"

4. **Check Order History**
   - Scroll to the right side panel "Recent orders"
   - ✅ New order appears with payment status: "PENDING"
   - ✅ Order details are correct

### 3. Test Admin Payment Management

1. **Login as Admin**
   - Logout from customer account
   - Email: `admin@food.com`
   - Password: `admin123`

2. **View Orders**
   - Click "Admin Dashboard"
   - Navigate to "Orders" tab (should be default)

3. **Manage Payment**
   - ✅ Find the order you just placed
   - ✅ "Payment" column shows dropdown with "PENDING" selected
   - ✅ Click "View QR" to see the payment QR code
   - ✅ Change payment status to "PAID"
   - ✅ Success message appears: "Payment status updated."

4. **Verify Update**
   - Login back as customer
   - Check order history
   - ✅ Payment status should now show "PAID"

### 4. Test QR Code Scanning (Optional)

1. Open a QR code scanner app on your phone
2. Scan the QR code displayed in the checkout or admin panel
3. The decoded text should show:
   ```
   ORDER:{order_id}|AMOUNT:{total_amount}|MERCHANT:FoodDelivery
   ```
   Example: `ORDER:1|AMOUNT:45.50|MERCHANT:FoodDelivery`

## Expected Results Checklist

### Customer Side
- [ ] QR code is generated and displayed after checkout
- [ ] QR code image is visible (white background, black QR pattern)
- [ ] Payment section has purple/blue styling
- [ ] Order appears in history with payment status
- [ ] Payment status updates when admin changes it

### Admin Side
- [ ] New "Payment" column in orders table
- [ ] Payment status dropdown works (PENDING, PAID, FAILED)
- [ ] "View QR" expands to show QR code
- [ ] QR code is visible and scannable
- [ ] Changing payment status shows success message
- [ ] Payment status persists after page refresh

## Troubleshooting

### QR Code Not Showing
- Check browser console for errors
- Verify backend is running (port 8080)
- Check if Maven downloaded QR code libraries
- Restart backend if needed

### Payment Status Not Updating
- Check browser console for errors
- Verify you're logged in as admin
- Check network tab for API response
- Ensure userId is being passed correctly

### Build Errors
If you get compilation errors:
```bash
cd backend
./mvnw clean install -DskipTests
```

### Frontend Errors
If frontend won't start:
```bash
cd frontend
npm install
npm run dev
```

## Test Data

### Pre-configured Users
1. **Customer**
   - Email: customer@food.com
   - Password: customer123

2. **Admin**
   - Email: admin@food.com
   - Password: admin123

3. **Driver**
   - Email: driver@food.com
   - Password: driver123

### Sample Order Flow
1. Login → Browse restaurants → "Pizza Palace"
2. View menu → Add "Margherita Pizza" (2x)
3. Add "Garlic Bread" (1x)
4. Checkout → Place order
5. Total should be around $30-40
6. QR code appears with order details

## Screenshots Checklist

What you should see:

### Checkout Page After Order
```
┌─────────────────────────────────┐
│ ✅ Order placed! Please scan    │
│    the QR code below to         │
│    complete payment.            │
├─────────────────────────────────┤
│  Payment QR Code                │
│  ┌───────────────────┐          │
│  │   [QR CODE IMG]   │          │
│  └───────────────────┘          │
│  Scan this QR code to complete  │
│  payment                        │
│  Payment Status: PENDING        │
└─────────────────────────────────┘
```

### Admin Orders Table
```
Order | Customer | Restaurant | Total | ... | Payment      | 
#1    | John     | Pizza      | $45   | ... | [PENDING ▼] |
                                        [View QR ▼]
```

### Order History Card
```
┌─────────────────────────────┐
│ #1              [Pending]   │
│ 10/20/2025, 3:30 PM        │
│                             │
│ Pizza Palace                │
│ • Margherita Pizza × 2      │
│ • Garlic Bread × 1          │
│                             │
│ Payment: PENDING            │
│                             │
│ Total          $45.50       │
└─────────────────────────────┘
```

## Success Criteria
✅ Customer can place order and receive QR code
✅ QR code is unique for each order
✅ QR code can be scanned and decoded
✅ Admin can view all payment QR codes
✅ Admin can update payment status
✅ Payment status updates are reflected in customer view
✅ No errors in console or backend logs

## Ready for Production?
This is a **dummy implementation** for demonstration. Before production:

1. ✅ Integrate with real payment gateway (Stripe, PayPal, UPI)
2. ✅ Add payment verification system
3. ✅ Implement webhook handlers for automatic updates
4. ✅ Add payment security measures
5. ✅ Add transaction logging
6. ✅ Implement refund functionality
7. ✅ Add payment notifications (email/SMS)
8. ✅ Add SSL/TLS encryption
9. ✅ Implement rate limiting
10. ✅ Add payment analytics dashboard
