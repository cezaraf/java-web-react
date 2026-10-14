package br.com.neovita.exames.exame;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;

import br.com.neovita.exames.exame.dto.ExameRequest;
import br.com.neovita.exames.exame.dto.ExameResponse;
import br.com.neovita.exames.grupo.Grupo;
import br.com.neovita.exames.grupo.GrupoRepository;
import br.com.neovita.exames.grupo.GrupoService;
import br.com.neovita.exames.shared.ConflitoException;
import br.com.neovita.exames.shared.RecursoNaoEncontradoException;
import jakarta.persistence.criteria.Predicate;

@Service
public class ExameService {

	private final ExameRepository repository;
	private final GrupoRepository grupoRepository;

	public ExameService(ExameRepository repository, GrupoRepository grupoRepository) {
		this.repository = repository;
		this.grupoRepository = grupoRepository;
	}

	@Transactional(readOnly = true)
	public Page<ExameResponse> listar(String q, Long grupoId, Pageable pageable) {
		return repository.findAll(busca(q, grupoId), pageable).map(ExameResponse::of);
	}

	@Transactional(readOnly = true)
	public ExameResponse buscar(Long id) {
		return ExameResponse.of(obter(id));
	}

	@Transactional
	public ExameResponse criar(ExameRequest request) {
		Grupo grupo = obterGrupo(request.grupoId());
		verificarUnicidade(request, null);
		Exame exame = new Exame();
		preencher(exame, request, grupo);
		return ExameResponse.of(repository.saveAndFlush(exame));
	}

	@Transactional
	public ExameResponse atualizar(Long id, ExameRequest request) {
		Exame exame = obter(id);
		Grupo grupo = obterGrupo(request.grupoId());
		verificarUnicidade(request, id);
		preencher(exame, request, grupo);
		return ExameResponse.of(repository.saveAndFlush(exame));
	}

	@Transactional
	public void excluir(Long id) {
		repository.delete(obter(id));
		repository.flush();
	}

	private static void preencher(Exame exame, ExameRequest request, Grupo grupo) {
		exame.setCodigo(request.codigo());
		exame.setNome(request.nome());
		exame.setTempoProcessamento(request.tempoProcessamento());
		exame.setGrupo(grupo);
	}

	private Exame obter(Long id) {
		return repository.findById(id)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Exame não encontrado."));
	}

	/** Grupo inexistente no corpo da requisição é erro de validação (400), não 404. */
	private Grupo obterGrupo(Long grupoId) {
		return grupoRepository.findById(grupoId).orElseThrow(() -> {
			ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
					"Um ou mais campos são inválidos.");
			problem.setProperty("errors", List.of(Map.of("field", "grupoId", "message", "Grupo não encontrado.")));
			return new ErrorResponseException(HttpStatus.BAD_REQUEST, problem, null);
		});
	}

	private void verificarUnicidade(ExameRequest request, Long id) {
		if (outro(repository.findByCodigoIgnoreCase(request.codigo()), id)) {
			throw new ConflitoException("Já existe um exame com este código.", "codigo");
		}
		if (outro(repository.findByNomeIgnoreCase(request.nome()), id)) {
			throw new ConflitoException("Já existe um exame com este nome.", "nome");
		}
	}

	private static boolean outro(Optional<Exame> existente, Long id) {
		return existente.filter(e -> !e.getId().equals(id)).isPresent();
	}

	private static Specification<Exame> busca(String q, Long grupoId) {
		return (root, query, cb) -> {
			List<Predicate> filtros = new ArrayList<>();
			if (q != null && !q.isBlank()) {
				String padrao = "%" + GrupoService.escaparLike(q.strip().toLowerCase(Locale.ROOT)) + "%";
				filtros.add(cb.or(
						cb.like(cb.lower(root.get("codigo")), padrao, '\\'),
						cb.like(cb.lower(root.get("nome")), padrao, '\\')));
			}
			if (grupoId != null) {
				filtros.add(cb.equal(root.get("grupo").get("id"), grupoId));
			}
			return cb.and(filtros.toArray(Predicate[]::new));
		};
	}
}
