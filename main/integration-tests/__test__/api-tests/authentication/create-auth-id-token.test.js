/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

const { runSetup } = require('../../../support/setup');
const errorCode = require('../../../support/utils/error-code');

describe('Create authentication token upon user login scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Creating an authentication token upon user login', () => {
    it('should fail if empty request body is passed', async () => {
      const researcherSession = await setup.createResearcherSession();

      await expect(researcherSession.resources.authentication.idTokens().request()).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should fail to perform operations using auth token of an inactive user', async () => {
      const { session, username, password } = await setup.createUserSession(
        { userRole: 'researcher' },
        { includeCreds: true },
      );
      const requestBody = {
        username,
        password,
        authenticationProviderId: 'internal',
      };

      // Since this is a new user not assigned to any study
      await expect(session.resources.studies.get()).resolves.toStrictEqual([]);

      // Perform user inactivation
      await adminSession.resources.users.deactivateUser(session.user);

      // Verify user can still get id-token (login operation)
      await expect(session.resources.authentication.idTokens().request(requestBody)).resolves.toHaveProperty('idToken');

      // Also verify user cannot perform operations as before
      await expect(session.resources.studies.get()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should provide auth token', async () => {
      const { session, username, password } = await setup.createUserSession(
        { userRole: 'researcher' },
        { includeCreds: true },
      );
      const requestBody = {
        username,
        password,
        authenticationProviderId: 'internal',
      };

      await expect(session.resources.authentication.idTokens().request(requestBody)).resolves.toHaveProperty('idToken');
    });
  });
});
