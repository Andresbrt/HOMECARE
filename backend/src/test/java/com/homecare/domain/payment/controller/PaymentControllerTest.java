package com.homecare.domain.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homecare.dto.PagoDTO;
import com.homecare.domain.payment.model.Pago;
import com.homecare.domain.payment.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("PaymentController — Tests de API y Seguridad")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @Test
    @DisplayName("Webhook Mercado Pago rechaza petición cuando la firma es inválida")
    void webhook_RechazaFirmaInvalida() throws Exception {
        PagoDTO.MercadoPagoWebhookEvent event = new PagoDTO.MercadoPagoWebhookEvent();
        event.setType("payment");
        event.setAction("payment.created");

        when(paymentService.validarFirmaWebhookMP(any(), any(), any())).thenReturn(false);

        mockMvc.perform(post("/api/payments/webhook/mercadopago")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(event))
                .header("x-signature", "ts=123,v1=invalidsig")
                .header("x-request-id", "req-123"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Firma inválida"));
    }

    @Test
    @DisplayName("Webhook Mercado Pago procesa correctamente cuando la firma es válida")
    void webhook_AceptaFirmaValida() throws Exception {
        PagoDTO.MercadoPagoWebhookEvent event = new PagoDTO.MercadoPagoWebhookEvent();
        event.setType("payment");
        event.setAction("payment.updated");

        when(paymentService.validarFirmaWebhookMP(any(), any(), any())).thenReturn(true);

        mockMvc.perform(post("/api/payments/webhook/mercadopago")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(event))
                .header("x-signature", "ts=123,v1=validsig")
                .header("x-request-id", "req-123"))
                .andExpect(status().isOk())
                .andExpect(content().string("Webhook procesado"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Admin puede listar pagos pendientes de liberación")
    void getPendingReleasePayments_AdminPermitido() throws Exception {
        mockMvc.perform(get("/api/payments/pending-release"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("Customer no tiene permiso para listar pagos pendientes de liberación (403 Forbidden)")
    void getPendingReleasePayments_CustomerDenegado() throws Exception {
        mockMvc.perform(get("/api/payments/pending-release"))
                .andExpect(status().isForbidden());
    }
}
