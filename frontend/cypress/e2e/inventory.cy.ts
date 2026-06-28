describe('Inventory Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display inventory stock list', () => {
    cy.visit('/inventory');
    
    cy.get('h2').should('contain', 'Inventory Stock');
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should filter inventory based on search', () => {
    cy.visit('/inventory');
    
    cy.get('input[placeholder="Search..."]').type('Crate');
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).should('contain.text', 'Crate');
    });
  });
});
