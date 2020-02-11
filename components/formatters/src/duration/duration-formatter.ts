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

import {
  DtFormattedValue,
  FormattedData,
  NO_DATA,
  SourceData,
} from '../formatted-value';
import { DtTimeUnit } from '../unit';
import {
  DurationMode,
  CONVERSION_FACTORS_TO_MS,
} from './duration-formatter-constants';
import {
  dtTransformResultWithOutputUnit,
  dtTransformResult,
} from './duration-formatter-utils';

/**
 * Formats a numeric value to a duration
 * @param duration numeric time value
 * @param formatMethod the formatting method
 * @param outputUnit dtTimeUnit | undefined value describing the unit to which it should format e.g to seconds
 * @param inputUnit dtTimeUnit value describing which unit the duration is in
 */
export function formatDuration(
  duration: number,
  formatMethod: DurationMode,
  outputUnit: DtTimeUnit | undefined,
  inputUnit: DtTimeUnit = DtTimeUnit.MILLISECOND,
): DtFormattedValue | string {
  const inputData: SourceData = {
    input: duration,
    unit: inputUnit,
  };
  let formattedData: FormattedData;
  let result: Map<DtTimeUnit, string> | undefined;

  if (duration <= 0 && formatMethod === 'DEFAULT') {
    return new DtFormattedValue(inputData, {
      transformedValue: inputData.input,
      displayValue: '< 1',
      displayUnit: inputUnit,
    });
  } else {
    if (outputUnit) {
      result = dtTransformResultWithOutputUnit(
        duration,
        inputUnit,
        outputUnit,
        formatMethod,
      );
    } else {
      result = dtTransformResult(duration, inputUnit, formatMethod);
    }
  }

  // Return NO_DATA when inputUnit is invalid
  if (CONVERSION_FACTORS_TO_MS.get(inputUnit) === undefined) {
    return NO_DATA;
  }
  if (result === undefined) {
    return NO_DATA;
  }
  let resultString = '';
  result.forEach((value, key) => {
    resultString = `${resultString}${value} ${key} `;
  });
  resultString = resultString.trim();
  formattedData = {
    transformedValue: inputData.input,
    displayValue: resultString,
    displayUnit: undefined,
  };
  return new DtFormattedValue(inputData, formattedData);
}
