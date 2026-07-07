package com.financeapp.service;

import com.financeapp.dto.CategoryDto;
import com.financeapp.exception.ResourceNotFoundException;
import com.financeapp.mapper.CategoryMapper;
import com.financeapp.model.Category;
import com.financeapp.model.TransactionType;
import com.financeapp.model.User;
import com.financeapp.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public void seedDefaultCategories(User user) {
        Category food = seedMacro("Alimentari", TransactionType.EXPENSE, "#f87171", user);
        seedSub(food, "Supermercato", "#ef4444", user);
        seedSub(food, "Discount", "#dc2626", user);
        seedSub(food, "Macelleria e pescheria", "#b91c1c", user);
        seedSub(food, "Farmacia alimentare", "#fb7185", user);

        Category restaurants = seedMacro("Bar e Ristoranti", TransactionType.EXPENSE, "#a78bfa", user);
        seedSub(restaurants, "Bar e caffe", "#8b5cf6", user);
        seedSub(restaurants, "Ristoranti", "#7c3aed", user);
        seedSub(restaurants, "Fast food", "#6d28d9", user);
        seedSub(restaurants, "Delivery", "#5b21b6", user);

        Category home = seedMacro("Casa", TransactionType.EXPENSE, "#facc15", user);
        seedSub(home, "Affitto e mutuo", "#eab308", user);
        seedSub(home, "Bollette luce gas acqua", "#ca8a04", user);
        seedSub(home, "Internet e telefono", "#a16207", user);
        seedSub(home, "Manutenzione casa", "#854d0e", user);
        seedSub(home, "Arredamento", "#713f12", user);

        Category transport = seedMacro("Trasporti", TransactionType.EXPENSE, "#fb923c", user);
        seedSub(transport, "Carburante", "#f97316", user);
        seedSub(transport, "Parcheggi", "#ea580c", user);
        seedSub(transport, "Pedaggi", "#c2410c", user);
        seedSub(transport, "Mezzi pubblici", "#9a3412", user);
        seedSub(transport, "Taxi e ride sharing", "#7c2d12", user);
        seedSub(transport, "Manutenzione auto", "#431407", user);

        Category shopping = seedMacro("Shopping", TransactionType.EXPENSE, "#818cf8", user);
        seedSub(shopping, "Abbigliamento", "#6366f1", user);
        seedSub(shopping, "Elettronica", "#4f46e5", user);
        seedSub(shopping, "Marketplace", "#4338ca", user);
        seedSub(shopping, "Cura persona", "#3730a3", user);

        Category health = seedMacro("Salute", TransactionType.EXPENSE, "#2dd4bf", user);
        seedSub(health, "Farmacia", "#14b8a6", user);
        seedSub(health, "Medici e visite", "#0d9488", user);
        seedSub(health, "Sport e benessere", "#0f766e", user);

        Category leisure = seedMacro("Intrattenimento", TransactionType.EXPENSE, "#4ade80", user);
        seedSub(leisure, "Streaming", "#22c55e", user);
        seedSub(leisure, "Cinema eventi", "#16a34a", user);
        seedSub(leisure, "Giochi e app", "#15803d", user);
        seedSub(leisure, "Abbonamenti", "#166534", user);

        Category travel = seedMacro("Viaggi", TransactionType.EXPENSE, "#06b6d4", user);
        seedSub(travel, "Hotel", "#0891b2", user);
        seedSub(travel, "Voli e treni", "#0e7490", user);
        seedSub(travel, "Noleggi", "#155e75", user);

        Category education = seedMacro("Istruzione", TransactionType.EXPENSE, "#f472b6", user);
        seedSub(education, "Universita", "#ec4899", user);
        seedSub(education, "Libri", "#db2777", user);
        seedSub(education, "Corsi", "#be185d", user);

        Category transfers = seedMacro("Bonifici", TransactionType.EXPENSE, "#64748b", user);
        seedSub(transfers, "Bonifici inviati", "#475569", user);
        seedSub(transfers, "Prelievi", "#334155", user);
        seedSub(transfers, "Commissioni bancarie", "#1e293b", user);

        Category otherExpense = seedMacro("Altro", TransactionType.EXPENSE, "#94a3b8", user);
        seedSub(otherExpense, "Da classificare", "#64748b", user);

        Category work = seedMacro("Lavoro", TransactionType.INCOME, "#10b981", user);
        seedSub(work, "Stipendio", "#059669", user);
        seedSub(work, "Tirocinio", "#047857", user);
        seedSub(work, "Bonus", "#065f46", user);
        seedSub(work, "Rimborsi lavoro", "#064e3b", user);

        Category gifts = seedMacro("Regali e rimborsi", TransactionType.INCOME, "#fbbf24", user);
        seedSub(gifts, "Regali", "#f59e0b", user);
        seedSub(gifts, "Rimborsi amici", "#d97706", user);
        seedSub(gifts, "Rimborsi fiscali", "#b45309", user);

        Category investments = seedMacro("Investimenti", TransactionType.INCOME, "#3b82f6", user);
        seedSub(investments, "Dividendi", "#2563eb", user);
        seedSub(investments, "Interessi", "#1d4ed8", user);
        seedSub(investments, "Vendite investimenti", "#1e40af", user);

        Category otherIncome = seedMacro("Altro", TransactionType.INCOME, "#94a3b8", user);
        seedSub(otherIncome, "Entrate varie", "#64748b", user);
    }

    private Category seedMacro(String name, TransactionType type, String color, User user) {
        return categoryRepository.save(createCategoryEntity(name, type, color, user, null));
    }

    private void seedSub(Category parent, String name, String color, User user) {
        categoryRepository.save(createCategoryEntity(name, parent.getType(), color, user, parent));
    }

    private Category createCategoryEntity(String name, TransactionType type, String color, User user, Category parent) {
        return Category.builder()
                .name(name)
                .type(type)
                .color(color)
                .user(user)
                .parent(parent)
                .build();
    }

    public List<CategoryDto> getAllCategories(User user) {
        return categoryRepository.findByUserId(user.getId())
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getCategoriesByType(User user, TransactionType type) {
        return categoryRepository.findByUserIdAndType(user.getId(), type)
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    public CategoryDto createCategory(User user, CategoryDto categoryDto) {
        if (categoryRepository.existsByNameAndUserId(categoryDto.getName(), user.getId())) {
            throw new IllegalArgumentException("A category with this name already exists");
        }

        Category category = categoryMapper.toEntity(categoryDto);
        category.setUser(user);
        category.setParent(resolveParent(categoryDto, user, null));

        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toDto(savedCategory);
    }

    public CategoryDto updateCategory(User user, Long id, CategoryDto categoryDto) {
        Category category = getCategoryAndVerifyOwner(id, user);

        if (!category.getName().equals(categoryDto.getName()) &&
                categoryRepository.existsByNameAndUserId(categoryDto.getName(), user.getId())) {
            throw new IllegalArgumentException("A category with this name already exists");
        }

        category.setName(categoryDto.getName());
        category.setType(categoryDto.getType());
        category.setColor(categoryDto.getColor());
        category.setParent(resolveParent(categoryDto, user, id));

        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.toDto(updatedCategory);
    }

    public void deleteCategory(User user, Long id) {
        Category category = getCategoryAndVerifyOwner(id, user);
        categoryRepository.delete(category);
    }

    public Category getCategoryAndVerifyOwner(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to access this category");
        }

        return category;
    }

    private Category resolveParent(CategoryDto dto, User user, Long currentId) {
        if (dto.getParentId() == null) {
            return null;
        }
        if (dto.getParentId().equals(currentId)) {
            throw new IllegalArgumentException("A category cannot be its own macro category");
        }

        Category parent = getCategoryAndVerifyOwner(dto.getParentId(), user);
        if (parent.getParent() != null) {
            throw new IllegalArgumentException("A subcategory cannot be used as a macro category");
        }
        if (parent.getType() != dto.getType()) {
            throw new IllegalArgumentException("Macro category type must match category type");
        }
        return parent;
    }
}
