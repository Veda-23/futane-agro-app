package com.futaneagro;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class SeleniumE2ETest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    public void setup() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless"); // Run in headless mode for CI/CD
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @Test
    public void testLoginAndDashboardNavigation() {
        // Navigate to frontend login page
        driver.get("http://localhost:4200/login");

        // Locate input fields
        WebElement usernameInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("username")));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement loginButton = driver.findElement(By.id("login-btn"));

        // Perform login
        usernameInput.sendKeys("admin");
        passwordInput.sendKeys("admin123");
        loginButton.click();

        // Verify successful login by checking for a Dashboard element
        WebElement dashboardHeader = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("dashboard-header")));
        assertTrue(dashboardHeader.isDisplayed(), "Dashboard should be visible after login");

        // Navigate to Sales
        WebElement salesMenu = driver.findElement(By.id("nav-sales"));
        salesMenu.click();
        
        // Wait for Sales table to load
        WebElement salesTable = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("sales-table")));
        assertTrue(salesTable.isDisplayed(), "Sales page should load");

        // Logout
        WebElement logoutButton = driver.findElement(By.id("logout-btn"));
        logoutButton.click();
        
        // Verify redirected to login
        wait.until(ExpectedConditions.urlContains("/login"));
    }

    @AfterEach
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
