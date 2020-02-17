/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from '@angular/core';
import { DtFilterFieldDefaultDataSource } from '@dynatrace/barista-components/filter-field';
import { DATA } from '../../filter-field/filter-field';

@Component({
  selector: 'dt-e2e-quick-filter',
  templateUrl: 'quick-filter.html',
})
export class DtE2EQuickFilter {
  _dataSource = new DtFilterFieldDefaultDataSource(DATA[1]);

  switchToDataSource(targetIndex: number): void {
    this._dataSource = new DtFilterFieldDefaultDataSource(DATA[targetIndex]);
  }
}
