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

describe('List study scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Getting all studies of a category', () => {
    it('should return empty list if category is not defined', async () => {
      const researcherSession = await setup.createResearcherSession();
      await expect(researcherSession.resources.studies.get()).resolves.toStrictEqual([]);
    });

    it('should fail if inactive user tries to list studies from any category', async () => {
      const researcherSession = await setup.createResearcherSession();
      await adminSession.resources.users.deactivateUser(researcherSession.user);

      await expect(researcherSession.resources.studies.getOpenData()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
      await expect(researcherSession.resources.studies.getMyStudies()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
      await expect(researcherSession.resources.studies.getOrganization()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      await expect(anonymousSession.resources.studies.getOpenData()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
      await expect(anonymousSession.resources.studies.getMyStudies()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
      await expect(anonymousSession.resources.studies.getOrganization()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });

    it('should return BYOB studies with Organization category', async () => {
      const researcherSession = await setup.createResearcherSession();
      const accountId = setup.gen.accountId();
      const defaultBucketBody = researcherSession.resources.dataSources.accounts.account(accountId).buckets.defaults();
      const studyId = setup.gen.string({ prefix: `get-studies-test-byob` });

      // Create a DS Account
      await researcherSession.resources.dataSources.accounts.create({ id: accountId });

      // Link a bucket to the DS Account
      await researcherSession.resources.dataSources.accounts
        .account(accountId)
        .buckets()
        .create(defaultBucketBody);

      await researcherSession.resources.dataSources.accounts
        .account(accountId)
        .buckets()
        .bucket(bucketId)
        .get()
        .studies.create({ id: studyId });

      await expect(researcherSession.resources.studies.getOrganization()).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ bucket: defaultBucketBody.name, id: studyId }),
          // {
          //   access: ['admin'],
          //   accountId: '644591511405',
          //   appRoleArn: 'arn:aws:iam::644591511405:role/swb-Lvl9dTe5cR8WAsnPP08nHD-app-1614956010367',
          //   awsPartition: 'aws',
          //   bucket: 'byob-data-source-bucket',
          //   bucketAccess: 'roles',
          //   category: 'Organization',
          //   createdAt: '2021-03-05T14:53:30.199Z',
          //   createdBy: 'u-c5Z2OuvzZM0Feif024Kul',
          //   folder: '/',
          //   id: 'bucket-is-study',
          //   kmsScope: 'bucket',
          //   name: 'bucket-is-study',
          //   projectId: 'TestProj',
          //   qualifier: 'swb-Lvl9dTe5cR8WAsnPP08nHD',
          //   region: 'us-east-1',
          //   rev: 0,
          //   status: 'reachable',
          //   statusAt: '2021-03-05T15:11:06.002Z',
          //   updatedAt: '2021-03-05T15:11:06.003Z',
          //   updatedBy: '_system_',
          // },
        ]),
      );
    });
  });
});
