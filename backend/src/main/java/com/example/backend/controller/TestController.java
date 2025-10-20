package com.example.backend.controller;

import com.example.backend.service.QRCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final QRCodeService qrCodeService;

    public TestController(QRCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/qr")
    public ResponseEntity<?> testQRGeneration(@RequestParam(defaultValue = "1") Long orderId,
                                              @RequestParam(defaultValue = "100.00") Double amount) {
        try {
            String qrCode = qrCodeService.generatePaymentQRCode(orderId, amount);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", orderId,
                "amount", amount,
                "qrCode", qrCode,
                "message", "QR code generated successfully"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "details", e.getClass().getName()
            ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Test controller is working"
        ));
    }
}
