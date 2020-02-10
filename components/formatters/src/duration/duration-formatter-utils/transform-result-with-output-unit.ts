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
import {
  CONVERSION_FACTORS_TO_MS,
  DurationMode,
} from '../duration-formatter-constants';
import { dtTransformResult } from './transform-result';
import { dtConvertToMilliseconds } from './convert-to-milliseconds';

/**
 * Calculates duration based on the outputUnit provided and presents the output only in that outputUnit.
 * @param duration numeric time value
 * @param inputUnit dtTimeUnit value describing which unit the duration is in
 * @param outputUnit dtTimeUnit | undefined value describing the unit to which it should format
 * @param formatMethod the formatting method
 */
export function dtTransformResultWithOutputUnit(
  duration: number,
  inputUnit: DtTimeUnit,
  outputUnit: DtTimeUnit | undefined,
  formatMethod: DurationMode,
): Map<DtTimeUnit, string> | undefined {
  let result = new Map<DtTimeUnit, string>();
  const conversionFactorKeys = Array.from(CONVERSION_FACTORS_TO_MS.keys());

  let amount;

  if (inputUnit === DtTimeUnit.MILLISECOND) {
    amount = duration;
  } else if (
    conversionFactorKeys.indexOf(inputUnit) <
    conversionFactorKeys.indexOf(DtTimeUnit.MILLISECOND)
  ) {
    amount = dtConvertToMilliseconds(duration, inputUnit);
  } else {
    amount = dtConvertToMilliseconds(duration, inputUnit);
  }

  if (outputUnit) {
    let factor = CONVERSION_FACTORS_TO_MS.get(outputUnit)!;
    if (formatMethod === 'PRECISE') {
      amount = amount / factor;
      return result.set(outputUnit, amount.toString());
    } else {
      amount = Math.trunc(amount / factor);
      if (amount < 1) {
        return result.set(outputUnit, '< 1');
      }
      return result.set(outputUnit, amount.toString());
    }
  } else {
    return dtTransformResult(
      duration,
      inputUnit,
      CONVERSION_FACTORS_TO_MS.size,
    );
  }
}
