describe('Login Flow', () => {
  it('should display login page successfully', () => {
    cy.visit('/');
    cy.get('.login-container').should('exist');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="password"]').should('exist');
  });

  it('should authenticate and load dashboard with correct credentials', () => {
    cy.visit('/');
    cy.get('input[name="username"]').type('superadmin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button.login-button').click();

    // Verify successful login by checking for the dashboard container
    cy.get('.dashboard-container', { timeout: 10000 }).should('exist');
    cy.contains('Revenue').should('exist');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/');
    cy.get('input[name="username"]').type('invaliduser');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button.login-button').click();

    // The frontend alerts the user with an error message
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid credentials');
    });
  });
});
