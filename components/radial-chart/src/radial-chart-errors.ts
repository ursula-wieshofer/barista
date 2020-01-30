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

export function getDtRadialChartInvalidHexColorValueError(
  value: string,
): Error {
  return Error(
    `The given color "${value}" is not a valid hexadecimal value.` +
      `Please prefix your value with a '#' and use 3- or 6-digit values` +
      `(only containing numbers and letters from A-F).`,
  );
}
