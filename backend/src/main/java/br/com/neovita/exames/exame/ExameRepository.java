package br.com.neovita.exames.exame;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExameRepository extends JpaRepository<Exame, Long>, JpaSpecificationExecutor<Exame> {

	@Override
	@EntityGraph(attributePaths = "grupo")
	Page<Exame> findAll(Specification<Exame> spec, Pageable pageable);

	@Override
	@EntityGraph(attributePaths = "grupo")
	Optional<Exame> findById(Long id);

	Optional<Exame> findByCodigoIgnoreCase(String codigo);

	Optional<Exame> findByNomeIgnoreCase(String nome);
}
