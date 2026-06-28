describe('Reports Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should generate and view a PDF report', () => {
    cy.visit('/reports');
    
    // Select report criteria
    cy.get('select[name="reportType"]').select('Sales Report');
    cy.get('input[name="startDate"]').type('2023-01-01');
    cy.get('input[name="endDate"]').type('2023-12-31');
    
    // Stub the PDF download/generation so cypress doesn't hang
    cy.intercept('GET', '**/api/reports/**', {
      statusCode: 200,
      body: 'mock-pdf-content'
    }).as('generateReport');

    cy.get('button').contains('Generate Report').click();

    // Verify API was called
    cy.wait('@generateReport');
    cy.get('.toast-success').should('contain', 'Report generated');
  });
});
