package com.example.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    @Value("${upi.id:8125358163@ybl}")
    private String upiId;

    @Value("${upi.merchant.name:Arruri Bharath}")
    private String merchantName;

    @Value("${upi.merchant.code:5814}")
    private String merchantCode;

    @Value("${upi.currency:INR}")
    private String currency;

    @Value("${upi.transaction.note.prefix:Order Payment -}")
    private String transactionNotePrefix;

    /**
     * Generates a UPI payment QR code
     * @param orderId The order ID
     * @param amount The payment amount in rupees
     * @return Base64 encoded QR code image
     */
    public String generatePaymentQRCode(Long orderId, Double amount) throws WriterException, IOException {
        System.out.println("Generating QR code for order: " + orderId + ", amount: " + amount);
        
        if (orderId == null || amount == null || amount <= 0) {
            throw new IllegalArgumentException("Invalid order ID or amount");
        }
        
        // Generate UPI payment link following UPI deep linking standard
        String upiPaymentString = generateUPIPaymentString(orderId, amount);
        System.out.println("UPI String: " + upiPaymentString);
        
        return generateQRCodeImage(upiPaymentString, 300, 300);
    }

    /**
     * Generates UPI payment string according to NPCI UPI specification
     * Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&tn=<NOTE>&cu=<CURRENCY>&mc=<MERCHANT_CODE>
     */
    private String generateUPIPaymentString(Long orderId, Double amount) {
        StringBuilder upiString = new StringBuilder("upi://pay?");
        
        // Required parameters
        upiString.append("pa=").append(upiId); // Payee address (UPI ID)
        upiString.append("&pn=").append(encodeURIComponent(merchantName)); // Payee name
        upiString.append("&am=").append(String.format("%.2f", amount)); // Amount
        
        // Optional but recommended parameters
        String transactionNote = String.format("%s Order #%d", transactionNotePrefix, orderId);
        upiString.append("&tn=").append(encodeURIComponent(transactionNote)); // Transaction note
        upiString.append("&cu=").append(currency); // Currency
        
        if (merchantCode != null && !merchantCode.isEmpty()) {
            upiString.append("&mc=").append(merchantCode); // Merchant code
        }
        
        // Add order ID as reference for tracking
        upiString.append("&tr=").append("ORD").append(orderId); // Transaction reference
        
        return upiString.toString();
    }

    /**
     * URL encode a component for UPI string
     */
    private String encodeURIComponent(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8")
                    .replaceAll("\\+", "%20")
                    .replaceAll("\\%21", "!")
                    .replaceAll("\\%27", "'")
                    .replaceAll("\\%28", "(")
                    .replaceAll("\\%29", ")")
                    .replaceAll("\\%7E", "~");
        } catch (Exception e) {
            return value;
        }
    }

    /**
     * Generates a QR code image and returns it as Base64 encoded string
     */
    private String generateQRCodeImage(String data, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 1);
        
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height, hints);
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "PNG", outputStream);
        byte[] imageBytes = outputStream.toByteArray();
        
        // Return base64 encoded image with data URI prefix
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }
}
