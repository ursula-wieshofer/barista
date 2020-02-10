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

import { DtTimeUnit } from '../../unit';
import { dtTransformResultWithOutputUnit } from '../duration-formatter-utils';
import { toDurationMode } from '../duration-formatter-constants';

describe('DtDurationFormatter', () => {
  interface Output {
    timeUnit: DtTimeUnit;
    duration: string;
  }

  interface TestCase {
    duration: number;
    inputUnit: DtTimeUnit;
    outputUnit: DtTimeUnit;
    formatMethod: string;
    outPut: Output[];
    displayedOutPut: string;
  }

  describe('dtTransformResultWithOutputUnit', () => {
    [
      {
        duration: 1,
        inputUnit: DtTimeUnit.MILLISECOND,
        outputUnit: DtTimeUnit.MILLISECOND,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.MILLISECOND,
            duration: '1',
          },
        ],
        displayedOutPut: '1 ms',
      },
      {
        duration: 1500,
        inputUnit: DtTimeUnit.MILLISECOND,
        outputUnit: DtTimeUnit.SECOND,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '1',
          },
        ],
        displayedOutPut: '1 s',
      },
      {
        duration: 150000001,
        inputUnit: DtTimeUnit.MILLISECOND,
        outputUnit: DtTimeUnit.SECOND,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '150000',
          },
        ],
        displayedOutPut: '150000 s',
      },
      {
        duration: 1,
        inputUnit: DtTimeUnit.HOUR,
        outputUnit: DtTimeUnit.SECOND,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '3600',
          },
        ],
        displayedOutPut: '3600 s',
      },
      {
        duration: 1,
        inputUnit: DtTimeUnit.NANOSECOND,
        outputUnit: DtTimeUnit.YEAR,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.YEAR,
            duration: '< 1',
          },
        ],
        displayedOutPut: '1 y',
      },
      {
        duration: 999,
        inputUnit: DtTimeUnit.MILLISECOND,
        outputUnit: DtTimeUnit.SECOND,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.SECOND,
            duration: '< 1',
          },
        ],
        displayedOutPut: '1 s',
      },
      {
        duration: 1,
        inputUnit: DtTimeUnit.MONTH,
        outputUnit: DtTimeUnit.YEAR,
        formatMethod: 'DEFAULT',
        outPut: [
          {
            timeUnit: DtTimeUnit.YEAR,
            duration: '< 1',
          },
        ],
        displayedOutPut: '1 y',
      },
    ].forEach((testCase: TestCase) => {
      it(`Duration '${testCase.duration}', input unit '${testCase.inputUnit}' should equal to '${testCase.displayedOutPut}'`, () => {
        const formatMethod = toDurationMode(testCase.formatMethod)!;
        const result = Array.from(
          dtTransformResultWithOutputUnit(
            testCase.duration,
            testCase.inputUnit,
            testCase.outputUnit,
            formatMethod,
          )!,
        );
        testCase.outPut.forEach((output: Output, index) => {
          expect(result[index]).toContain(output.timeUnit);
          expect(result[index]).toContain(output.duration);
        });
      });
    });
  });
});
