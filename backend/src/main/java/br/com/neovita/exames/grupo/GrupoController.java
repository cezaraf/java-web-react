package br.com.neovita.exames.grupo;

import java.net.URI;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.neovita.exames.grupo.dto.GrupoRequest;
import br.com.neovita.exames.grupo.dto.GrupoResponse;
import br.com.neovita.exames.shared.WebConfig;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/grupos")
public class GrupoController {

	private static final Set<String> ORDENACAO_PERMITIDA = Set.of("codigo", "nome");

	private final GrupoService service;

	public GrupoController(GrupoService service) {
		this.service = service;
	}

	@GetMapping
	public Page<GrupoResponse> listar(@RequestParam(required = false) String q,
			@PageableDefault(size = 20, sort = "nome") Pageable pageable) {
		WebConfig.validarPaginacao(pageable, ORDENACAO_PERMITIDA);
		return service.listar(q, pageable);
	}

	@GetMapping("/{id}")
	public GrupoResponse buscar(@PathVariable Long id) {
		return service.buscar(id);
	}

	@PostMapping
	public ResponseEntity<GrupoResponse> criar(@Valid @RequestBody GrupoRequest request) {
		GrupoResponse criado = service.criar(request);
		return ResponseEntity.created(URI.create("/api/grupos/" + criado.id())).body(criado);
	}

	@PutMapping("/{id}")
	public GrupoResponse atualizar(@PathVariable Long id, @Valid @RequestBody GrupoRequest request) {
		return service.atualizar(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable Long id) {
		service.excluir(id);
		return ResponseEntity.noContent().build();
	}
}
