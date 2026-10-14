package br.com.neovita.exames.shared;

import java.util.Set;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class WebConfig {

	public static final int TAMANHO_MAXIMO_PAGINA = 100;

	/**
	 * Valida explicitamente o tamanho da página e os campos de ordenação. O clamp silencioso de
	 * {@code max-page-size} não é usado: valores fora do permitido retornam 400.
	 */
	public static void validarPaginacao(Pageable pageable, Set<String> ordenacaoPermitida) {
		if (pageable.getPageSize() > TAMANHO_MAXIMO_PAGINA) {
			throw requisicaoInvalida("O tamanho da página deve ser no máximo " + TAMANHO_MAXIMO_PAGINA + ".");
		}
		for (Sort.Order ordem : pageable.getSort()) {
			if (!ordenacaoPermitida.contains(ordem.getProperty())) {
				throw requisicaoInvalida("Campo de ordenação inválido: " + ordem.getProperty() + ".");
			}
		}
	}

	private static ErrorResponseException requisicaoInvalida(String detalhe) {
		return new ErrorResponseException(HttpStatus.BAD_REQUEST,
				ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detalhe), null);
	}
}
