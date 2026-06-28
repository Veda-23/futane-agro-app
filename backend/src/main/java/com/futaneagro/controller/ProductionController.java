package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.service.PpmService;
import com.futaneagro.service.ProductionService;
import com.futaneagro.service.RawMaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductionController {

    @Autowired
    private ProductionService productionService;

    @Autowired
    private PpmService ppmService;

    @Autowired
    private RawMaterialService rawMaterialService;

    // --- PPD Endpoints ---
    @GetMapping("/ppd")
    public List<Ppd> getAllPpd() {
        return productionService.getAllPpd();
    }

    @PostMapping("/ppd")
    public Ppd createPpd(@RequestBody Ppd ppd) {
        return productionService.createPpd(ppd);
    }

    @DeleteMapping("/ppd/{id}")
    public void deletePpd(@PathVariable Integer id) {
        productionService.deletePpd(id);
    }

    // --- PPM Endpoints ---
    @GetMapping("/ppm")
    public List<Ppm> getAllPpm() {
        return ppmService.getAllPpm();
    }

    @PostMapping("/ppm")
    public Ppm createPpm(@RequestBody Ppm ppm) {
        return ppmService.createPpm(ppm);
    }

    @DeleteMapping("/ppm/{id}")
    public void deletePpm(@PathVariable Integer id) {
        ppmService.deletePpm(id);
    }

    // --- Raw Material Endpoints ---
    @GetMapping("/raw-materials")
    public List<RawMaterial> getAllRawMaterials() {
        return rawMaterialService.getAllRawMaterials();
    }

    @PostMapping("/raw-materials")
    public RawMaterial createRawMaterial(@RequestBody RawMaterial rawMaterial) {
        return rawMaterialService.createRawMaterial(rawMaterial);
    }

    @DeleteMapping("/raw-materials/{id}")
    public void deleteRawMaterial(@PathVariable Integer id) {
        rawMaterialService.deleteRawMaterial(id);
    }
}
