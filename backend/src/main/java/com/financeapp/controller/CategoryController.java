package com.financeapp.controller;

import com.financeapp.dto.CategoryDto;
import com.financeapp.model.TransactionType;
import com.financeapp.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController extends BaseController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories(Authentication authentication) {
        return ResponseEntity.ok(categoryService.getAllCategories(getCurrentUser(authentication)));
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<List<CategoryDto>> seedDefaults(Authentication authentication) {
        categoryService.seedDefaultCategories(getCurrentUser(authentication));
        return ResponseEntity.ok(categoryService.getAllCategories(getCurrentUser(authentication)));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<CategoryDto>> getCategoriesByType(
            Authentication authentication,
            @PathVariable TransactionType type) {
        return ResponseEntity.ok(categoryService.getCategoriesByType(getCurrentUser(authentication), type));
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(
            Authentication authentication,
            @Valid @RequestBody CategoryDto categoryDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(getCurrentUser(authentication), categoryDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CategoryDto categoryDto) {
        return ResponseEntity.ok(categoryService.updateCategory(getCurrentUser(authentication), id, categoryDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            Authentication authentication,
            @PathVariable Long id) {
        categoryService.deleteCategory(getCurrentUser(authentication), id);
        return ResponseEntity.noContent().build();
    }
}
