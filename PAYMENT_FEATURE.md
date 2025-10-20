# Payment System with QR Code Implementation

## Overview
This feature adds a complete payment system to the Food Delivery App. When customers place an order, a unique QR code is generated for payment. Customers can scan this QR code to pay, and admins can track and update payment status.

## Features Added

### 1. **Backend Changes**

#### Dependencies Added (pom.xml)
- `com.google.zxing:core:3.5.3` - QR code generation library
- `com.google.zxing:javase:3.5.3` - Java SE extensions for QR code generation

#### New Service
**QRCodeService.java**
- Generates QR codes for payment
- Creates a dummy payment data string containing order ID and amount
- Returns base64-encoded PNG image with data URI prefix
- Can be easily extended to integrate with real payment gateways (UPI, PayPal, etc.)

#### Order Model Updates
**Order.java**
- Added `paymentStatus` field (PENDING, PAID, FAILED)
- Added `paymentQrCode` field (Base64 encoded QR code image)

#### OrderController Updates
**OrderController.java**
- Integrated QRCodeService
- Generates QR code when order is placed
- Returns QR code and payment status in the order response

#### AdminController Updates
**AdminController.java**
- Added payment status to order view
- New endpoint: `PATCH /api/admin/orders/{orderId}/payment`
  - Allows admins to update payment status
  - Validates admin privileges

### 2. **Frontend Changes**

#### Type Definitions
**types.ts**
- Added `paymentStatus` and `paymentQrCode` to `OrderSummaryPayload`
- Added `paymentStatus` and `paymentQrCode` to `AdminOrder`

#### AppContext Updates
**AppContext.tsx**
- Modified `placeOrder` function to return payment data
- Returns: `{ orderId, paymentQrCode, paymentStatus }`

#### OrderSummary Component
**OrderSummary.tsx**
- Displays QR code after successful checkout
- Shows payment status
- Styled payment section with purple theme
- QR code is displayed in a white container for easy scanning

#### OrderHistory Component
**OrderHistory.tsx**
- Shows payment status for each order in history
- Displays: "Payment: PENDING/PAID/FAILED"

#### AdminDashboardPage Updates
**AdminDashboardPage.tsx**
- Added "Payment" column to orders table
- Payment status dropdown (PENDING, PAID, FAILED)
- Collapsible QR code viewer for each order
- Admin can update payment status and view customer's QR code

#### Styling
**App.css**
- Added `.payment-section` styling
- Added `.qr-container` for QR code display
- Added `.qr-code` image styling

## How It Works

### Customer Flow
1. Customer adds items to cart and proceeds to checkout
2. Customer enters delivery address (optional) and clicks "Place order"
3. System generates a unique QR code for the order
4. QR code is displayed to the customer with payment instructions
5. Customer scans QR code to make payment (dummy implementation)
6. Order appears in order history with payment status

### Admin Flow
1. Admin views all orders in the dashboard
2. Each order shows current payment status (PENDING by default)
3. Admin can click "View QR" to see the customer's payment QR code
4. Admin can update payment status from dropdown:
   - PENDING → PAID (when payment is confirmed)
   - PENDING → FAILED (if payment fails)
5. Payment status is immediately updated and visible to customer

## QR Code Content Format
Current dummy format:
```
ORDER:{orderId}|AMOUNT:{amount}|MERCHANT:FoodDelivery
```

Example:
```
ORDER:1|AMOUNT:45.50|MERCHANT:FoodDelivery
```

### Integration with Real Payment Gateway
To integrate with a real payment gateway (UPI, PayPal, Stripe, etc.):

1. **Modify QRCodeService.generatePaymentQRCode()**
   ```java
   // For UPI (India)
   String paymentData = String.format(
       "upi://pay?pa=merchant@upi&pn=FoodDelivery&am=%.2f&tn=Order%%20%d&cu=INR",
       amount, orderId
   );
   
   // For PayPal
   String paymentData = String.format(
       "https://www.paypal.com/paypalme/yourmerchant/%.2f?note=Order%%20%d",
       amount, orderId
   );
   ```

2. **Add Payment Webhook Endpoint**
   - Create endpoint to receive payment gateway callbacks
   - Automatically update payment status when payment is confirmed
   - Send notification to customer

3. **Add Payment Verification**
   - Store transaction ID
   - Verify payment with gateway API
   - Update order status based on payment status

## Testing

### Test Customer Checkout
1. Log in as a customer
2. Select a restaurant and add items to cart
3. Go to checkout page
4. Click "Place order"
5. Verify QR code is displayed
6. Check order history - payment status should be "PENDING"

### Test Admin Payment Management
1. Log in as admin (admin@food.com / admin123)
2. Navigate to Orders tab
3. Find an order with PENDING payment
4. Click "View QR" to see the QR code
5. Change payment status dropdown to "PAID"
6. Verify status updates successfully

### Test QR Code Generation
1. Place multiple orders
2. Verify each order has a unique QR code
3. Scan QR codes with a QR scanner app
4. Verify the encoded data contains correct order ID and amount

## Database Changes
The Order table now includes:
- `payment_status` VARCHAR(20) - Stores payment status
- `payment_qr_code` VARCHAR(1000) - Stores base64 QR code image

**Note:** You may need to restart the backend application to apply schema changes.

## Future Enhancements
1. **Payment Gateway Integration**
   - Integrate with Stripe, PayPal, or UPI
   - Automatic payment verification
   - Payment webhooks

2. **Payment History**
   - Separate payment transactions table
   - Track payment attempts
   - Refund functionality

3. **Multiple Payment Methods**
   - Credit/Debit card
   - Digital wallets
   - Cash on delivery option

4. **Payment Notifications**
   - Email/SMS notifications on payment success
   - Payment reminder notifications
   - Payment receipt generation

5. **Payment Analytics**
   - Revenue dashboard
   - Payment success rate
   - Popular payment methods

## Security Considerations
1. Always validate payment status server-side
2. Use HTTPS for payment data transmission
3. Implement payment amount verification
4. Add rate limiting to prevent payment fraud
5. Log all payment status changes with user ID and timestamp

## API Endpoints Summary

### Customer Endpoints
- `POST /api/orders` - Place order (returns QR code)
- `GET /api/orders/user/{userId}` - Get user orders (includes payment status)

### Admin Endpoints
- `GET /api/admin/orders` - Get all orders (includes payment data)
- `PATCH /api/admin/orders/{orderId}/payment` - Update payment status
  - Request body: `{ "paymentStatus": "PAID" }`
  - Response: Updated order object

## Notes
- QR codes are stored as base64 data URIs
- Payment system is currently a dummy implementation
- Ready for integration with real payment gateways
- Admin can manually verify and update payment status
