package com.example.org.repositories;

import com.example.org.entities.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {
}
