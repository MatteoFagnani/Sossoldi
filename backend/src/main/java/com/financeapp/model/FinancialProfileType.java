package com.financeapp.model;

import lombok.Getter;

@Getter
public enum FinancialProfileType {
    STUDENT(
            "Studente / Fuorisede",
            "Entrate minime o assenti, focus sul contenimento del burn rate quotidiano e micro-fondo emergenze.",
            70.0,
            15.0,
            15.0,
            2.0,
            3.0
    ),
    BALANCED_50_30_20(
            "Lavoratore Standard (50/30/20)",
            "Reddito stabile mensile, equilibrio ideale tra bisogni essenziali, svago e accumulo investimenti.",
            50.0,
            30.0,
            20.0,
            3.0,
            6.0
    ),
    FREELANCER(
            "Freelance / Partita IVA",
            "Entrate irregolari e variabili, accantonamento preventivo tasse e cuscinetto di liquidità esteso.",
            60.0,
            20.0,
            20.0,
            6.0,
            12.0
    ),
    FIRE_SEEKER(
            "FIRE Seeker (Risparmio Aggressivo)",
            "Pensione anticipata e indipendenza finanziaria: tasso di risparmio oltre il 50% e PAC massivo.",
            35.0,
            15.0,
            50.0,
            6.0,
            12.0
    ),
    FAMILY(
            "Famiglia & Genitori",
            "Spese fisse e familiari elevate, mutuo/casa, fondo studi figli e protezione del nucleo familiare.",
            65.0,
            15.0,
            20.0,
            4.0,
            6.0
    ),
    DEBT_REPAYMENT(
            "Ripartenza & Ripianamento Debiti",
            "Azzeramento passività, stop alle spese voluttuarie ed estinzione accelerata dei finanziamenti.",
            70.0,
            10.0,
            20.0,
            1.0,
            2.0
    );

    private final String displayName;
    private final String description;
    private final double targetNeedsPercent;
    private final double targetWantsPercent;
    private final double targetSavingsPercent;
    private final double runwayMonthsMin;
    private final double runwayMonthsMax;

    FinancialProfileType(
            String displayName,
            String description,
            double targetNeedsPercent,
            double targetWantsPercent,
            double targetSavingsPercent,
            double runwayMonthsMin,
            double runwayMonthsMax) {
        this.displayName = displayName;
        this.description = description;
        this.targetNeedsPercent = targetNeedsPercent;
        this.targetWantsPercent = targetWantsPercent;
        this.targetSavingsPercent = targetSavingsPercent;
        this.runwayMonthsMin = runwayMonthsMin;
        this.runwayMonthsMax = runwayMonthsMax;
    }
}
