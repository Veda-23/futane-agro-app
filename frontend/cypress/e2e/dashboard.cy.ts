describe('Dashboard Validation', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should load key metrics on dashboard', () => {
    cy.visit('/dashboard');
    
    // Assert metric cards exist and hold a numeric value
    cy.get('.metric-card-sales').should('be.visible').and('not.be.empty');
    cy.get('.metric-card-inventory').should('be.visible');
    cy.get('.metric-card-production').should('be.visible');

    // Assert charts render (canvas elements exist)
    cy.get('canvas#salesChart').should('exist');
    cy.get('canvas#inventoryChart').should('exist');
  });

  it('should navigate via sidebar correctly', () => {
    cy.get('#sidebar-inventory').click();
    cy.url().should('include', '/inventory');

    cy.get('#sidebar-reports').click();
    cy.url().should('include', '/reports');
    
    cy.get('#sidebar-logout').click();
    cy.url().should('include', '/login');
  });
});
