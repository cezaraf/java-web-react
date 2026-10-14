package br.com.neovita.exames.exame.dto;

import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.Locale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;

public record ExameRequest(
		@NotBlank(message = "Informe o código.")
		@Size(max = 10, message = "O código deve ter no máximo 10 caracteres.")
		String codigo,

		@NotBlank(message = "Informe o nome.")
		@Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
		String nome,

		@NotNull(message = "Informe o tempo de processamento.")
		@JsonDeserialize(using = DuracaoIso.class)
		@HorasInteiras(min = 1, max = 8760,
				message = "O tempo de processamento deve ser um número inteiro de horas entre 1 e 8760.")
		Duration tempoProcessamento,

		@NotNull(message = "Selecione o grupo.")
		Long grupoId) {

	public ExameRequest {
		codigo = codigo == null ? null : codigo.strip().toUpperCase(Locale.ROOT);
		nome = nome == null ? null : nome.strip();
	}

	/** Aceita apenas string ISO-8601: o Jackson padrão leria um número JSON como segundos. */
	static class DuracaoIso extends ValueDeserializer<Duration> {

		@Override
		public Duration deserialize(JsonParser p, DeserializationContext ctxt) {
			if (!p.hasToken(JsonToken.VALUE_STRING)) {
				return (Duration) ctxt.handleUnexpectedToken(Duration.class, p);
			}
			String texto = p.getString();
			try {
				return Duration.parse(texto);
			}
			catch (DateTimeParseException e) {
				return (Duration) ctxt.handleWeirdStringValue(Duration.class, texto, "esperado ISO-8601, ex.: PT48H");
			}
		}
	}
}
