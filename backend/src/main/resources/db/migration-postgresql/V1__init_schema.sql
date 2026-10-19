CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
);

CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    isu_id BIGINT NOT NULL,
    dormitory_number INTEGER NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    settlement_term DATE NOT NULL,
    is_foreigner BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL
);

CREATE INDEX idx_students_group_name ON students(group_name);
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
