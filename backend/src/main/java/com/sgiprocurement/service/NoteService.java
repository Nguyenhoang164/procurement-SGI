package com.sgiprocurement.service;

import com.sgiprocurement.dto.NoteDTO;
import com.sgiprocurement.model.Note;
import com.sgiprocurement.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    public List<NoteDTO> getNotes(String entityType, Long entityId) {
        return noteRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public NoteDTO createNote(NoteDTO dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        Note note = new Note();
        note.setEntityType(dto.getEntityType());
        note.setEntityId(dto.getEntityId());
        note.setContent(dto.getContent());
        note.setCreatedBy(username);

        Note saved = noteRepository.save(note);
        return convertToDTO(saved);
    }

    private NoteDTO convertToDTO(Note note) {
        return new NoteDTO(
                note.getId(),
                note.getEntityType(),
                note.getEntityId(),
                note.getContent(),
                note.getCreatedBy(),
                note.getCreatedAt()
        );
    }
}
