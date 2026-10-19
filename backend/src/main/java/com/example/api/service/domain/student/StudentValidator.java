package com.example.api.service.domain.student;

import com.example.api.dto.request.StudentPatchRequest;
import com.example.api.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class StudentValidator {
	private final StudentQueryService queryService;

	public StudentValidator(StudentQueryService queryService) {
		this.queryService = queryService;
	}

	public void validateCreateIsuId(long isuId) {
		if (queryService.existsByIsuId(isuId)) {
			throw new ApiException(HttpStatus.CONFLICT, "A student with this ISU ID already exists");
		}
	}

	public void validatePatchIsuId(long id, Long isuId) {
		if (isuId != null && queryService.existsByIsuIdAndNotId(isuId, id)) {
			throw new ApiException(HttpStatus.CONFLICT, "A student with this ISU ID already exists");
		}
	}

	public void validatePatch(StudentPatchRequest request) {
		if (request.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "At least one student field must be provided");
		}
		if (request.hasInvalidBlankText()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Text fields must not be blank");
		}
	}
}
