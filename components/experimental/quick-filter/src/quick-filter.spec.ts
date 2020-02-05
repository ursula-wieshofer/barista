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

// tslint:disable no-lifecycle-call no-use-before-declare no-magic-numbers
// tslint:disable no-any max-file-line-count no-unbound-method use-component-selector

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  DtQuickFilter,
  DtQuickFilterModule,
} from '@dynatrace/barista-components/experimental/quick-filter';

import {
  createComponent,
  dispatchFakeEvent,
} from '@dynatrace/barista-components/testing';

describe('dt-quick-filter', () => {
  let fixture;
  let instanceDebugElement: DebugElement;
  let quickFilterInstance: DtQuickFilter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DtQuickFilterModule],
      declarations: [QuickFilterSimpleComponent],
    });
    TestBed.compileComponents();

    fixture = createComponent(QuickFilterSimpleComponent);
    instanceDebugElement = fixture.debugElement.query(
      By.directive(DtQuickFilter),
    );
    quickFilterInstance = instanceDebugElement.injector.get<DtQuickFilter>(
      DtQuickFilter,
    );
  });

  it('', () => {
    // quickFilterInstance.filters
  });
});

@Component({
  selector: 'dt-quick-filter-simple',
  template: `
    <dt-quick-filter></dt-quick-filter>
  `,
})
class QuickFilterSimpleComponent {}
