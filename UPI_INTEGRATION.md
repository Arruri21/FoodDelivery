# UPI Payment Integration Guide

## 🇮🇳 Complete UPI Integration for Food Delivery App

This application now supports **UPI (Unified Payments Interface)** - India's instant payment system. Customers can pay using any UPI app like Google Pay, PhonePe, Paytm, BHIM, or their banking app.

---

## 📋 Table of Contents
1. [What is UPI?](#what-is-upi)
2. [How It Works](#how-it-works)
3. [Setup Instructions](#setup-instructions)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [UPI QR Code Format](#upi-qr-code-format)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 What is UPI?

**UPI (Unified Payments Interface)** is India's instant real-time payment system developed by NPCI (National Payments Corporation of India). It allows:

- ✅ Instant money transfer between bank accounts
- ✅ 24/7 availability
- ✅ Scan QR code to pay
- ✅ Works with 300+ banks
- ✅ Free for consumers
- ✅ Widely adopted in India (billions of transactions monthly)

### Popular UPI Apps:
- 📱 **Google Pay** (GPay)
- 📱 **PhonePe**
- 📱 **Paytm**
- 📱 **BHIM**
- 📱 **Amazon Pay**
- 📱 Banking apps (SBI, HDFC, ICICI, etc.)

---

## 🔄 How It Works

### Customer Flow:
1. **Place Order** → Customer adds items and proceeds to checkout
2. **QR Code Generated** → System generates UPI payment QR code
3. **Scan & Pay** → Customer opens any UPI app and scans QR code
4. **Payment Processed** → UPI app shows merchant details and amount
5. **Confirm Payment** → Customer enters UPI PIN and confirms
6. **Order Updated** → Admin marks payment as received

### Technical Flow:
```
Customer                    Backend                  UPI Network
   |                           |                          |
   |------ Place Order ------->|                          |
   |                           |                          |
   |                           |--- Generate QR Code ---->|
   |<----- QR Code Returned ---|                          |
   |                           |                          |
   |--- Scan QR with UPI App ->|                          |
   |                           |                          |
   |<------ UPI Payment Page --|                          |
   |                           |                          |
   |------ Confirm Payment --->|--- Process Payment ----->|
   |                           |                          |
   |                           |<----- Success/Fail ------|
   |                           |                          |
   |                           |<-- Admin Updates Status -|
```

---

## 🛠️ Setup Instructions

### 1. Get Your UPI Merchant Account

To accept UPI payments, you need a **UPI Merchant ID**:

#### Option A: Through Payment Gateway (Recommended for Production)
Use a payment gateway that provides UPI merchant services:

- **Razorpay** (https://razorpay.com)
  - Sign up → Get UPI merchant ID
  - Get API keys for webhook integration
  
- **PayU** (https://payu.in)
  - Business account → UPI merchant setup
  - Provides QR code API
  
- **Paytm Business** (https://business.paytm.com)
  - Merchant account → UPI ID
  - Dashboard for transaction tracking

- **Cashfree** (https://www.cashfree.com)
  - Business account → UPI integration
  - Webhook support

#### Option B: Through Your Bank (Traditional)
Contact your business bank to set up:
- Current/savings account with UPI
- UPI merchant ID (format: `merchantname@bankname`)
- QR code generation capability

#### Option C: Testing/Development
For testing purposes, you can use:
- Your personal UPI ID (e.g., `yourname@paytm`)
- **Note:** This is ONLY for testing, not for production

### 2. Configure UPI Settings

Edit `backend/src/main/resources/application.properties`:

```properties
# UPI Payment Configuration
upi.id=yourbusiness@paytm           # Your UPI merchant ID
upi.merchant.name=Your Business Name # Business name shown to customers
upi.merchant.code=5814               # Merchant Category Code (5814 = Fast Food)
upi.currency=INR                     # Currency (INR for Indian Rupees)
upi.transaction.note.prefix=Order Payment -
```

#### UPI ID Examples:
- Personal: `john@paytm`, `merchant@okaxis`, `shop@ybl`
- Business: `fooddelivery@paytm`, `restaurant@icici`, `business@hdfcbank`

#### Merchant Category Codes (MCC):
- `5814` - Fast Food Restaurants
- `5812` - Eating Places/Restaurants
- `5499` - Miscellaneous Food Stores
- `5411` - Grocery Stores

### 3. Restart Backend

After configuration:
```bash
cd backend
./mvnw spring-boot:run
```

---

## ⚙️ Configuration

### Complete Configuration Options

**File:** `application.properties`

```properties
# Required Settings
upi.id=merchant@paytm                    # Your UPI Virtual Payment Address (VPA)
upi.merchant.name=Food Delivery App      # Merchant name (max 25 characters)

# Optional Settings
upi.merchant.code=5814                   # MCC code (helps with categorization)
upi.currency=INR                         # Currency code
upi.transaction.note.prefix=Payment for # Transaction description prefix
```

### UPI QR Code Parameters

The generated QR code contains:

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `pa` | Payee Address (UPI ID) | ✅ Yes | `merchant@paytm` |
| `pn` | Payee Name | ✅ Yes | `Food Delivery App` |
| `am` | Amount | ✅ Yes | `450.50` |
| `tn` | Transaction Note | ⚠️ Recommended | `Order Payment - Order #123` |
| `cu` | Currency | ⚠️ Recommended | `INR` |
| `mc` | Merchant Code | ❌ Optional | `5814` |
| `tr` | Transaction Reference | ❌ Optional | `ORD123` |

### Example Generated UPI String:
```
upi://pay?pa=fooddelivery@paytm&pn=Food%20Delivery%20App&am=450.50&tn=Order%20Payment%20-%20Order%20%23123&cu=INR&mc=5814&tr=ORD123
```

---

## 🧪 Testing

### Test the UPI Integration

#### 1. Test QR Code Generation
```bash
# Start backend
cd backend
./mvnw spring-boot:run

# Start frontend
cd frontend
npm run dev
```

#### 2. Place a Test Order
1. Login as customer: `customer@food.com` / `customer123`
2. Browse restaurants → Select restaurant → Add items
3. Go to Checkout → Place order
4. **UPI QR code should appear**

#### 3. Scan QR Code
Use any UPI app on your phone:
- Open Google Pay / PhonePe / Paytm
- Tap "Scan QR Code"
- Scan the generated QR code
- You should see:
  - Merchant name: "Food Delivery App"
  - Amount: (your order total)
  - Transaction note: "Order Payment - Order #X"

#### 4. Complete Payment (Optional)
- **For Testing:** You can cancel the payment
- **For Real Orders:** Enter UPI PIN and confirm

#### 5. Update Payment Status
1. Login as admin: `admin@food.com` / `admin123`
2. Go to Admin Dashboard → Orders tab
3. Find the order → Change payment status to "PAID"

### Testing Checklist
- [ ] QR code generates successfully
- [ ] QR code is scannable with UPI apps
- [ ] Merchant name appears correctly
- [ ] Amount is correct
- [ ] Transaction note includes order ID
- [ ] Admin can view QR code
- [ ] Admin can update payment status
- [ ] Payment status updates in customer view

---

## 📱 UPI QR Code Format (NPCI Specification)

### Standard Format:
```
upi://pay?<parameters>
```

### Required Parameters:
```
pa    = Payee Address (UPI ID)
pn    = Payee Name (merchant name)
am    = Amount (decimal, 2 places)
```

### Recommended Parameters:
```
tn    = Transaction Note (description)
cu    = Currency (INR for India)
mc    = Merchant Category Code
tr    = Transaction Reference ID
```

### Full Example:
```
upi://pay?
  pa=merchant@paytm&
  pn=Food%20Delivery%20App&
  am=450.50&
  tn=Order%20Payment%20-%20Order%20%23123&
  cu=INR&
  mc=5814&
  tr=ORD123
```

### Validation Rules:
- Amount: Max 2 decimal places, no commas
- Name: Max 99 characters, URL encoded
- UPI ID: Valid VPA format (user@psp)
- Currency: ISO 4217 code (INR for India)

---

## 🚀 Production Deployment

### Before Going Live:

#### 1. Get Official Merchant Account
❌ Don't use personal UPI ID in production
✅ Register as UPI merchant with:
- Payment gateway (Razorpay, PayU, Paytm Business)
- Your bank's merchant services
- NPCI-approved payment aggregator

#### 2. Implement Payment Verification

**Why?** Currently, admin manually updates payment status. For production, automate this.

**Solution:** Use payment gateway webhooks:

```java
@RestController
@RequestMapping("/api/webhooks")
public class PaymentWebhookController {
    
    @PostMapping("/upi-callback")
    public ResponseEntity<?> handleUPICallback(@RequestBody Map<String, Object> payload) {
        // Verify webhook signature
        // Extract order ID and payment status
        // Update order in database
        // Send confirmation to customer
        return ResponseEntity.ok().build();
    }
}
```

#### 3. Add Security Measures
- ✅ Enable HTTPS (SSL/TLS certificate)
- ✅ Validate webhook signatures
- ✅ Rate limiting on payment endpoints
- ✅ Store transaction logs
- ✅ Implement fraud detection
- ✅ PCI compliance (if storing payment data)

#### 4. Add Customer Notifications
```java
// Send email/SMS on payment success
public void notifyCustomer(Order order) {
    emailService.send(
        order.getUser().getEmail(),
        "Payment Received",
        "Your payment for Order #" + order.getId() + " received!"
    );
}
```

#### 5. Transaction Logging
```java
@Entity
public class PaymentTransaction {
    private Long id;
    private Long orderId;
    private String upiTransactionId;
    private String status; // SUCCESS, FAILED, PENDING
    private Double amount;
    private LocalDateTime timestamp;
    private String upiId; // Customer's UPI ID
}
```

#### 6. Payment Reconciliation
- Daily reconciliation with bank statement
- Match order payments with bank credits
- Handle payment disputes
- Refund processing

### Production Configuration:

```properties
# Production UPI Settings
upi.id=${UPI_MERCHANT_ID}           # From environment variable
upi.merchant.name=${BUSINESS_NAME}   # From environment variable
upi.merchant.code=${MCC_CODE}        # From environment variable

# Payment Gateway
payment.gateway.webhook.url=${WEBHOOK_URL}
payment.gateway.api.key=${GATEWAY_API_KEY}
payment.gateway.secret=${GATEWAY_SECRET}

# Security
payment.webhook.signature.secret=${SIGNATURE_SECRET}
payment.rate.limit.requests=100
payment.rate.limit.period=60
```

### Environment Variables:
```bash
export UPI_MERCHANT_ID="yourbusiness@razorpay"
export BUSINESS_NAME="Your Business Name"
export MCC_CODE="5814"
export GATEWAY_API_KEY="your_gateway_api_key"
export GATEWAY_SECRET="your_gateway_secret"
```

---

## 🐛 Troubleshooting

### QR Code Not Generating

**Problem:** QR code doesn't appear after order placement

**Solutions:**
1. Check backend logs for errors
2. Verify ZXing library is included in pom.xml
3. Rebuild: `./mvnw clean install`
4. Check UPI configuration in application.properties

### QR Code Not Scannable

**Problem:** UPI app can't read QR code

**Solutions:**
1. Verify UPI string format
2. Check if UPI ID is valid
3. Ensure amount has max 2 decimal places
4. Test with multiple UPI apps
5. Increase QR code size (currently 300x300)

### Payment Not Reflecting

**Problem:** Customer paid but status not updated

**Solutions:**
1. Admin must manually update status (current implementation)
2. For automation, implement webhook listener
3. Check if payment gateway callback is working
4. Verify order ID in payment reference

### UPI ID Format Issues

**Problem:** Invalid UPI ID error

**Valid Formats:**
- ✅ `merchant@paytm`
- ✅ `business@okaxis`
- ✅ `shop@ybl`
- ❌ `merchant.paytm` (no @)
- ❌ `@paytm` (no user part)
- ❌ `merchant` (no PSP)

### Amount Formatting Issues

**Problem:** Payment fails due to amount format

**Solutions:**
```java
// Correct
String.format("%.2f", 450.50)  // "450.50" ✅

// Wrong
String.format("%.0f", 450)     // "450" ❌
String.format("%,.2f", 450.50) // "450.50" (with comma in some locales) ❌
```

---

## 📊 Payment Analytics

### Track UPI Transactions

Add analytics to monitor:
- Total UPI transactions
- Success rate
- Average transaction value
- Peak transaction times
- Failed transaction reasons

```java
@Service
public class PaymentAnalyticsService {
    
    public Map<String, Object> getUPIStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTransactions", getTotalTransactions());
        stats.put("successRate", getSuccessRate());
        stats.put("averageValue", getAverageTransactionValue());
        stats.put("todayRevenue", getTodayRevenue());
        return stats;
    }
}
```

---

## 🔐 Security Best Practices

1. **Never expose UPI merchant credentials in frontend**
2. **Validate all payment amounts server-side**
3. **Use HTTPS for all payment pages**
4. **Implement rate limiting on payment endpoints**
5. **Log all payment activities**
6. **Verify webhook signatures**
7. **Store transaction references**
8. **Implement payment timeout (e.g., 15 minutes)**
9. **Add CAPTCHA for payment pages**
10. **Monitor for suspicious activity**

---

## 📞 Support & Resources

### Official Documentation:
- NPCI UPI Specification: https://www.npci.org.in/what-we-do/upi
- UPI QR Code Standard: https://www.npci.org.in/PDF/npci/upi/circular/2020/UPI-Circular-63-Common-QR-Code-Specification.pdf

### Payment Gateways:
- Razorpay: https://razorpay.com/docs/upi/
- PayU: https://docs.payu.in/docs/upi-intent
- Paytm: https://business.paytm.com/docs
- Cashfree: https://docs.cashfree.com/docs/upi

### Testing Tools:
- BHIM App (Official NPCI app): https://www.npci.org.in/what-we-do/bhim
- Google Pay: https://pay.google.com
- PhonePe: https://www.phonepe.com

---

## ✅ Checklist for Production

Before launching:
- [ ] Registered UPI merchant account
- [ ] Configured production UPI ID
- [ ] Tested with real UPI apps
- [ ] Implemented payment webhooks
- [ ] Added transaction logging
- [ ] Set up payment reconciliation
- [ ] Enabled HTTPS
- [ ] Added security measures
- [ ] Configured email/SMS notifications
- [ ] Set up refund process
- [ ] Added payment analytics
- [ ] Tested payment failure scenarios
- [ ] Created payment policy/terms
- [ ] Compliance with local regulations
- [ ] Customer support for payment issues

---

## 🎉 Success!

Your Food Delivery App now supports UPI payments! Customers can pay instantly using any UPI app, making the checkout experience seamless and familiar to millions of users in India.

**Next Steps:**
1. Test thoroughly with different UPI apps
2. Get official merchant account
3. Implement automated payment verification
4. Launch and monitor transactions

**Questions?** Check the troubleshooting section or consult with your payment gateway provider.
