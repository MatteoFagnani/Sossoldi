package com.financeapp.mapper;

import com.financeapp.dto.UserDto;
import com.financeapp.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}
