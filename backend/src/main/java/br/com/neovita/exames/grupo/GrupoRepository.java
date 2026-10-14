package br.com.neovita.exames.grupo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface GrupoRepository extends JpaRepository<Grupo, Long>, JpaSpecificationExecutor<Grupo> {

	Optional<Grupo> findByCodigoIgnoreCase(String codigo);

	Optional<Grupo> findByNomeIgnoreCase(String nome);

	@Query("select count(e) from Exame e where e.grupo.id = :grupoId")
	long contarExames(Long grupoId);
}
