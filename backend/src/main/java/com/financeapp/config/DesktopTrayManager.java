package com.financeapp.config;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Desktop;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.RenderingHints;
import java.awt.SystemTray;
import java.awt.TrayIcon;
import java.awt.image.BufferedImage;
import java.net.URI;

@Component
@Slf4j
@RequiredArgsConstructor
public class DesktopTrayManager {

    private final ConfigurableApplicationContext context;

    @Value("${server.port:10000}")
    private int serverPort;

    private TrayIcon trayIcon;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (GraphicsEnvironment.isHeadless() || !SystemTray.isSupported()) {
            return;
        }

        try {
            String baseUrl = "http://localhost:" + serverPort;
            PopupMenu popup = new PopupMenu();

            MenuItem openItem = new MenuItem("Apri Sossoldi (localhost:" + serverPort + ")");
            openItem.addActionListener(e -> openBrowser(baseUrl));

            MenuItem h2Item = new MenuItem("Console Database H2");
            h2Item.addActionListener(e -> openBrowser(baseUrl + "/h2-console"));

            MenuItem exitItem = new MenuItem("Ferma Sossoldi");
            exitItem.addActionListener(e -> {
                removeTrayIcon();
                Thread exitThread = new Thread(() -> {
                    int exitCode = SpringApplication.exit(context, () -> 0);
                    System.exit(exitCode);
                }, "sossoldi-shutdown");
                exitThread.setDaemon(false);
                exitThread.start();
            });

            popup.add(openItem);
            popup.add(h2Item);
            popup.addSeparator();
            popup.add(exitItem);

            Image image = createTrayImage();
            trayIcon = new TrayIcon(image, "Sossoldi - Finanze Personali (localhost:" + serverPort + ")", popup);
            trayIcon.setImageAutoSize(true);
            trayIcon.addActionListener(e -> openBrowser(baseUrl));

            SystemTray.getSystemTray().add(trayIcon);
            log.info("Icona System Tray attiva per Sossoldi su {}", baseUrl);
        } catch (Throwable e) {
            log.debug("Impossibile inizializzare System Tray: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void removeTrayIcon() {
        if (trayIcon != null) {
            try {
                SystemTray.getSystemTray().remove(trayIcon);
                trayIcon = null;
            } catch (Throwable ignored) {
            }
        }
    }

    private void openBrowser(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
            } else {
                new ProcessBuilder("cmd", "/c", "start", "", url).start();
            }
        } catch (Exception e) {
            log.warn("Impossibile aprire il browser su {}: {}", url, e.getMessage());
        }
    }

    private Image createTrayImage() {
        int size = 32;
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        g.setColor(new Color(17, 24, 39));
        g.fillRoundRect(0, 0, size, size, 8, 8);

        g.setColor(new Color(16, 185, 129));
        g.drawRoundRect(1, 1, size - 3, size - 3, 7, 7);

        g.setColor(Color.WHITE);
        Font font = new Font(Font.SANS_SERIF, Font.BOLD, 20);
        g.setFont(font);
        String symbol = "\u20AC";
        FontMetrics fm = g.getFontMetrics();
        int x = (size - fm.stringWidth(symbol)) / 2;
        int y = ((size - fm.getHeight()) / 2) + fm.getAscent();
        g.drawString(symbol, x, y);

        g.dispose();
        return image;
    }
}

