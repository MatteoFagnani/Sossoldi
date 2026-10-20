package com.financeapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = { "budget_id", "\"month\"", "\"year\"" })
})
public class BudgetOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", nullable = false)
    private Budget budget;

    @Column(nullable = true)
    private Double amount;

    @Column(name = "percentage_of_income", nullable = true)
    private Double percentageOfIncome;

    @Column(name = "\"month\"", nullable = false)
    private Integer month;

    @Column(name = "\"year\"", nullable = false)
    private Integer year;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
