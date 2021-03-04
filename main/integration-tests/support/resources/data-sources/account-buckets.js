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

const _ = require('lodash');

const CollectionResource = require('../base/collection-resource');
const AccountBucket = require('./account-bucket');

class AccountBuckets extends CollectionResource {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'accounts',
      childType: 'account',
      childIdProp: 'id',
    });

    this.api = '/api/data-sources/accounts';
  }

  bucket(id) {
    return new AccountBucket({ clientSession: this.clientSession, id, parent: this });
  }

  // When creating a child resource, this method provides default values. This method is used by the
  // CollectionResource class when we use create() method on this resource operations helper.
  defaults(account = {}) {
    const gen = this.setup.gen;
    return {
      id: gen.accountId(),
      name: gen.string({ prefix: 'ds-acct-test' }),
      description: this.setup.gen.description(),
      mainRegion: 'us-east-1',
      ...account,
    };
  }

  // ************************ Helpers methods ************************
  async mustFind(id) {
    const buckets = await this.get();
    const bucket = _.find(buckets, buck => buck.id === id);

    if (_.isEmpty(bucket)) throw new Error(`Data source bucket with bucketId: "${id}" is not found`);
    return bucket;
  }

  reach(body) {
    const api = `${this.api}/ops/reachability`;

    return this.doCall(async () => this.axiosClient.post(api, body));
  }
}

module.exports = AccountBuckets;
