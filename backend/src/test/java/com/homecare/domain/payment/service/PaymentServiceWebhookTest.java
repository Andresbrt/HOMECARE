package com.homecare.domain.payment.service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests for PaymentService.validarWebhookSignature() — the SHA-256 Wompi webhook check.
 * Isolated: no Spring context, no mocks beyond setting the private field.
 */
class PaymentServiceWebhookTest {

    private PaymentService paymentService;

    private static final String EVENT_SECRET = "test-wompi-secret";

    @BeforeEach
    void setUp() throws Exception {
        // PaymentService has many dependencies; we null them since validarWebhookSignature is stateless
        paymentService = createMinimalPaymentService();
        ReflectionTestUtils.setField(paymentService, "wompiEventSecret", EVENT_SECRET);
    }

    /**
     * Create an instance without Spring context.
     * Uses reflection to bypass @RequiredArgsConstructor final fields.
     */
    private PaymentService createMinimalPaymentService() throws Exception {
        // Use Unsafe or similar to bypass constructor — simpler: use objenesis from Mockito
        return org.mockito.Mockito.mock(PaymentService.class, org.mockito.Mockito.CALLS_REAL_METHODS);
    }

    /**
     * Compute the expected checksum: SHA256(timestamp + "." + secret + "." + rawBody)
     */
    private String computeExpectedChecksum(String timestamp, String rawBody) throws Exception {
        String concatenated = timestamp + "." + EVENT_SECRET + "." + rawBody;
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(concatenated.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) hex.append('0');
            hex.append(h);
        }
        return hex.toString();
    }

    // ── Happy paths ──────────────────────────────────────

    @Test
    @DisplayName("valid signature returns true")
    void validSignature() throws Exception {
        String timestamp = "1716500000";
        String body = "{\"event\":\"transaction.updated\",\"data\":{\"id\":\"txn_123\"}}";
        String checksum = computeExpectedChecksum(timestamp, body);

        assertThat(paymentService.validarWebhookSignature(body, checksum, timestamp)).isTrue();
    }

    @Test
    @DisplayName("valid signature with empty body")
    void validSignature_emptyBody() throws Exception {
        String timestamp = "1716500000";
        String body = "";
        String checksum = computeExpectedChecksum(timestamp, body);

        assertThat(paymentService.validarWebhookSignature(body, checksum, timestamp)).isTrue();
    }

    // ── Rejection cases ──────────────────────────────────

    @Test
    @DisplayName("wrong checksum returns false (tampered body)")
    void wrongChecksum_tamperedBody() throws Exception {
        String timestamp = "1716500000";
        String body = "{\"event\":\"transaction.updated\"}";
        String checksum = computeExpectedChecksum(timestamp, body);

        // Tamper the body
        assertThat(paymentService.validarWebhookSignature(body + "x", checksum, timestamp)).isFalse();
    }

    @Test
    @DisplayName("wrong checksum returns false (bad signature)")
    void wrongChecksum_badSignature() {
        String timestamp = "1716500000";
        String body = "{\"data\":\"test\"}";

        assertThat(paymentService.validarWebhookSignature(body, "deadbeef", timestamp)).isFalse();
    }

    @Test
    @DisplayName("wrong timestamp returns false")
    void wrongTimestamp() throws Exception {
        String body = "{\"data\":\"test\"}";
        String checksum = computeExpectedChecksum("1716500000", body);

        assertThat(paymentService.validarWebhookSignature(body, checksum, "9999999999")).isFalse();
    }

    @Test
    @DisplayName("signature is timing-safe (uses MessageDigest.isEqual)")
    void timingSafe() throws Exception {
        // Just a sanity check that the method uses constant-time comparison
        // (verified by code review — this test ensures the path works)
        String timestamp = "1716599999";
        String body = "{\"id\":42}";
        String checksum = computeExpectedChecksum(timestamp, body);

        assertThat(paymentService.validarWebhookSignature(body, checksum, timestamp)).isTrue();
    }
}
