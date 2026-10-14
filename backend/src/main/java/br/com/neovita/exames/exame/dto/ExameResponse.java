package br.com.neovita.exames.exame.dto;

import java.time.Duration;

import br.com.neovita.exames.exame.Exame;

public record ExameResponse(Long id, String codigo, String nome, Duration tempoProcessamento,
		GrupoResumoResponse grupo) {

	public static ExameResponse of(Exame exame) {
		return new ExameResponse(exame.getId(), exame.getCodigo(), exame.getNome(), exame.getTempoProcessamento(),
				GrupoResumoResponse.of(exame.getGrupo()));
	}
}
