package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentType type;

    private String ticker;

    @Column(nullable = false)
    private Double currentValue;

    @Column(nullable = false)
    private Double investedCapital;

    private Double recurringAmount;

    private Integer recurringDay;

    @Column(nullable = false)
    private boolean pacActive;

    private LocalDate lastUpdateDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
