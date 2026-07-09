package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    private Double stocksPercent;

    private Double bondsPercent;

    private Double governmentBondsPercent;

    private Double cashPercent;

    private Double otherPercent;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "investment_component", joinColumns = @JoinColumn(name = "investment_id"))
    private List<InvestmentComponent> components = new ArrayList<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "investment_snapshot", joinColumns = @JoinColumn(name = "investment_id"))
    private List<InvestmentSnapshot> snapshots = new ArrayList<>();

    private LocalDate lastUpdateDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
