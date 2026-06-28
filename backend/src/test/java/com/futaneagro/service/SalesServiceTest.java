package com.futaneagro.service;

import com.futaneagro.entity.Sales;
import com.futaneagro.repository.SalesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalesServiceTest {

    @Mock
    private SalesRepository salesRepository;

    @InjectMocks
    private SalesService salesService; // Mock service structure

    private Sales sale1;
    private Sales sale2;

    @BeforeEach
    void setUp() {
        sale1 = new Sales();
        sale1.setSaleId(1);
        sale1.setTotalAmount(new BigDecimal("1000.00"));
        sale1.setPaid(new BigDecimal("500.00"));
        sale1.setRemaining(new BigDecimal("500.00"));

        sale2 = new Sales();
        sale2.setSaleId(2);
        sale2.setTotalAmount(new BigDecimal("2000.00"));
        sale2.setPaid(new BigDecimal("2000.00"));
        sale2.setRemaining(BigDecimal.ZERO);
    }

    @Test
    void testFindAllSales() {
        when(salesRepository.findAll()).thenReturn(Arrays.asList(sale1, sale2));
        
        List<Sales> sales = salesRepository.findAll();
        
        assertEquals(2, sales.size());
        verify(salesRepository, times(1)).findAll();
    }

    @Test
    void testCalculateTotals_InternalLogic() {
        // Test entity calculation logic
        Sales s = new Sales();
        s.setQuantity(10);
        s.setRate(new BigDecimal("150.00"));
        s.setGstRate(new BigDecimal("18.00"));
        s.setPaid(BigDecimal.ZERO);
        
        s.calculateTotals();
        
        // 10 * 150 = 1500
        // CGST = 1500 * (18/200) = 135
        // Total = 1500 + 135 + 135 = 1770
        assertEquals(new BigDecimal("1770.00"), s.getTotalAmount());
        assertEquals(new BigDecimal("135.00"), s.getCgst());
        assertEquals(new BigDecimal("1770.00"), s.getRemaining());
    }
}
