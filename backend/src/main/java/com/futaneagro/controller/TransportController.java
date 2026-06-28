package com.futaneagro.controller;

import com.futaneagro.entity.Transport;
import com.futaneagro.service.TransportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class TransportController {

    @Autowired
    private TransportService transportService;

    @GetMapping("/transports")
    public List<Transport> getAllTransports() {
        return transportService.getAllTransports();
    }

    @PostMapping("/transports")
    public Transport createTransport(@RequestBody Transport transport) {
        return transportService.createTransport(transport);
    }

    @PutMapping("/transports/{id}")
    public Transport updateTransport(@PathVariable Integer id, @RequestBody Transport details) {
        return transportService.updateTransport(id, details);
    }

    @DeleteMapping("/transports/{id}")
    public void deleteTransport(@PathVariable Integer id) {
        transportService.deleteTransport(id);
    }
}
