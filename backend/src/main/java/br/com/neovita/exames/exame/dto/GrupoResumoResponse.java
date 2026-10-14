package br.com.neovita.exames.exame.dto;

import br.com.neovita.exames.grupo.Grupo;

public record GrupoResumoResponse(Long id, String codigo, String nome) {

	public static GrupoResumoResponse of(Grupo grupo) {
		return new GrupoResumoResponse(grupo.getId(), grupo.getCodigo(), grupo.getNome());
	}
}
