package br.com.neovita.exames.exame.dto;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.Duration;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/** Duração em horas inteiras dentro de [{@link #min()}, {@link #max()}]. {@code null} é válido. */
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = HorasInteiras.Validator.class)
public @interface HorasInteiras {

	String message() default "Informe um número inteiro de horas.";

	long min();

	long max();

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<HorasInteiras, Duration> {

		private long min;
		private long max;

		@Override
		public void initialize(HorasInteiras anotacao) {
			min = anotacao.min();
			max = anotacao.max();
		}

		@Override
		public boolean isValid(Duration valor, ConstraintValidatorContext context) {
			if (valor == null) {
				return true;
			}
			return valor.getNano() == 0
					&& valor.getSeconds() % 3600 == 0
					&& valor.toHours() >= min
					&& valor.toHours() <= max;
		}
	}
}
