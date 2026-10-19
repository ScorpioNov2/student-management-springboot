package com.example.api.config;

import com.example.api.exception.ApiError;
import com.example.api.security.JwtAuthenticationFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(
			JwtAuthenticationFilter jwtAuthenticationFilter) {
		FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(jwtAuthenticationFilter);
		registration.setEnabled(false);
		return registration;
	}

	@Bean
	org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
		return (request, response, exception) -> writeSecurityError(
				objectMapper, request.getRequestURI(), response, HttpStatus.UNAUTHORIZED, "Authentication is required");
	}

	@Bean
	org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
		return (request, response, exception) -> writeSecurityError(
				objectMapper, request.getRequestURI(), response, HttpStatus.FORBIDDEN, "Access is denied");
	}

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			JwtAuthenticationFilter jwtAuthenticationFilter,
			org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint,
			org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler)
			throws Exception {
		return http
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler))
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(
								"/api/auth/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**")
						.permitAll()
						.anyRequest()
						.authenticated())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	private static void writeSecurityError(
			ObjectMapper objectMapper,
			String path,
			jakarta.servlet.http.HttpServletResponse response,
			HttpStatus status,
			String message)
			throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(response.getOutputStream(), new ApiError(
				Instant.now(), status.value(), status.getReasonPhrase(), message, path, Map.of()));
	}
}
