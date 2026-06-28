describe('Sales Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to sales and add a new sale', () => {
    cy.visit('/sales');
    
    cy.get('h2').should('contain', 'Sales Management');
    cy.get('button').contains('Add Sale').click();

    // Fill form
    cy.get('input[name="quantity"]').type('100');
    cy.get('input[name="rate"]').type('250.50');
    cy.get('select[name="party"]').select('Party A');

    cy.get('button').contains('Save').click();

    // Verify success message or table update
    cy.get('.toast-success').should('contain', 'Sale added successfully');
    cy.get('table').should('contain', '100').and('contain', 'Party A');
  });
});
