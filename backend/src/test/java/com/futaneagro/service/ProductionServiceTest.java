package com.futaneagro.service;

import com.futaneagro.entity.Ppd;
import com.futaneagro.repository.PpdRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductionServiceTest {

    @Mock
    private PpdRepository ppdRepository;

    @InjectMocks
    private ProductionService productionService;

    private Ppd prod;

    @BeforeEach
    void setUp() {
        prod = new Ppd();
        prod.setId(1);
        prod.setDate(LocalDate.now());
        prod.setTotalCrates(100);
        prod.setSuccessful(95);
        prod.setFailed(5);
    }

    @Test
    void testGetAllProduction() {
        when(ppdRepository.findAll()).thenReturn(Arrays.asList(prod));
        
        List<Ppd> list = productionService.getAllPpd();
        
        assertEquals(1, list.size());
        assertEquals(95, list.get(0).getSuccessful());
        verify(ppdRepository, times(1)).findAll();
    }

    @Test
    void testSaveProduction() {
        when(ppdRepository.save(any(Ppd.class))).thenReturn(prod);
        
        Ppd saved = productionService.savePpd(prod);
        
        assertEquals(100, saved.getTotalCrates());
        verify(ppdRepository, times(1)).save(prod);
    }
}
