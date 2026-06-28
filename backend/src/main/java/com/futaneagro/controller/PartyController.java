package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.service.DriverService;
import com.futaneagro.service.PartyService;
import com.futaneagro.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PartyController {

    @Autowired
    private PartyService partyService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private DriverService driverService;

    // --- Party Endpoints ---
    @GetMapping("/parties")
    public List<Party> getAllParties() {
        return partyService.getAllParties();
    }

    @PostMapping("/parties")
    public Party createParty(@Valid @RequestBody Party party) {
        return partyService.createParty(party);
    }

    @PutMapping("/parties/{id}")
    public Party updateParty(@PathVariable Integer id, @Valid @RequestBody Party details) {
        return partyService.updateParty(id, details);
    }

    @DeleteMapping("/parties/{id}")
    public void deleteParty(@PathVariable Integer id) {
        partyService.deleteParty(id);
    }

    // --- Vendor Endpoints ---
    @GetMapping("/vendors")
    public List<Vendor> getAllVendors() {
        return vendorService.getAllVendors();
    }

    @PostMapping("/vendors")
    public Vendor createVendor(@Valid @RequestBody Vendor vendor) {
        return vendorService.createVendor(vendor);
    }

    @PutMapping("/vendors/{id}")
    public Vendor updateVendor(@PathVariable Integer id, @Valid @RequestBody Vendor details) {
        return vendorService.updateVendor(id, details);
    }

    @DeleteMapping("/vendors/{id}")
    public void deleteVendor(@PathVariable Integer id) {
        vendorService.deleteVendor(id);
    }

    // --- Driver Endpoints ---
    @GetMapping("/drivers")
    public List<Driver> getAllDrivers() {
        return driverService.getAllDrivers();
    }

    @PostMapping("/drivers")
    public Driver createDriver(@RequestBody Driver driver) {
        return driverService.createDriver(driver);
    }

    @PutMapping("/drivers/{id}")
    public Driver updateDriver(@PathVariable Integer id, @RequestBody Driver details) {
        return driverService.updateDriver(id, details);
    }

    @DeleteMapping("/drivers/{id}")
    public void deleteDriver(@PathVariable Integer id) {
        driverService.deleteDriver(id);
    }
}
