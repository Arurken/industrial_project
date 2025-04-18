package com.example.org.services;

import com.example.org.entities.ProjectDocument;
import com.example.org.repositories.ProjectDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class ProjectDocumentService {

    @Autowired
    private ProjectDocumentRepository documentRepository;

    // Получение всех документов
    public List<ProjectDocument> findAllDocuments() {
        return documentRepository.findAll();
    }

    // Сохранение документа
    public ProjectDocument saveDocument(String name, String description) {
        ProjectDocument document = new ProjectDocument();
        document.setName(name);
        document.setDescription(description);
        document.setCreatedAt(LocalDateTime.now());
        document.setUpdatedAt(LocalDateTime.now());
        return documentRepository.save(document);
    }


    // Удаление документа
    public boolean deleteDocument(Long id) {
        if (documentRepository.existsById(id)) {
            documentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
