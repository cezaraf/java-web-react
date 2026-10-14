package br.com.neovita.exames.shared;

import java.net.URI;
import java.util.List;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import tools.jackson.core.JacksonException;
import tools.jackson.core.exc.StreamReadException;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	/** Spring 7 deixa {@code type} nulo (omitido no JSON); a API sempre o expõe. */
	private static final URI TIPO_PADRAO = URI.create("about:blank");

	public record FieldError(String field, String message) {
	}

	@Override
	protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers, HttpStatusCode statusCode,
			WebRequest request) {
		if (body instanceof ProblemDetail problem && problem.getType() == null) {
			problem.setType(TIPO_PADRAO);
		}
		return super.createResponseEntity(body, headers, statusCode, request);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
				.toList();
		ProblemDetail problem = problema(HttpStatus.BAD_REQUEST,
				"Um ou mais campos são inválidos.");
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		ProblemDetail problem;
		String campo = campoInvalido(ex);
		if (campo != null) {
			problem = problema(HttpStatus.BAD_REQUEST, "Um ou mais campos são inválidos.");
			problem.setProperty("errors", List.of(new FieldError(campo, "Valor inválido.")));
		}
		else {
			problem = problema(HttpStatus.BAD_REQUEST, "Corpo da requisição malformado.");
		}
		return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
	}

	@ExceptionHandler(RecursoNaoEncontradoException.class)
	ProblemDetail handleNaoEncontrado(RecursoNaoEncontradoException ex) {
		return problema(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(ConflitoException.class)
	ProblemDetail handleConflito(ConflitoException ex) {
		ProblemDetail problem = problema(HttpStatus.CONFLICT, ex.getMessage());
		if (ex.getField() != null) {
			problem.setProperty("field", ex.getField());
		}
		return problem;
	}

	@ExceptionHandler(PropertyReferenceException.class)
	ProblemDetail handlePropriedadeInvalida(PropertyReferenceException ex) {
		return problema(HttpStatus.BAD_REQUEST,
				"Campo de ordenação inválido: " + ex.getPropertyName() + ".");
	}

	/** Garantia final de unicidade em concorrência: índices únicos {@code ux_<tabela>_<campo>}. */
	@ExceptionHandler(DataIntegrityViolationException.class)
	ProblemDetail handleIntegridade(DataIntegrityViolationException ex) {
		String restricao = nomeRestricao(ex);
		if (restricao != null && restricao.startsWith("ux_")) {
			String[] partes = restricao.split("_");
			String entidade = partes[1];
			String campo = partes[2];
			String artigo = "codigo".equals(campo) ? "este código" : "este nome";
			ProblemDetail problem = problema(HttpStatus.CONFLICT,
					"Já existe um " + entidade + " com " + artigo + ".");
			problem.setProperty("field", campo);
			return problem;
		}
		return problema(HttpStatus.CONFLICT,
				"A operação viola uma restrição de integridade dos dados.");
	}

	/** Qualquer erro não previsto também sai como ProblemDetail, sem expor detalhes internos. */
	@ExceptionHandler(Exception.class)
	ProblemDetail handleInesperado(Exception ex) {
		logger.error("Erro não tratado", ex);
		return problema(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno. Tente novamente mais tarde.");
	}

	private static ProblemDetail problema(HttpStatus status, String detalhe) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detalhe);
		problem.setType(TIPO_PADRAO);
		return problem;
	}

	private static String campoInvalido(Throwable ex) {
		for (Throwable t = ex; t != null; t = t.getCause()) {
			if (t instanceof JacksonException je && !(je instanceof StreamReadException) && !je.getPath().isEmpty()) {
				return je.getPath().getFirst().getPropertyName();
			}
		}
		return null;
	}

	private static String nomeRestricao(Throwable ex) {
		for (Throwable t = ex; t != null; t = t.getCause()) {
			if (t instanceof ConstraintViolationException cve && cve.getConstraintName() != null) {
				return cve.getConstraintName().toLowerCase();
			}
		}
		return null;
	}
}
