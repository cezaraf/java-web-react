package br.com.neovita.exames.grupo.dto;

import java.util.Locale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GrupoRequest(
		@NotBlank(message = "Informe o código.")
		@Size(max = 10, message = "O código deve ter no máximo 10 caracteres.")
		String codigo,

		@NotBlank(message = "Informe o nome.")
		@Size(max = 50, message = "O nome deve ter no máximo 50 caracteres.")
		String nome) {

	public GrupoRequest {
		codigo = codigo == null ? null : codigo.strip().toUpperCase(Locale.ROOT);
		nome = nome == null ? null : nome.strip();
	}
}
