package com.financeapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaWebController {

    @GetMapping(value = {
            "/login",
            "/register",
            "/dashboard",
            "/dashboard/**",
            "/analytics",
            "/analytics/**",
            "/categories",
            "/categories/**",
            "/transactions",
            "/transactions/**",
            "/wealth",
            "/wealth/**",
            "/investments",
            "/investments/**",
            "/budgets",
            "/budgets/**",
            "/profile",
            "/profile/**"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
