package br.com.neovita.exames;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@BeforeEach
	void limpar() {
		jdbc.execute("TRUNCATE exame, grupo RESTART IDENTITY CASCADE");
	}

	// ---------- grupos ----------

	@Test
	void criaGrupoNormalizandoCodigoENome() throws Exception {
		postJson("/api/grupos", "{\"codigo\":\" hem \",\"nome\":\"  Hematologia \"}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/grupos/1"))
				.andExpect(jsonPath("$.id").value(1))
				.andExpect(jsonPath("$.codigo").value("HEM"))
				.andExpect(jsonPath("$.nome").value("Hematologia"));
	}

	@Test
	void codigoSoComEspacosEhInvalido() throws Exception {
		postJson("/api/grupos", "{\"codigo\":\"   \",\"nome\":\"Hematologia\"}")
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.errors[0].field").value("codigo"))
				.andExpect(jsonPath("$.type").value("about:blank"))
				.andExpect(jsonPath("$.title").isString())
				.andExpect(jsonPath("$.instance").value("/api/grupos"));
	}

	@Test
	void nomeDeGrupoCom51CaracteresEhInvalido() throws Exception {
		postJson("/api/grupos", "{\"codigo\":\"HEM\",\"nome\":\"" + "a".repeat(51) + "\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value("nome"));
	}

	@Test
	void duplicidadeDeGrupoEhCaseInsensitive() throws Exception {
		criarGrupo("HEM", "Hematologia");
		postJson("/api/grupos", "{\"codigo\":\"hem\",\"nome\":\"Outro\"}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.field").value("codigo"))
				.andExpect(jsonPath("$.type").value("about:blank"))
				.andExpect(jsonPath("$.detail").value("Já existe um grupo com este código."));
		postJson("/api/grupos", "{\"codigo\":\"BIO\",\"nome\":\"HEMATOLOGIA\"}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.field").value("nome"));
	}

	@Test
	void edicaoIgnoraOProprioRegistroNaUnicidade() throws Exception {
		long id = criarGrupo("HEM", "Hematologia");
		long outro = criarGrupo("BIO", "Bioquímica");
		putJson("/api/grupos/" + id, "{\"codigo\":\"hem\",\"nome\":\"HEMATOLOGIA\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nome").value("HEMATOLOGIA"));
		putJson("/api/grupos/" + outro, "{\"codigo\":\"HEM\",\"nome\":\"Bioquímica\"}")
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.field").value("codigo"));
		putJson("/api/grupos/999", "{\"codigo\":\"X\",\"nome\":\"X\"}").andExpect(status().isNotFound());
	}

	@Test
	void criacoesSimultaneasComMesmoCodigoNuncaRetornam500() throws Exception {
		CountDownLatch largada = new CountDownLatch(1);
		List<CompletableFuture<Integer>> chamadas = List.of("A", "B").stream()
				.map(n -> CompletableFuture.supplyAsync(() -> {
					try {
						largada.await();
						return postJson("/api/grupos", "{\"codigo\":\"DUP\",\"nome\":\"Nome " + n + "\"}")
								.andReturn().getResponse().getStatus();
					}
					catch (Exception e) {
						throw new RuntimeException(e);
					}
				}))
				.toList();
		largada.countDown();
		List<Integer> status = chamadas.stream().map(CompletableFuture::join).sorted().toList();
		assertThat(status).containsExactly(201, 409);
		assertThat(jdbc.queryForObject("select count(*) from grupo", Long.class)).isEqualTo(1);
	}

	@Test
	void excluirGrupoComExamesRetorna409() throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		for (int i = 1; i <= 3; i++) {
			criarExame("EX" + i, "Exame " + i, "PT1H", grupo);
		}
		mvc.perform(delete("/api/grupos/" + grupo))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.detail")
						.value("Este grupo possui 3 exame(s) vinculado(s) e não pode ser excluído."));
		assertThat(jdbc.queryForObject("select count(*) from grupo", Long.class)).isEqualTo(1);
	}

	@Test
	void excluirGrupo() throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		mvc.perform(delete("/api/grupos/" + grupo)).andExpect(status().isNoContent());
		mvc.perform(delete("/api/grupos/" + grupo)).andExpect(status().isNotFound());
		mvc.perform(get("/api/grupos/" + grupo)).andExpect(status().isNotFound());
	}

	@Test
	void paginacaoEBuscaDeGrupos() throws Exception {
		for (int i = 1; i <= 25; i++) {
			criarGrupo("G%02d".formatted(i), "Grupo %02d".formatted(i));
		}
		mvc.perform(get("/api/grupos"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(20)))
				.andExpect(jsonPath("$.content[0].nome").value("Grupo 01"))
				.andExpect(jsonPath("$.page.size").value(20))
				.andExpect(jsonPath("$.page.number").value(0))
				.andExpect(jsonPath("$.page.totalElements").value(25))
				.andExpect(jsonPath("$.page.totalPages").value(2));
		mvc.perform(get("/api/grupos").param("page", "1"))
				.andExpect(jsonPath("$.content", hasSize(5)));
		mvc.perform(get("/api/grupos").param("q", "g1").param("sort", "codigo,desc"))
				.andExpect(jsonPath("$.page.totalElements").value(10))
				.andExpect(jsonPath("$.content[0].codigo").value("G19"));
		mvc.perform(get("/api/grupos").param("q", "%"))
				.andExpect(jsonPath("$.page.totalElements").value(0));
	}

	@Test
	void paginacaoInvalidaRetorna400() throws Exception {
		mvc.perform(get("/api/grupos").param("size", "500"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.type").value("about:blank"));
		mvc.perform(get("/api/grupos").param("size", "100")).andExpect(status().isOk());
		mvc.perform(get("/api/grupos").param("sort", "senha,asc")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/exames").param("sort", "grupo.id,asc")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/exames").param("grupoId", "abc")).andExpect(status().isBadRequest());
	}

	@Test
	void jsonMalformadoRetorna400SemErrors() throws Exception {
		postJson("/api/grupos", "{\"codigo\":")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors").doesNotExist());
	}

	// ---------- exames ----------

	@Test
	void tempoProcessamentoFazRoundTripComoIso8601() throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		String corpo = postJson("/api/exames", exameJson("hmg01", "Hemograma completo", "\"PT48H\"", grupo))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/exames/1"))
				.andExpect(jsonPath("$.codigo").value("HMG01"))
				.andExpect(jsonPath("$.grupo.nome").value("Hematologia"))
				.andReturn().getResponse().getContentAsString();
		assertThat(corpo).contains("\"tempoProcessamento\":\"PT48H\"");
		assertThat(jdbc.queryForObject("select tempo_processamento = interval '48 hours' from exame", Boolean.class))
				.isTrue();
		mvc.perform(get("/api/exames/1"))
				.andExpect(content().string(containsString("\"tempoProcessamento\":\"PT48H\"")));
	}

	@ParameterizedTest
	@ValueSource(strings = { "\"PT0H\"", "\"PT1H30M\"", "\"PT8761H\"", "\"48\"", "\"-PT2H\"", "\"abc\"", "48", "3600", "172800", "true" })
	void tempoProcessamentoInvalidoRetorna400(String valor) throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		postJson("/api/exames", exameJson("HMG01", "Hemograma", valor, grupo))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].field").value("tempoProcessamento"));
	}

	@Test
	void grupoInexistenteRetorna400() throws Exception {
		postJson("/api/exames", exameJson("HMG01", "Hemograma", "\"PT1H\"", 999))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].field").value("grupoId"))
				.andExpect(jsonPath("$.errors[0].message").value("Grupo não encontrado."));
	}

	@Test
	void duplicidadeDeExameEhCaseInsensitiveEGlobal() throws Exception {
		long hem = criarGrupo("HEM", "Hematologia");
		long bio = criarGrupo("BIO", "Bioquímica");
		criarExame("HMG01", "Hemograma completo", "PT48H", hem);
		postJson("/api/exames", exameJson("OUTRO", "HEMOGRAMA COMPLETO", "\"PT1H\"", bio))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.field").value("nome"));
		postJson("/api/exames", exameJson("hmg01", "Outro", "\"PT1H\"", bio))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.field").value("codigo"));
	}

	@Test
	void editaCodigoDoExame() throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		long id = criarExame("HMG01", "Hemograma completo", "PT48H", grupo);
		putJson("/api/exames/" + id, exameJson("HMG02", "Hemograma completo", "\"PT24H\"", grupo))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.codigo").value("HMG02"))
				.andExpect(jsonPath("$.tempoProcessamento").value("PT24H"));
		putJson("/api/exames/999", exameJson("X", "X", "\"PT1H\"", grupo)).andExpect(status().isNotFound());
	}

	@Test
	void buscaFiltroEOrdenacaoDeExames() throws Exception {
		long hem = criarGrupo("HEM", "Hematologia");
		long bio = criarGrupo("BIO", "Bioquímica");
		criarExame("HMG01", "Hemograma completo", "PT48H", hem);
		criarExame("RET", "Reticulócitos", "PT2H", hem);
		criarExame("HB", "Hemoglobina glicada", "PT4H", bio);
		mvc.perform(get("/api/exames").param("q", "HEMO").param("grupoId", String.valueOf(hem)))
				.andExpect(jsonPath("$.page.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].codigo").value("HMG01"));
		mvc.perform(get("/api/exames").param("q", "hemo"))
				.andExpect(jsonPath("$.page.totalElements").value(2));
		mvc.perform(get("/api/exames").param("sort", "tempoProcessamento,desc"))
				.andExpect(jsonPath("$.content[0].codigo").value("HMG01"));
		mvc.perform(get("/api/exames").param("sort", "grupo.nome,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].grupo.nome").value("Bioquímica"));
	}

	@Test
	void excluirExame() throws Exception {
		long grupo = criarGrupo("HEM", "Hematologia");
		long id = criarExame("HMG01", "Hemograma completo", "PT48H", grupo);
		mvc.perform(delete("/api/exames/" + id)).andExpect(status().isNoContent());
		mvc.perform(delete("/api/exames/" + id)).andExpect(status().isNotFound());
	}

	// ---------- helpers ----------

	private ResultActions postJson(String url, String json) throws Exception {
		return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions putJson(String url, String json) throws Exception {
		return mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long criarGrupo(String codigo, String nome) throws Exception {
		return id(postJson("/api/grupos", "{\"codigo\":\"%s\",\"nome\":\"%s\"}".formatted(codigo, nome))
				.andExpect(status().isCreated()));
	}

	private long criarExame(String codigo, String nome, String tempo, long grupoId) throws Exception {
		return id(postJson("/api/exames", exameJson(codigo, nome, "\"" + tempo + "\"", grupoId))
				.andExpect(status().isCreated()));
	}

	private static String exameJson(String codigo, String nome, String tempoJson, long grupoId) {
		return "{\"codigo\":\"%s\",\"nome\":\"%s\",\"tempoProcessamento\":%s,\"grupoId\":%d}"
				.formatted(codigo, nome, tempoJson, grupoId);
	}

	private static long id(ResultActions acao) throws Exception {
		return ((Number) JsonPath.read(acao.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
	}
}
