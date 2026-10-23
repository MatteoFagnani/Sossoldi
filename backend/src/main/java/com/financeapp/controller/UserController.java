package com.financeapp.controller;

import com.financeapp.dto.ProfileUpdateRequest;
import com.financeapp.dto.UserDto;
import com.financeapp.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController extends BaseController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUserProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(getCurrentUser(authentication)));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(getCurrentUser(authentication), request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        userService.deleteAccount(getCurrentUser(authentication));
        AuthController.clearJwtCookie(request, response);
        return ResponseEntity.ok().build();
    }
}
