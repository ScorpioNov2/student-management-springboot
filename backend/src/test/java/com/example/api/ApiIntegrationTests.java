package com.example.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
	"JWT_SECRET=integration-test-secret-with-at-least-32-bytes",
	"DB_URL=jdbc:sqlite:target/api-integration-test.db",
	"logging.level.root=ERROR"
})
@AutoConfigureMockMvc
class ApiIntegrationTests {
	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private ObjectMapper objectMapper;

	@BeforeEach
	void clearDatabase() {
		jdbcTemplate.update("DELETE FROM students");
		jdbcTemplate.update("DELETE FROM refresh_tokens");
		jdbcTemplate.update("DELETE FROM users");
	}

	@Test
	void registrationRefreshAndRoleProtectedStudentCrud() throws Exception {
		MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"integration-user","email":"integration@example.test","password":"strong-password-123"}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.user.role").value("USER"))
				.andReturn();
		String userAccessToken = token(registerResult, "accessToken");
		String userRefreshToken = token(registerResult, "refreshToken");

		mockMvc.perform(get("/api/students").header("Authorization", "Bearer " + userAccessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0));

		mockMvc.perform(post("/api/students")
						.header("Authorization", "Bearer " + userAccessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"fullName":"Test Student","groupName":"A-1","isuId":12345,"dormitoryNumber":2,"roomNumber":"101","settlementTerm":"2027-05-31","foreigner":false}
								"""))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.status").value(403));

		MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(java.util.Map.of("refreshToken", userRefreshToken))))
				.andExpect(status().isOk())
				.andReturn();
		mockMvc.perform(post("/api/auth/refresh")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(java.util.Map.of("refreshToken", userRefreshToken))))
				.andExpect(status().isUnauthorized());

		jdbcTemplate.update("UPDATE users SET role = 'ADMIN' WHERE username = ?", "integration-user");
		MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"integration-user","password":"strong-password-123"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.role").value("ADMIN"))
				.andReturn();
		String adminAccessToken = token(adminLogin, "accessToken");

		MvcResult created = mockMvc.perform(post("/api/students")
						.header("Authorization", "Bearer " + adminAccessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"fullName":"Test Student","groupName":"A-1","isuId":12345,"dormitoryNumber":2,"roomNumber":"101","settlementTerm":"2027-05-31","foreigner":false}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.fullName").value("Test Student"))
				.andReturn();
		long studentId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/students")
						.param("groupName", "A-1")
						.param("search", "Test")
						.param("page", "0")
						.param("size", "5")
						.header("Authorization", "Bearer " + adminAccessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].id").value(studentId))
				.andExpect(jsonPath("$.totalPages").value(1));

		mockMvc.perform(post("/api/students")
						.header("Authorization", "Bearer " + adminAccessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"fullName":"Another Student","groupName":"A-1","isuId":12345,"dormitoryNumber":2,"roomNumber":"102","settlementTerm":"2027-05-31","foreigner":false}
								"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.status").value(409));

		mockMvc.perform(post("/api/students")
						.header("Authorization", "Bearer " + adminAccessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"fullName":"Student 123","groupName":"A-1","isuId":12346,"dormitoryNumber":2,"roomNumber":"102","settlementTerm":"2027-05-31","foreigner":false}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.validationErrors.fullName").exists());

		mockMvc.perform(patch("/api/students/{id}", studentId)
						.header("Authorization", "Bearer " + adminAccessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"roomNumber":"202"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.roomNumber").value("202"));

		mockMvc.perform(delete("/api/students/{id}", studentId)
						.header("Authorization", "Bearer " + adminAccessToken))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/students"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401));

		org.junit.jupiter.api.Assertions.assertNotNull(token(refreshed, "accessToken"));
	}

	private String token(MvcResult result, String field) throws Exception {
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
		return body.get(field).asText();
	}
}
