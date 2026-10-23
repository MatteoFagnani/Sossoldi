package com.financeapp.mapper;

import com.financeapp.dto.UserDto;
import com.financeapp.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .email(user.getEmail())
                .role(user.getRole())
                .financialProfile(user.getFinancialProfile())
                .build();
    }
}
