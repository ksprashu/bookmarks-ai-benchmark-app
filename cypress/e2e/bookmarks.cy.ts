describe('Bookmarks Feature', () => {
  beforeEach(() => {
    // Intercept the session call to wait for it
    cy.intercept('GET', '/api/auth/session').as('getSession');

    // Visit the page and sign in before each test
    cy.visit('/');
    cy.contains('button', 'Sign in').click();

    // Wait for the session to be established and the page to update
    cy.wait('@getSession');
    cy.get('h1', { timeout: 10000 }).should('contain', 'My Bookmarks');
  });

  it('should allow a user to add a bookmark and see it listed', () => {
    const url = `https://example.com/test-${Math.random()}`;
    const title = 'Test Bookmark';

    cy.get('input[placeholder="URL"]').type(url);
    cy.get('input[placeholder="Title (optional)"]').type(title);
    cy.contains('button', 'Add Bookmark').click();

    // Check that the new bookmark appears in the list
    cy.get('div', { timeout: 5000 }).should('contain', title);
    cy.get(`a[href="${url}"]`).should('be.visible');
  });

  it('should show a 429 error when the rate limit is exceeded', () => {
    // Intercept the API call to inspect its response
    cy.intercept('POST', '/api/bookmarks').as('createBookmark');

    const urlBase = `https://example.com/rate-limit-${Math.random()}`;

    // Send 6 requests in a row.
    // Cypress chains commands, so these will execute sequentially.
    for (let i = 1; i <= 6; i++) {
      cy.get('input[placeholder="URL"]').clear().type(`${urlBase}-${i}`);
      cy.get('input[placeholder="Title (optional)"]').clear().type(`Rate Test ${i}`);
      cy.contains('button', 'Add Bookmark').click();
      // Wait for the specific request to complete before starting the next loop
      cy.wait('@createBookmark');
    }

    // Now, check the status of the last (6th) interception
    cy.get('@createBookmark.all').then((interceptions) => {
      const lastInterception = interceptions[5];
      expect(lastInterception.response.statusCode).to.eq(429);
      expect(lastInterception.response.headers).to.have.property('retry-after');
    });
  });
});
