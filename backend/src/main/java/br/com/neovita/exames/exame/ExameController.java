package br.com.neovita.exames.exame;

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

import br.com.neovita.exames.exame.dto.ExameRequest;
import br.com.neovita.exames.exame.dto.ExameResponse;
import br.com.neovita.exames.shared.WebConfig;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/exames")
public class ExameController {

	private static final Set<String> ORDENACAO_PERMITIDA = Set.of("codigo", "nome", "tempoProcessamento",
			"grupo.nome");

	private final ExameService service;

	public ExameController(ExameService service) {
		this.service = service;
	}

	@GetMapping
	public Page<ExameResponse> listar(@RequestParam(required = false) String q,
			@RequestParam(required = false) Long grupoId,
			@PageableDefault(size = 20, sort = "nome") Pageable pageable) {
		WebConfig.validarPaginacao(pageable, ORDENACAO_PERMITIDA);
		return service.listar(q, grupoId, pageable);
	}

	@GetMapping("/{id}")
	public ExameResponse buscar(@PathVariable Long id) {
		return service.buscar(id);
	}

	@PostMapping
	public ResponseEntity<ExameResponse> criar(@Valid @RequestBody ExameRequest request) {
		ExameResponse criado = service.criar(request);
		return ResponseEntity.created(URI.create("/api/exames/" + criado.id())).body(criado);
	}

	@PutMapping("/{id}")
	public ExameResponse atualizar(@PathVariable Long id, @Valid @RequestBody ExameRequest request) {
		return service.atualizar(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable Long id) {
		service.excluir(id);
		return ResponseEntity.noContent().build();
	}
}
