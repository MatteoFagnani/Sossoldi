package com.financeapp.service.report;

import com.financeapp.dto.ReportDto;
import com.financeapp.model.User;
import java.time.LocalDate;

public interface ReportStrategy {
    ReportDto generateReport(User user, LocalDate startDate, LocalDate endDate);
}
