package com.sgiprocurement.repository;

import com.sgiprocurement.model.CostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CostCommentRepository extends JpaRepository<CostComment, Long> {

    List<CostComment> findByPoIdOrderByCreatedAtDesc(Long poId);

}
