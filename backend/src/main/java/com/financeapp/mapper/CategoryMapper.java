package com.financeapp.mapper;

import com.financeapp.dto.CategoryDto;
import com.financeapp.model.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "parentName", source = "parent.name")
    CategoryDto toDto(Category category);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "transactions", ignore = true)
    Category toEntity(CategoryDto dto);
}
