describe('Authentication Flow', () => {
  it('should successfully log in and redirect to dashboard', () => {
    cy.visit('/login');
    
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should show error on invalid credentials', () => {
    cy.visit('/login');
    
    cy.get('input[name="username"]').type('wronguser');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('be.visible').and('contain', 'Invalid credentials');
    cy.url().should('include', '/login');
  });
});
