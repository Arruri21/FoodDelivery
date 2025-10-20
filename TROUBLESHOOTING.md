# 🔧 Troubleshooting Internal Server Error

## Quick Diagnosis

### Step 1: Test QR Code Generation
Open your browser and navigate to:
```
http://localhost:8080/api/test/qr?orderId=1&amount=100
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": 1,
  "amount": 100.0,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAA...",
  "message": "QR code generated successfully"
}
```

**If it fails**, you'll see:
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Exception class name"
}
```

### Step 2: Check Health Endpoint
```
http://localhost:8080/api/test/health
```

**Expected:**
```json
{
  "status": "UP",
  "message": "Test controller is working"
}
```

## Common Issues & Solutions

### 1. ZXing Library Not Found

**Error:** `NoClassDefFoundError: com/google/zxing/...`

**Solution:**
```bash
cd backend
./mvnw clean install -DskipTests
```

Then restart the server.

### 2. Application Properties Not Loading

**Error:** `Could not resolve placeholder 'upi.id'`

**Solution:** Ensure `application.properties` has:
```properties
upi.id=fooddelivery@paytm
upi.merchant.name=Food Delivery App
upi.merchant.code=5814
upi.currency=INR
upi.transaction.note.prefix=Order Payment -
```

### 3. MySQL Connection Issue

**Error:** `Communications link failure`

**Solution:**
Check if MySQL is running:
```bash
# Windows
net start MySQL80

# Or check if it's running
mysql -u root -p
```

Update credentials in `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fooddb
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 4. Port Already in Use

**Error:** `Port 8080 already in use`

**Solution:**
```bash
# Windows - Find and kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F

# Or change port in application.properties
server.port=8081
```

### 5. Order Creation Fails

**Error:** `NullPointerException` or validation errors

**Check:**
1. User exists in database
2. Restaurant exists
3. Menu items exist
4. Cart has valid items

### 6. QR Code Column Missing

**Error:** `Unknown column 'payment_qr_code'`

**Solution:**
The column should be auto-created by Hibernate. If not:

```sql
ALTER TABLE orders 
ADD COLUMN payment_status VARCHAR(20),
ADD COLUMN payment_qr_code VARCHAR(2000);
```

## Detailed Debugging Steps

### Check Backend Logs

Look for these messages in the console:

**Success:**
```
Generating QR code for order: 1, amount: 450.0
UPI String: upi://pay?pa=fooddelivery@paytm&pn=...
QR Code generated successfully for order: 1
```

**Failure:**
```
Failed to generate QR code for order 1
java.io.IOException: ...
  at com.example.backend.service.QRCodeService...
```

### Enable Debug Logging

Add to `application.properties`:
```properties
logging.level.com.example.backend=DEBUG
logging.level.org.springframework.web=DEBUG
```

### Check Frontend Console

Open browser DevTools (F12) and look for:

**Network Tab:**
- Check the POST request to `/api/orders`
- Look at the response status code
- View response body

**Console Tab:**
- Check for JavaScript errors
- Look for failed API calls

## Testing Checklist

- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 5173
- [ ] MySQL is running and accessible
- [ ] Database `fooddb` exists
- [ ] Tables are created (orders, users, restaurants, etc.)
- [ ] Test user exists (customer@food.com)
- [ ] Test restaurant and menu items exist
- [ ] ZXing libraries are in classpath
- [ ] application.properties is properly configured

## Manual Order Creation Test

### Using Postman or curl:

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "restaurantId": 1,
    "items": [
      {"menuItemId": 1, "quantity": 2}
    ],
    "deliveryAddress": "123 Test Street"
  }'
```

**Expected Response:**
```json
{
  "orderId": 1,
  "paymentQrCode": "data:image/png;base64,...",
  "paymentStatus": "PENDING"
}
```

## Emergency Workarounds

### Disable QR Code Temporarily

If QR generation is blocking orders, temporarily disable it:

In `OrderController.java`, comment out QR generation:
```java
Order savedOrder = orderService.save(order);

// TEMPORARY: Disable QR generation
/*
try {
    String qrCode = qrCodeService.generatePaymentQRCode(savedOrder.getId(), total);
    savedOrder.setPaymentQrCode(qrCode);
    orderService.save(savedOrder);
} catch (Exception e) {
    e.printStackTrace();
}
*/

return ResponseEntity.ok(Map.of(
    "orderId", savedOrder.getId(),
    "paymentQrCode", "", // Empty for now
    "paymentStatus", "PENDING"
));
```

### Use Test Mode in Frontend

Modify `PaymentModal.tsx` to work without QR:
```typescript
// Show placeholder if QR is missing
{qrCode ? (
  <img src={qrCode} alt="QR Code" />
) : (
  <p>QR code will appear here</p>
)}
```

## Get Help

### Collect This Information:

1. **Error Message:** (Full stack trace from console)
2. **Request Payload:** (What was sent to `/api/orders`)
3. **Response:** (What the server returned)
4. **Java Version:** `java -version`
5. **Maven Version:** `./mvnw -version`
6. **MySQL Status:** Running? Port?
7. **Browser Console:** Any JavaScript errors?

### Share Logs:

**Backend logs location:**
- Console output where you ran `./mvnw spring-boot:run`

**Frontend logs:**
- Browser DevTools Console (F12)
- Network tab showing failed requests

## Quick Fix Commands

```bash
# Rebuild everything
cd backend
./mvnw clean install -DskipTests
./mvnw spring-boot:run

# In another terminal
cd frontend
npm install
npm run dev

# Test the fix
curl http://localhost:8080/api/test/health
curl http://localhost:8080/api/test/qr
```

## Still Not Working?

Try this minimal test:

1. Stop both servers
2. Delete `backend/target` folder
3. Rebuild: `./mvnw clean package -DskipTests`
4. Check if `zxing` is in dependencies:
   ```bash
   ./mvnw dependency:tree | grep zxing
   ```
5. Should see:
   ```
   [INFO] +- com.google.zxing:core:jar:3.5.3:compile
   [INFO] +- com.google.zxing:javase:jar:3.5.3:compile
   ```
6. Restart backend
7. Test: `curl http://localhost:8080/api/test/qr`

---

**Need more help?** Share the exact error message and I'll provide specific solutions!
