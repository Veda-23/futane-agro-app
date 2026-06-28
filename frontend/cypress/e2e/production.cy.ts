describe('Production Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should navigate to production and add PPD entry', () => {
    cy.visit('/production');
    
    // Switch to PPD tab if not default
    cy.get('button').contains('PPD').click();
    cy.get('button').contains('Add PPD').click();

    // Fill form
    cy.get('input[name="date"]').type('2024-01-01');
    cy.get('input[name="totalCrates"]').type('100');
    cy.get('input[name="successful"]').type('90');
    cy.get('input[name="failed"]').type('10');

    cy.get('button').contains('Save').click();

    // Verify success
    cy.get('.toast-success').should('contain', 'PPD entry added successfully');
    cy.get('table').should('contain', '100').and('contain', '90');
  });
});
