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
            3.0,
            "Focus su contenimento del burn rate quotidiano, tracciamento uscite universitarie e costruzione di un micro-cuscinetto per imprevisti, senza pressione su investimenti aggressivi."
    ),
    BALANCED_50_30_20(
            "Lavoratore Standard (50/30/20)",
            "Reddito stabile mensile, equilibrio ideale tra bisogni essenziali, svago e accumulo investimenti.",
            50.0,
            30.0,
            20.0,
            3.0,
            6.0,
            "Approccio bilanciato classico di Elizabeth Warren: 50% bisogni primari, 30% desideri/svago, 20% risparmio e investimenti con fondo emergenza di 3-6 mesi."
    ),
    FREELANCER(
            "Freelance / Partita IVA",
            "Entrate irregolari e variabili, accantonamento preventivo tasse e cuscinetto di liquidità esteso.",
            60.0,
            20.0,
            20.0,
            6.0,
            12.0,
            "Income smoothing: entrate fluttuanti, gestione preventiva delle scadenze fiscali/INPS e necessità di un fondo emergenza solido di 6-12 mesi di spese vive."
    ),
    FIRE_SEEKER(
            "FIRE Seeker (Risparmio Aggressivo)",
            "Pensione anticipata e indipendenza finanziaria: tasso di risparmio oltre il 50% e PAC massivo.",
            35.0,
            15.0,
            50.0,
            6.0,
            12.0,
            "Movimento Financial Independence, Retire Early: massimizzazione del savings rate (>50%), eliminazione del superfluo e orientamento all'interesse composto in ETF/asset produttivi."
    ),
    FAMILY(
            "Famiglia & Genitori",
            "Spese fisse e familiari elevate, mutuo/casa, fondo studi figli e protezione del nucleo familiare.",
            65.0,
            15.0,
            20.0,
            4.0,
            6.0,
            "Focus sulla protezione e gestione di spese fisse alte per figli, casa, salute e scuola, abbinato a un fondo imprevisti robusto e tutela del futuro."
    ),
    DEBT_REPAYMENT(
            "Ripartenza & Ripianamento Debiti",
            "Azzeramento passività, stop alle spese voluttuarie ed estinzione accelerata dei finanziamenti.",
            70.0,
            10.0,
            20.0,
            1.0,
            2.0,
            "Debt-free framework: prioritizzazione assoluta dell'estinzione debiti e finanziamenti con metodo a valanga/neve, riducendo lo svago al minimo sostenibile."
    );

    private final String displayName;
    private final String description;
    private final double targetNeedsPercent;
    private final double targetWantsPercent;
    private final double targetSavingsPercent;
    private final double runwayMonthsMin;
    private final double runwayMonthsMax;
    private final String focusPrompt;

    FinancialProfileType(
            String displayName,
            String description,
            double targetNeedsPercent,
            double targetWantsPercent,
            double targetSavingsPercent,
            double runwayMonthsMin,
            double runwayMonthsMax,
            String focusPrompt) {
        this.displayName = displayName;
        this.description = description;
        this.targetNeedsPercent = targetNeedsPercent;
        this.targetWantsPercent = targetWantsPercent;
        this.targetSavingsPercent = targetSavingsPercent;
        this.runwayMonthsMin = runwayMonthsMin;
        this.runwayMonthsMax = runwayMonthsMax;
        this.focusPrompt = focusPrompt;
    }
}

