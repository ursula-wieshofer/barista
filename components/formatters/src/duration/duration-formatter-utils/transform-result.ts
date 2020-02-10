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
  CONVERSIONUNITS,
  DurationMode,
} from '../duration-formatter-constants';

/**
 * Calculates output duration in either "DEFAULT" or "CUSTOM" mode.
 * If precision is DEFAULT or undefined then display a maximum of three units, but
 * when precision is a number(custom), then display that amount of units.
 * @param duration numeric time value
 * @param inputUnit dtTimeUnit value describing which unit the duration is in
 * @param formatMethod the formatting method
 */
export function dtTransformResult(
  duration: number,
  inputUnit: DtTimeUnit,
  formatMethod: DurationMode,
): Map<DtTimeUnit, string> | undefined {
  const result = new Map<DtTimeUnit, string>();
  const conversionFactorKeys = Array.from(CONVERSION_FACTORS_TO_MS.keys());

  let rest = duration * CONVERSION_FACTORS_TO_MS.get(inputUnit)!;
  let displayedUnits = 0;
  let unitsToDisplay = CONVERSIONUNITS;

  if (typeof formatMethod === 'number') {
    unitsToDisplay = formatMethod;
  }

  for (const key of conversionFactorKeys) {
    const factor = CONVERSION_FACTORS_TO_MS.get(key)!;
    let amount;
    if (key === DtTimeUnit.MICROSECOND) {
      rest = Math.round(rest * 1000000);
    }
    amount = Math.trunc(rest / factor);
    if (displayedUnits < unitsToDisplay) {
      if (amount > 0) {
        result.set(key, amount.toString());
        displayedUnits++;
      } else if (displayedUnits > 0) {
        displayedUnits++;
      }
    }
    rest = rest - amount * factor;
  }
  return result;
}

// 0.001001
