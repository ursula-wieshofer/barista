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

import { dtTransformResult } from '../duration-formatter-utils';
import { DtTimeUnit } from '../../unit';
import { DurationMode } from '../duration-formatter-constants';

describe('DtDurationformatter', () => {
  interface Output {
    timeUnit: DtTimeUnit;
    duration: string;
  }

  interface TestCase {
    duration: number;
    inputUnit: DtTimeUnit;
    formatMethod: DurationMode;
    outPut: Output[];
  }

  describe('dtTransformResult()', () => {
    [
      {
        duration: 1,
        inputUnit: DtTimeUnit.MILLISECOND,
        formatMethod: DurationMode.DEFAULT,
        outPut: [
          {
            timeUnit: DtTimeUnit.MILLISECOND,
            duration: '1',
          },
        ],
      },
      {
        duration: 1500,
        inputUnit: DtTimeUnit.MILLISECOND,
        formatMethod: DurationMode.DEFAULT,
        outPut: [
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '1',
          },
          {
            timeUnit: DtTimeUnit.MILLISECOND,
            duration: '500',
          },
        ],
      },
      {
        duration: 61500,
        inputUnit: DtTimeUnit.MILLISECOND,
        formatMethod: DurationMode.DEFAULT,
        outPut: [
          {
            timeUnit: DtTimeUnit.MINUTE,
            duration: '1',
          },
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '1',
          },
          {
            timeUnit: DtTimeUnit.MILLISECOND,
            duration: '500',
          },
        ],
      },
      {
        duration: 3601500,
        inputUnit: DtTimeUnit.MILLISECOND,
        formatMethod: DurationMode.DEFAULT,
        outPut: [
          {
            timeUnit: DtTimeUnit.HOUR,
            duration: '1',
          },
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '1',
          },
        ],
      },
    ].forEach((testCase: TestCase) => {
      it(`Duration '${testCase.duration}', input unit '${testCase.inputUnit}' should equal to '${testCase.formatMethod}'`, () => {
        const result = dtTransformResult(
          testCase.duration,
          testCase.inputUnit,
          testCase.formatMethod,
        );
        expect(result).not.toBeUndefined();
        testCase.outPut.forEach((outPut: Output, index) => {
          console.log(Array.from(result!)[index]);
          expect(Array.from(result!)[index]).toContain(outPut.timeUnit);
          expect(Array.from(result!)[index]).toContain(outPut.duration);
        });
      });
    });
  });
});
