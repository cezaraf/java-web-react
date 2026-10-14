package br.com.neovita.exames.grupo;

import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.neovita.exames.grupo.dto.GrupoRequest;
import br.com.neovita.exames.grupo.dto.GrupoResponse;
import br.com.neovita.exames.shared.ConflitoException;
import br.com.neovita.exames.shared.RecursoNaoEncontradoException;

@Service
public class GrupoService {

	private final GrupoRepository repository;

	public GrupoService(GrupoRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Page<GrupoResponse> listar(String q, Pageable pageable) {
		return repository.findAll(busca(q), pageable).map(GrupoResponse::of);
	}

	@Transactional(readOnly = true)
	public GrupoResponse buscar(Long id) {
		return GrupoResponse.of(obter(id));
	}

	@Transactional
	public GrupoResponse criar(GrupoRequest request) {
		verificarUnicidade(request, null);
		Grupo grupo = new Grupo();
		grupo.setCodigo(request.codigo());
		grupo.setNome(request.nome());
		return GrupoResponse.of(repository.saveAndFlush(grupo));
	}

	@Transactional
	public GrupoResponse atualizar(Long id, GrupoRequest request) {
		Grupo grupo = obter(id);
		verificarUnicidade(request, id);
		grupo.setCodigo(request.codigo());
		grupo.setNome(request.nome());
		return GrupoResponse.of(repository.saveAndFlush(grupo));
	}

	@Transactional
	public void excluir(Long id) {
		Grupo grupo = obter(id);
		long exames = repository.contarExames(id);
		if (exames > 0) {
			throw new ConflitoException(
					"Este grupo possui " + exames + " exame(s) vinculado(s) e não pode ser excluído.", null);
		}
		repository.delete(grupo);
		repository.flush();
	}

	private Grupo obter(Long id) {
		return repository.findById(id)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Grupo não encontrado."));
	}

	private void verificarUnicidade(GrupoRequest request, Long id) {
		if (outro(repository.findByCodigoIgnoreCase(request.codigo()), id)) {
			throw new ConflitoException("Já existe um grupo com este código.", "codigo");
		}
		if (outro(repository.findByNomeIgnoreCase(request.nome()), id)) {
			throw new ConflitoException("Já existe um grupo com este nome.", "nome");
		}
	}

	private static boolean outro(Optional<Grupo> existente, Long id) {
		return existente.filter(g -> !g.getId().equals(id)).isPresent();
	}

	private static Specification<Grupo> busca(String q) {
		if (q == null || q.isBlank()) {
			return Specification.unrestricted();
		}
		String padrao = "%" + escaparLike(q.strip().toLowerCase(Locale.ROOT)) + "%";
		return (root, query, cb) -> cb.or(
				cb.like(cb.lower(root.get("codigo")), padrao, '\\'),
				cb.like(cb.lower(root.get("nome")), padrao, '\\'));
	}

	public static String escaparLike(String texto) {
		return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}
}
