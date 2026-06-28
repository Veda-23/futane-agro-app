describe('Invoice Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should generate an invoice for a sale', () => {
    cy.visit('/invoices');
    
    cy.get('h2').should('contain', 'Invoices');
    cy.get('button').contains('Generate Invoice').click();

    // Select sale
    cy.get('select[name="saleId"]').select('1');
    cy.get('button').contains('Generate').click();

    // Verify success
    cy.get('.toast-success').should('contain', 'Invoice generated successfully');
    cy.get('table').should('contain', 'INV-');
  });
});
