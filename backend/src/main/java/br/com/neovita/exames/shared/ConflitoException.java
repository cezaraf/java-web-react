package br.com.neovita.exames.shared;

/** Conflito de negócio (409). {@code field} indica o campo em conflito, quando houver. */
public class ConflitoException extends RuntimeException {

	private final String field;

	public ConflitoException(String mensagem, String field) {
		super(mensagem);
		this.field = field;
	}

	public String getField() {
		return field;
	}
}
