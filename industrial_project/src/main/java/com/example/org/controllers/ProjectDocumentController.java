package com.example.org.controllers;

import com.example.org.entities.ProjectDocument;
import com.example.org.repositories.ProjectDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class ProjectDocumentController {

    @Autowired
    private ProjectDocumentRepository documentRepository;

    // Получение всех документов
    @GetMapping
    public ResponseEntity<?> getAllDocuments() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    // Добавление документа
    @PostMapping
    public ResponseEntity<?> addDocument(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required."));
        }

        ProjectDocument document = new ProjectDocument();
        document.setName(name);
        document.setDescription(description);

        documentRepository.save(document);
        return ResponseEntity.ok(Map.of("message", "Document added successfully."));
    }

    // Получение одного документа по ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long id) {
        ProjectDocument document = documentRepository.findById(id).orElse(null);
        if (document == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Document not found"));
        }
        return ResponseEntity.ok(document);
    }





    // Удаление документа
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Document not found."));
        }

        documentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
    }
}
