package com.example.api.service.domain.user;

public record UserAccount(long id, String username, String email, String passwordHash, String role) {
}
