package br.com.neovita.exames.grupo.dto;

import br.com.neovita.exames.grupo.Grupo;

public record GrupoResponse(Long id, String codigo, String nome) {

	public static GrupoResponse of(Grupo grupo) {
		return new GrupoResponse(grupo.getId(), grupo.getCodigo(), grupo.getNome());
	}
}
