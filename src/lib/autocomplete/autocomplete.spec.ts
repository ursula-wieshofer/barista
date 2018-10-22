import { OverlayContainer, } from '@angular/cdk/overlay';
import { Provider, Type, ViewChild, ViewChildren, QueryList, Component, OnDestroy, NgZone } from '@angular/core';
import { TestBed, inject, ComponentFixture, flush, fakeAsync, async, tick } from '@angular/core/testing';
import {
  DtAutocompleteModule,
  DtFormFieldModule,
  DtInputModule,
  DtAutocompleteTrigger,
  DtAutocomplete,
  DtFormField,
  DtOption,
  DT_AUTOCOMPLETE_DEFAULT_OPTIONS,
  DtOptionSelectionChange,
  getDtAutocompleteMissingPanelError
} from '@dynatrace/angular-components';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DOWN_ARROW, SPACE, UP_ARROW, ENTER, ESCAPE, TAB } from '@angular/cdk/keycodes';
import { Subscription, Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { dispatchFakeEvent, dispatchKeyboardEvent, dispatchEvent } from '../../testing/dispatch-events';
import { MockNgZone } from '../../testing/mock-ng-zone';
import { typeInElement } from '../../testing/type-in-element';
import { createKeyboardEvent } from '../../testing/event-objects';

// tslint:disable:no-any no-magic-numbers max-file-line-count

describe('DtAutocomplete', () => {
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;
  let zone: MockNgZone;

  // Creates a test component fixture.
  function createComponent<T>(component: Type<T>, providers: Provider[] = []): any {
    TestBed.configureTestingModule({
      imports: [
        DtAutocompleteModule,
        DtFormFieldModule,
        DtInputModule,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      declarations: [component],
      providers: [
        { provide: NgZone, useFactory: () => zone = new MockNgZone() },
        ...providers,
      ],
    });

    TestBed.compileComponents();

    inject([OverlayContainer], (oc: OverlayContainer) => {
      overlayContainer = oc;
      overlayContainerElement = oc.getContainerElement();
    })();

    return TestBed.createComponent<T>(component);
  }

  afterEach(inject([OverlayContainer], (currentOverlayContainer: OverlayContainer) => {
    // Since we're resetting the testing module in some of the tests,
    // we can potentially have multiple overlay containers.
    currentOverlayContainer.ngOnDestroy();
    overlayContainer.ngOnDestroy();
  }));

  describe('panel toggling', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;
    let input: HTMLInputElement;

    beforeEach(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();
      input = fixture.debugElement.query(By.css('input')).nativeElement;
    });

    it('should open the panel when the input is focused', () => {
      expect(fixture.componentInstance.trigger.panelOpen).toBe(false, `Expected panel state to start out closed.`);

      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(true, `Expected panel state to read open when input is focused.`);
      expect(overlayContainerElement.textContent)
        .toContain('Alabama', `Expected panel to display when input is focused.`);
      expect(overlayContainerElement.textContent)
        .toContain('California', `Expected panel to display when input is focused.`);
    });

    it('should not open the panel on focus if the input is readonly', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;
      input.readOnly = true;
      fixture.detectChanges();

      expect(trigger.panelOpen).toBe(false, 'Expected panel state to start out closed.');
      dispatchFakeEvent(input, 'focusin');
      flush();

      fixture.detectChanges();
      expect(trigger.panelOpen).toBe(false, 'Expected panel to stay closed.');
    }));

    it('should not open using the arrow keys when the input is readonly', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;
      input.readOnly = true;
      fixture.detectChanges();

      expect(trigger.panelOpen).toBe(false, 'Expected panel state to start out closed.');
      dispatchKeyboardEvent(input, 'keydown', DOWN_ARROW);
      flush();

      fixture.detectChanges();
      expect(trigger.panelOpen).toBe(false, 'Expected panel to stay closed.');
    }));

    it('should open the panel programmatically', () => {
      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected panel state to start out closed.`);

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(true, `Expected panel state to read open when opened programmatically.`);
      expect(overlayContainerElement.textContent)
        .toContain('Alabama', `Expected panel to display when opened programmatically.`);
      expect(overlayContainerElement.textContent)
        .toContain('California', `Expected panel to display when opened programmatically.`);
    });

    it('should show the panel when the first open is after the initial zone stabilization', async(() => {
      // Note that we're running outside the Angular zone, in order to be able
      // to test properly without the subscription from `_subscribeToClosingActions`
      // giving us a false positive.
      fixture.ngZone!.runOutsideAngular(() => {
        fixture.componentInstance.trigger.openPanel();

        Promise.resolve().then(() => {
          expect(fixture.componentInstance.panel.showPanel).toBe(true, `Expected panel to be visible.`);
        });
      });
    }));

    it('should close the panel when the user clicks away', fakeAsync(() => {
      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();
      zone.simulateZoneExit();
      dispatchFakeEvent(document, 'click');

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected clicking outside the panel to set its state to closed.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected clicking outside the panel to close the panel.`);
    }));

    it('should close the panel when the user taps away on a touch device', fakeAsync(() => {
      dispatchFakeEvent(input, 'focus');
      fixture.detectChanges();
      flush();
      dispatchFakeEvent(document, 'touchend');

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected tapping outside the panel to set its state to closed.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected tapping outside the panel to close the panel.`);
    }));

    it('should close the panel when an option is clicked', fakeAsync(() => {
      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();
      zone.simulateZoneExit();

      const option = overlayContainerElement.querySelector('dt-option') as HTMLElement;
      option.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected clicking an option to set the panel state to closed.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected clicking an option to close the panel.`);
    }));

    it('should close the panel when a newly created option is clicked', fakeAsync(() => {
      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();
      zone.simulateZoneExit();

      // Filter down the option list to a subset of original options ('Alabama', 'California')
      typeInElement('al', input);
      fixture.detectChanges();
      tick();

      let options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[0].click();

      // Changing value from 'Alabama' to 'al' to re-populate the option list,
      // ensuring that 'California' is created new.
      dispatchFakeEvent(input, 'focusin');
      typeInElement('al', input);
      fixture.detectChanges();
      tick();

      options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected clicking a new option to set the panel state to closed.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected clicking a new option to close the panel.`);
    }));

    it('should close the panel programmatically', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected closing programmatically to set the panel state to closed.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected closing programmatically to close the panel.`);
    });

    it('should not throw when attempting to close the panel of a destroyed autocomplete', () => {
      const trigger = fixture.componentInstance.trigger;

      trigger.openPanel();
      fixture.detectChanges();
      fixture.destroy();

      expect(() => trigger.closePanel()).not.toThrow();
    });

    it('should hide the panel when the options list is empty', fakeAsync(() => {
      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();

      const panel = overlayContainerElement.querySelector('.dt-autocomplete-panel') as HTMLElement;

      expect(panel.classList).toContain('dt-autocomplete-visible', `Expected panel to start out visible.`);

      // Filter down the option list such that no options match the value
      typeInElement('af', input);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(panel.classList).toContain('dt-autocomplete-hidden', `Expected panel to hide itself when empty.`);
    }));

    it('should not open the panel when the `input` event is invoked on a non-focused input', () => {
      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected panel state to start out closed.`);

      input.value = 'Alabama';
      dispatchFakeEvent(input, 'input');
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected panel state to stay closed.`);
    });

    it('should toggle the visibility when typing and closing the panel', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      tick();
      fixture.detectChanges();

      expect(overlayContainerElement.querySelector('.dt-autocomplete-panel')!.classList)
        .toContain('dt-autocomplete-visible', 'Expected panel to be visible.');

      typeInElement('x', input);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(overlayContainerElement.querySelector('.dt-autocomplete-panel')!.classList)
        .toContain('dt-autocomplete-hidden', 'Expected panel to be hidden.');

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      typeInElement('al', input);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(overlayContainerElement.querySelector('.dt-autocomplete-panel')!.classList)
        .toContain('dt-autocomplete-visible', 'Expected panel to be visible.');
    }));

    it('should provide the open state of the panel', fakeAsync(() => {
      expect(fixture.componentInstance.panel.isOpen).toBeFalsy(`Expected the panel to be unopened initially.`);

      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();
      flush();

      expect(fixture.componentInstance.panel.isOpen).toBeTruthy(`Expected the panel to be opened on focus.`);
    }));

    it('should emit an event when the panel is opened', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.openedSpy).toHaveBeenCalled();
    });

    it('should not emit the `opened` event when no options are being shown', () => {
      fixture.componentInstance.filteredStates = fixture.componentInstance.states = [];
      fixture.detectChanges();

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.openedSpy).not.toHaveBeenCalled();
    });

    it('should not emit the opened event multiple times while typing', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.openedSpy).toHaveBeenCalledTimes(1);

      typeInElement('Alabam', input);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.componentInstance.openedSpy).toHaveBeenCalledTimes(1);
    }));

    it('should emit an event when the panel is closed', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.closedSpy).toHaveBeenCalled();
    });

    it('should not emit the `closed` event when no options were shown', () => {
      fixture.componentInstance.filteredStates = fixture.componentInstance.states = [];
      fixture.detectChanges();

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();

      expect(fixture.componentInstance.closedSpy).not.toHaveBeenCalled();
    });

    it('should not be able to open the panel if the autocomplete is disabled', () => {
      expect(fixture.componentInstance.trigger.panelOpen).toBe(false, `Expected panel state to start out closed.`);

      fixture.componentInstance.autocompleteDisabled = true;
      fixture.detectChanges();

      dispatchFakeEvent(input, 'focusin');
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen).toBe(false, `Expected panel to remain closed.`);
    });
  });

  it('should be able to set a custom value for the `autocomplete` attribute', () => {
    const fixture = createComponent(AutocompleteWithNativeAutocompleteAttribute);
    const input = fixture.nativeElement.querySelector('input');

    fixture.detectChanges();

    expect(input.getAttribute('autocomplete')).toBe('changed');
  });

  it('should not throw when typing in an element with a null and disabled autocomplete', () => {
    const fixture = createComponent(InputWithoutAutocompleteAndDisabled);
    fixture.detectChanges();

    expect(() => {
      dispatchKeyboardEvent(fixture.nativeElement.querySelector('input'), 'keydown', SPACE);
      fixture.detectChanges();
    }).not.toThrow();
  });

  describe('forms integration', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;
    let input: HTMLInputElement;

    beforeEach(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();

      input = fixture.debugElement.query(By.css('input')).nativeElement;
    });

    it('should update control value as user types with input value', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      typeInElement('a', input);
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.value).toEqual('a', 'Expected control value to be updated as user types.');

      typeInElement('al', input);
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.value).toEqual('al', 'Expected control value to be updated as user types.');
    });

    it('should update control value when option is selected with option value', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.value)
        .toEqual({ code: 'CA', name: 'California' }, 'Expected control value to equal the selected option value.');
    }));

    it('should update the control back to a string if user types after an option is selected', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const options =
        overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      typeInElement('Californi', input);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.stateCtrl.value)
        .toEqual('Californi', 'Expected control value to revert back to string.');
    }));

    it('should fill the text field with display value when an option is selected', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const options =
        overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      expect(input.value)
        .toContain('California', `Expected text field to fill with selected value.`);
    }));

    it('should fill the text field with value if displayWith is not set', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      fixture.componentInstance.panel.displayWith = null;
      fixture.componentInstance.options.toArray()[1].value = 'test value';
      fixture.detectChanges();

      const options =
        overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();

      fixture.detectChanges();
      expect(input.value)
        .toContain('test value', `Expected input to fall back to selected option's value.`);
    }));

    it('should fill the text field correctly if value is set to obj programmatically', fakeAsync(() => {
      fixture.componentInstance.stateCtrl.setValue({ code: 'AL', name: 'Alabama' });
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(input.value)
        .toContain('Alabama', `Expected input to fill with matching option's viewValue.`);
    }));

    it('should clear the text field if value is reset programmatically', fakeAsync(() => {
      typeInElement('Alabama', input);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.stateCtrl.reset();
      tick();

      fixture.detectChanges();
      tick();

      expect(input.value).toEqual('', `Expected input value to be empty after reset.`);
    }));

    it('should disable input in view when disabled programmatically', () => {
      const formFieldElement =
        fixture.debugElement.query(By.css('.dt-form-field')).nativeElement;

      expect(input.disabled)
        .toBe(false, `Expected input to start out enabled in view.`);
      expect(formFieldElement.classList.contains('dt-form-field-disabled'))
        .toBe(false, `Expected input underline to start out with normal styles.`);

      fixture.componentInstance.stateCtrl.disable();
      fixture.detectChanges();

      expect(input.disabled)
        .toBe(true, `Expected input to be disabled in view when disabled programmatically.`);
      expect(formFieldElement.classList.contains('dt-form-field-disabled'))
        .toBe(true, `Expected input underline to display disabled styles.`);
    });

    it('should mark the autocomplete control as dirty as user types', () => {
      expect(fixture.componentInstance.stateCtrl.dirty).toBe(false, `Expected control to start out pristine.`);

      typeInElement('a', input);
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(true, `Expected control to become dirty when the user types into the input.`);
    });

    it('should mark the autocomplete control as dirty when an option is selected', fakeAsync(() => {
      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(false, `Expected control to start out pristine.`);

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(true, `Expected control to become dirty when an option was selected.`);
    }));

    it('should not mark the control dirty when the value is set programmatically', () => {
      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(false, `Expected control to start out pristine.`);

      fixture.componentInstance.stateCtrl.setValue('AL');
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(false, `Expected control to stay pristine if value is set programmatically.`);
    });

    it('should mark the autocomplete control as touched on blur', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      expect(fixture.componentInstance.stateCtrl.touched)
        .toBe(false, `Expected control to start out untouched.`);

      dispatchFakeEvent(input, 'blur');
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.touched)
        .toBe(true, `Expected control to become touched on blur.`);
    });

    it('should disable the input when used with a value accessor and without `dtInput`', () => {
      overlayContainer.ngOnDestroy();
      fixture.destroy();
      TestBed.resetTestingModule();

      const plainFixture = createComponent(PlainAutocompleteInputWithFormControl);
      plainFixture.detectChanges();
      input = plainFixture.nativeElement.querySelector('input');

      expect(input.disabled).toBe(false);

      plainFixture.componentInstance.formControl.disable();
      plainFixture.detectChanges();

      expect(input.disabled).toBe(true);
    });
  });

  describe('keyboard events', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;
    let input: HTMLInputElement;
    let DOWN_ARROW_EVENT: KeyboardEvent;
    let UP_ARROW_EVENT: KeyboardEvent;
    let ENTER_EVENT: KeyboardEvent;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();

      input = fixture.debugElement.query(By.css('input')).nativeElement;
      DOWN_ARROW_EVENT = createKeyboardEvent('keydown', DOWN_ARROW);
      UP_ARROW_EVENT = createKeyboardEvent('keydown', UP_ARROW);
      ENTER_EVENT = createKeyboardEvent('keydown', ENTER);

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();
    }));

    it('should not focus the option when DOWN key is pressed', () => {
      spyOn(fixture.componentInstance.options.first, 'focus');

      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      // tslint:disable-next-line:no-unbound-method
      expect(fixture.componentInstance.options.first.focus).not.toHaveBeenCalled();
    });

    it('should not close the panel when DOWN key is pressed', () => {
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(true, `Expected panel state to stay open when DOWN key is pressed.`);
      expect(overlayContainerElement.textContent)
        .toContain('Alabama', `Expected panel to keep displaying when DOWN key is pressed.`);
      expect(overlayContainerElement.textContent)
        .toContain('California', `Expected panel to keep displaying when DOWN key is pressed.`);
    });

    it('should set the active item to the first option when DOWN key is pressed', () => {
      const componentInstance = fixture.componentInstance;
      const optionEls = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');

      expect(componentInstance.trigger.panelOpen).toBe(true, 'Expected first down press to open the pane.');

      componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      expect(componentInstance.trigger.activeOption === componentInstance.options.first)
        .toBe(true, 'Expected first option to be active.');
      expect(optionEls[0].classList).toContain('dt-option-active');
      expect(optionEls[1].classList).not.toContain('dt-option-active');

      componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      expect(componentInstance.trigger.activeOption === componentInstance.options.toArray()[1])
        .toBe(true, 'Expected second option to be active.');
      expect(optionEls[0].classList).not.toContain('dt-option-active');
      expect(optionEls[1].classList).toContain('dt-option-active');
    });

    it('should set the active item to the last option when UP key is pressed', () => {
      const componentInstance = fixture.componentInstance;
      const optionEls = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');

      expect(componentInstance.trigger.panelOpen)
        .toBe(true, 'Expected first up press to open the pane.');

      componentInstance.trigger._handleKeydown(UP_ARROW_EVENT);
      fixture.detectChanges();

      expect(componentInstance.trigger.activeOption === componentInstance.options.last)
        .toBe(true, 'Expected last option to be active.');
      expect(optionEls[10].classList).toContain('dt-option-active');
      expect(optionEls[0].classList).not.toContain('dt-option-active');

      componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      expect(componentInstance.trigger.activeOption === componentInstance.options.first)
        .toBe(true, 'Expected first option to be active.');
      expect(optionEls[0].classList).toContain('dt-option-active');
    });

    it('should set the active item properly after filtering', fakeAsync(() => {
      const componentInstance = fixture.componentInstance;

      componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      tick();
      fixture.detectChanges();
    }));

    it('should set the active item properly after filtering', () => {
      const componentInstance = fixture.componentInstance;

      typeInElement('o', input);
      fixture.detectChanges();

      componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      const optionEls = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');

      expect(componentInstance.trigger.activeOption === componentInstance.options.first)
        .toBe(true, 'Expected first option to be active.');
      expect(optionEls[0].classList).toContain('dt-option-active');
      expect(optionEls[1].classList).not.toContain('dt-option-active');
    });

    it('should fill the text field when an option is selected with ENTER', fakeAsync(() => {
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      flush();
      fixture.detectChanges();

      fixture.componentInstance.trigger._handleKeydown(ENTER_EVENT);
      fixture.detectChanges();
      expect(input.value)
        .toContain('Alabama', `Expected text field to fill with selected value on ENTER.`);
    }));

    it('should prevent the default enter key action', fakeAsync(() => {
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      flush();

      fixture.componentInstance.trigger._handleKeydown(ENTER_EVENT);

      expect(ENTER_EVENT.defaultPrevented)
        .toBe(true, 'Expected the default action to have been prevented.');
    }));

    it('should not prevent the default enter action for a closed panel after a user action', () => {
      fixture.componentInstance.trigger._handleKeydown(UP_ARROW_EVENT);
      fixture.detectChanges();

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();
      fixture.componentInstance.trigger._handleKeydown(ENTER_EVENT);

      expect(ENTER_EVENT.defaultPrevented).toBe(false, 'Default action should not be prevented.');
    });

    it('should fill the text field, not select an option, when SPACE is entered', () => {
      typeInElement('New', input);
      fixture.detectChanges();

      const SPACE_EVENT = createKeyboardEvent('keydown', SPACE);
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      fixture.componentInstance.trigger._handleKeydown(SPACE_EVENT);
      fixture.detectChanges();

      expect(input.value).not.toContain('New York', `Expected option not to be selected on SPACE.`);
    });

    it('should mark the control dirty when selecting an option from the keyboard', fakeAsync(() => {
      expect(fixture.componentInstance.stateCtrl.dirty).toBe(false, `Expected control to start out pristine.`);

      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      flush();
      fixture.componentInstance.trigger._handleKeydown(ENTER_EVENT);
      fixture.detectChanges();

      expect(fixture.componentInstance.stateCtrl.dirty)
        .toBe(true, `Expected control to become dirty when option was selected by ENTER.`);
    }));

    it('should open the panel again when typing after making a selection', fakeAsync(() => {
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      flush();
      fixture.componentInstance.trigger._handleKeydown(ENTER_EVENT);
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(false, `Expected panel state to read closed after ENTER key.`);
      expect(overlayContainerElement.textContent)
        .toEqual('', `Expected panel to close after ENTER key.`);

      dispatchFakeEvent(input, 'focusin');
      typeInElement('Alabama', input);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(true, `Expected panel state to read open when typing in input.`);
      expect(overlayContainerElement.textContent)
        .toContain('Alabama', `Expected panel to display when typing in input.`);
    }));

    it('should not open the panel if the `input` event was dispatched with changing the value', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;

      dispatchFakeEvent(input, 'focusin');
      typeInElement('A', input);
      fixture.detectChanges();
      tick();

      expect(trigger.panelOpen).toBe(true, 'Expected panel to be open.');

      trigger.closePanel();
      fixture.detectChanges();

      expect(trigger.panelOpen).toBe(false, 'Expected panel to be closed.');

      // Dispatch the event without actually changing the value
      // to simulate what happen in some cases on IE.
      dispatchFakeEvent(input, 'input');
      fixture.detectChanges();
      tick();

      expect(trigger.panelOpen).toBe(false, 'Expected panel to stay closed.');
    }));

    it('should close the panel when pressing escape', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;

      input.focus();
      flush();
      fixture.detectChanges();

      expect(document.activeElement).toBe(input, 'Expected input to be focused.');
      expect(trigger.panelOpen).toBe(true, 'Expected panel to be open.');

      dispatchKeyboardEvent(document.body, 'keydown', ESCAPE);
      fixture.detectChanges();

      expect(document.activeElement).toBe(input, 'Expected input to continue to be focused.');
      expect(trigger.panelOpen).toBe(false, 'Expected panel to be closed.');
    }));

    it('should prevent the default action when pressing escape', fakeAsync(() => {
      const escapeEvent = dispatchKeyboardEvent(input, 'keydown', ESCAPE);
      fixture.detectChanges();

      expect(escapeEvent.defaultPrevented).toBe(true);
    }));

    it('should close the panel when pressing ALT + UP_ARROW', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;
      const upArrowEvent = createKeyboardEvent('keydown', UP_ARROW);
      Object.defineProperty(upArrowEvent, 'altKey', { get: () => true });

      input.focus();
      flush();
      fixture.detectChanges();

      expect(document.activeElement).toBe(input, 'Expected input to be focused.');
      expect(trigger.panelOpen).toBe(true, 'Expected panel to be open.');

      dispatchEvent(document.body, upArrowEvent);
      fixture.detectChanges();

      expect(document.activeElement).toBe(input, 'Expected input to continue to be focused.');
      expect(trigger.panelOpen).toBe(false, 'Expected panel to be closed.');
    }));

    it('should close the panel when tabbing away from a trigger without results', fakeAsync(() => {
      fixture.componentInstance.states = [];
      fixture.componentInstance.filteredStates = [];
      fixture.detectChanges();
      input.focus();
      flush();

      expect(overlayContainerElement.querySelector('.dt-autocomplete-panel')).toBeTruthy('Expected panel to be rendered.');

      dispatchKeyboardEvent(input, 'keydown', TAB);
      fixture.detectChanges();

      expect(overlayContainerElement.querySelector('.dt-autocomplete-panel'))
        .toBeFalsy('Expected panel to be removed.');
    }));

    it('should reset the active option when closing with the escape key', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;

      trigger.openPanel();
      fixture.detectChanges();
      tick();

      expect(trigger.panelOpen).toBe(true, 'Expected panel to be open.');
      expect(!!trigger.activeOption).toBe(false, 'Expected no active option.');

      // Press the down arrow a few times.
      [1, 2, 3].forEach(() => {
        trigger._handleKeydown(DOWN_ARROW_EVENT);
        tick();
        fixture.detectChanges();
      });

      // Note that this casts to a boolean, in order to prevent Jasmine
      // from crashing when trying to stringify the option if the test fails.
      expect(!!trigger.activeOption).toBe(true, 'Expected to find an active option.');

      dispatchKeyboardEvent(document.body, 'keydown', ESCAPE);
      tick();

      expect(!!trigger.activeOption).toBe(false, 'Expected no active options.');
    }));

    it('should reset the active option when closing by selecting with enter', fakeAsync(() => {
      const trigger = fixture.componentInstance.trigger;

      trigger.openPanel();
      fixture.detectChanges();
      tick();

      expect(trigger.panelOpen).toBe(true, 'Expected panel to be open.');
      expect(!!trigger.activeOption).toBe(false, 'Expected no active option.');

      // Press the down arrow a few times.
      [1, 2, 3].forEach(() => {
        trigger._handleKeydown(DOWN_ARROW_EVENT);
        tick();
        fixture.detectChanges();
      });

      // Note that this casts to a boolean, in order to prevent Jasmine
      // from crashing when trying to stringify the option if the test fails.
      expect(!!trigger.activeOption).toBe(true, 'Expected to find an active option.');

      trigger._handleKeydown(ENTER_EVENT);
      tick();

      expect(!!trigger.activeOption).toBe(false, 'Expected no active options.');
    }));
  });

  describe('aria', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;
    let input: HTMLInputElement;

    beforeEach(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();

      input = fixture.debugElement.query(By.css('input')).nativeElement;
    });

    it('should set role of input to combobox', () => {
      expect(input.getAttribute('role'))
        .toEqual('combobox', 'Expected role of input to be combobox.');
    });

    it('should set role of autocomplete panel to listbox', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      const panel = fixture.debugElement.query(By.css('.dt-autocomplete-panel')).nativeElement;

      expect(panel.getAttribute('role'))
        .toEqual('listbox', 'Expected role of the panel to be listbox.');
    });

    it('should set aria-autocomplete to list', () => {
      expect(input.getAttribute('aria-autocomplete'))
        .toEqual('list', 'Expected aria-autocomplete attribute to equal list.');
    });

    it('should set aria-activedescendant based on the active option', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(input.hasAttribute('aria-activedescendant'))
        .toBe(false, 'Expected aria-activedescendant to be absent if no active item.');

      const DOWN_ARROW_EVENT = createKeyboardEvent('keydown', DOWN_ARROW);

      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      tick();
      fixture.detectChanges();

      expect(input.getAttribute('aria-activedescendant')).toEqual(
        fixture.componentInstance.options.first.id,
        'Expected aria-activedescendant to match the active item after 1 down arrow.');

      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      tick();
      fixture.detectChanges();

      expect(input.getAttribute('aria-activedescendant')).toEqual(
        fixture.componentInstance.options.toArray()[1].id,
        'Expected aria-activedescendant to match the active item after 2 down arrows.');
    }));

    it('should set aria-expanded based on whether the panel is open', () => {
      expect(input.getAttribute('aria-expanded'))
        .toBe('false', 'Expected aria-expanded to be false while panel is closed.');

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(input.getAttribute('aria-expanded'))
        .toBe('true', 'Expected aria-expanded to be true while panel is open.');

      fixture.componentInstance.trigger.closePanel();
      fixture.detectChanges();

      expect(input.getAttribute('aria-expanded'))
        .toBe('false', 'Expected aria-expanded to be false when panel closes again.');
    });

    it('should set aria-expanded properly when the panel is hidden', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      expect(input.getAttribute('aria-expanded'))
        .toBe('true', 'Expected aria-expanded to be true while panel is open.');

      typeInElement('zz', input);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(input.getAttribute('aria-expanded'))
        .toBe('false', 'Expected aria-expanded to be false when panel hides itself.');
    }));

    it('should set aria-owns based on the attached autocomplete', () => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      const panel = fixture.debugElement.query(By.css('.dt-autocomplete-panel')).nativeElement;

      expect(input.getAttribute('aria-owns'))
        .toBe(panel.getAttribute('id'), 'Expected aria-owns to match attached autocomplete.');
    });

    it('should not set aria-owns while the autocomplete is closed', () => {
      expect(input.getAttribute('aria-owns')).toBeFalsy();

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      expect(input.getAttribute('aria-owns')).toBeTruthy();
    });

    it('should restore focus to the input when clicking to select a value', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const option = overlayContainerElement.querySelector('dt-option') as HTMLElement;

      // Focus the option manually since the synthetic click may not do it.
      option.focus();
      option.click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(input, 'Expected focus to be restored to the input.');
    }));

    it('should remove autocomplete-specific aria attributes when autocomplete is disabled', () => {
      fixture.componentInstance.autocompleteDisabled = true;
      fixture.detectChanges();

      expect(input.getAttribute('role')).toBeFalsy();
      expect(input.getAttribute('aria-autocomplete')).toBeFalsy();
      expect(input.getAttribute('aria-expanded')).toBeFalsy();
      expect(input.getAttribute('aria-owns')).toBeFalsy();
    });
  });

  describe('Option selection', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;

    beforeEach(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();
    });

    it('should deselect any other selected option', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      let options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[0].click();
      fixture.detectChanges();
      zone.simulateZoneExit();
      fixture.detectChanges();

      const componentOptions = fixture.componentInstance.options.toArray();
      expect(componentOptions[0].selected).toBe(true, `Clicked option should be selected.`);

      options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      expect(componentOptions[0].selected).toBe(false, `Previous option should not be selected.`);
      expect(componentOptions[1].selected).toBe(true, `New Clicked option should be selected.`);
    }));

    it('should call deselect only on the previous selected option', fakeAsync(() => {
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      let options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[0].click();
      fixture.detectChanges();
      zone.simulateZoneExit();
      fixture.detectChanges();

      const componentOptions = fixture.componentInstance.options.toArray();
      componentOptions.forEach((option) => spyOn(option, 'deselect'));

      expect(componentOptions[0].selected)
        .toBe(true, `Clicked option should be selected.`);

      options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
      options[1].click();
      fixture.detectChanges();

      // tslint:disable-next-line:no-unbound-method
      expect(componentOptions[0].deselect).toHaveBeenCalled();
      // tslint:disable-next-line:no-unbound-method
      componentOptions.slice(1).forEach((option) => expect(option.deselect).not.toHaveBeenCalled());
    }));

    it('should be able to preselect the first option', fakeAsync(() => {
      fixture.componentInstance.trigger.autocomplete.autoActiveFirstOption = true;
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();
      fixture.detectChanges();

      expect(overlayContainerElement.querySelectorAll('dt-option')[0].classList)
        .toContain('dt-option-active', 'Expected first option to be highlighted.');
    }));

    it('should be able to preselect the first option on focus', fakeAsync(() => {
      const input = fixture.debugElement.query(By.css('input')).nativeElement;
      fixture.componentInstance.trigger.autocomplete.autoActiveFirstOption = true;
      fixture.detectChanges();

      dispatchFakeEvent(input, 'focusin');
      zone.simulateZoneExit();

      expect(overlayContainerElement.querySelectorAll('dt-option')[0].classList)
        .toContain('dt-option-active', 'Expected first option to be highlighted.');
    }));

    it('should be able to configure preselecting the first option globally', fakeAsync(() => {
      overlayContainer.ngOnDestroy();
      fixture.destroy();
      TestBed.resetTestingModule();
      fixture = createComponent(SimpleAutocomplete, [
        { provide: DT_AUTOCOMPLETE_DEFAULT_OPTIONS, useValue: { autoActiveFirstOption: true } },
      ]);

      fixture.detectChanges();
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();
      fixture.detectChanges();

      expect(overlayContainerElement.querySelectorAll('dt-option')[0].classList)
        .toContain('dt-option-active', 'Expected first option to be highlighted.');
    }));

    it('should handle `optionSelections` being accessed too early', fakeAsync(() => {
      overlayContainer.ngOnDestroy();
      fixture.destroy();
      fixture = TestBed.createComponent(SimpleAutocomplete);

      const spy = jasmine.createSpy('option selection spy');
      let subscription: Subscription = Subscription.EMPTY;

      expect(fixture.componentInstance.trigger.autocomplete).toBeFalsy();
      expect(() => {
        subscription = fixture.componentInstance.trigger.optionSelections.subscribe(spy);
      }).not.toThrow();

      fixture.detectChanges();
      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      zone.simulateZoneExit();

      const option = overlayContainerElement.querySelector('dt-option') as HTMLElement;

      option.click();
      fixture.detectChanges();
      zone.simulateZoneExit();

      expect(spy).toHaveBeenCalledWith(jasmine.any(DtOptionSelectionChange));
      subscription.unsubscribe();
    }));
  });

  describe('panel closing', () => {
    let fixture: ComponentFixture<SimpleAutocomplete>;
    let input: HTMLInputElement;
    let trigger: DtAutocompleteTrigger<any>;
    let closingActionSpy: jasmine.Spy;
    let closingActionsSub: Subscription;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleAutocomplete);
      fixture.detectChanges();

      input = fixture.debugElement.query(By.css('input')).nativeElement;

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();
      flush();

      trigger = fixture.componentInstance.trigger;
      closingActionSpy = jasmine.createSpy('closing action listener');
      closingActionsSub = trigger.panelClosingActions.subscribe(closingActionSpy);
    }));

    afterEach(() => {
      closingActionsSub.unsubscribe();
    });

    it('should emit panel close event when clicking away', () => {
      expect(closingActionSpy).not.toHaveBeenCalled();
      dispatchFakeEvent(document, 'click');
      expect(closingActionSpy).toHaveBeenCalledWith(null);
    });

    it('should emit panel close event when tabbing out', () => {
      const tabEvent = createKeyboardEvent('keydown', TAB);
      input.focus();

      expect(closingActionSpy).not.toHaveBeenCalled();
      trigger._handleKeydown(tabEvent);
      expect(closingActionSpy).toHaveBeenCalledWith(null);
    });

    it('should not emit when tabbing away from a closed panel', () => {
      const tabEvent = createKeyboardEvent('keydown', TAB);

      input.focus();
      zone.simulateZoneExit();

      trigger._handleKeydown(tabEvent);

      // Ensure that it emitted once while the panel was open.
      expect(closingActionSpy).toHaveBeenCalledTimes(1);

      trigger._handleKeydown(tabEvent);

      // Ensure that it didn't emit again when tabbing out again.
      expect(closingActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit panel close event when selecting an option', () => {
      const option = overlayContainerElement.querySelector('dt-option') as HTMLElement;

      expect(closingActionSpy).not.toHaveBeenCalled();
      option.click();
      expect(closingActionSpy).toHaveBeenCalledWith(jasmine.any(DtOptionSelectionChange));
    });

    it('should close the panel when pressing escape', () => {
      expect(closingActionSpy).not.toHaveBeenCalled();
      dispatchKeyboardEvent(document.body, 'keydown', ESCAPE);
      expect(closingActionSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('without dtInput', () => {
    let fixture: ComponentFixture<AutocompleteWithNativeInput>;

    beforeEach(() => {
      fixture = createComponent(AutocompleteWithNativeInput);
      fixture.detectChanges();
    });

    it('should not throw when clicking outside', fakeAsync(() => {
      dispatchFakeEvent(fixture.debugElement.query(By.css('input')).nativeElement, 'focus');
      fixture.detectChanges();
      flush();

      expect(() => dispatchFakeEvent(document, 'click')).not.toThrow();
    }));
  });

  describe('misc', () => {

    it('should allow basic use without any forms directives', () => {
      expect(() => {
        const fixture = createComponent(AutocompleteWithoutForms);
        fixture.detectChanges();

        const input = fixture.debugElement.query(By.css('input')).nativeElement;
        typeInElement('d', input);
        fixture.detectChanges();

        const options = overlayContainerElement.querySelectorAll<HTMLElement>('dt-option');
        expect(options.length).toBe(1);
      }).not.toThrowError();
    });

    it('should display an empty input when the value is undefined with ngModel', () => {
      const fixture = createComponent(AutocompleteWithNgModel);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('input')).nativeElement.value).toBe('');
    });

    it('should display the number when the selected option is the number zero', fakeAsync(() => {
      const fixture = createComponent(AutocompleteWithNumbers);

      fixture.componentInstance.selectedNumber = 0;
      fixture.detectChanges();
      tick();

      expect(fixture.debugElement.query(By.css('input')).nativeElement.value).toBe('0');
    }));

    it('should work when input is wrapped in ngIf', () => {
      const fixture = createComponent(NgIfAutocomplete);
      fixture.detectChanges();

      dispatchFakeEvent(fixture.debugElement.query(By.css('input')).nativeElement, 'focusin');
      fixture.detectChanges();

      expect(fixture.componentInstance.trigger.panelOpen)
        .toBe(true, `Expected panel state to read open when input is focused.`);
      expect(overlayContainerElement.textContent)
        .toContain('One', `Expected panel to display when input is focused.`);
      expect(overlayContainerElement.textContent)
        .toContain('Two', `Expected panel to display when input is focused.`);
    });

    it('should filter properly with ngIf after setting the active item', () => {
      const fixture = createComponent(NgIfAutocomplete);
      fixture.detectChanges();

      fixture.componentInstance.trigger.openPanel();
      fixture.detectChanges();

      const DOWN_ARROW_EVENT = createKeyboardEvent('keydown', DOWN_ARROW);
      fixture.componentInstance.trigger._handleKeydown(DOWN_ARROW_EVENT);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input')).nativeElement;
      typeInElement('o', input);
      fixture.detectChanges();

      expect(fixture.componentInstance.dtOptions.length).toBe(2);
    });

    it('should throw if the user attempts to open the panel too early', () => {
      const fixture = createComponent(AutocompleteWithoutPanel);
      fixture.detectChanges();

      expect(() => {
        fixture.componentInstance.trigger.openPanel();
      }).toThrow(getDtAutocompleteMissingPanelError());
    });

    it('should not throw on init, even if the panel is not defined', fakeAsync(() => {
      expect(() => {
        const fixture = createComponent(AutocompleteWithoutPanel);
        fixture.componentInstance.control.setValue('Something');
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should handle autocomplete being attached to number inputs', fakeAsync(() => {
      const fixture = createComponent(AutocompleteWithNumberInputAndNgModel);
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input')).nativeElement;

      typeInElement('1337', input);
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedValue).toBe(1337);
    }));

  });
});

@Component({
  template: `
    <dt-form-field [style.width.px]="width">
      <input
        dtInput
        placeholder="State"
        [dtAutocomplete]="auto"
        [dtAutocompleteDisabled]="autocompleteDisabled"
        [formControl]="stateCtrl">
    </dt-form-field>
    <dt-autocomplete class="class-one class-two" #auto="dtAutocomplete" [displayWith]="displayFn"
       (opened)="openedSpy()" (closed)="closedSpy()">
      <dt-option *ngFor="let state of filteredStates" [value]="state">
        <span>{{ state.code }}: {{ state.name }}</span>
      </dt-option>
    </dt-autocomplete>
  `,
})
class SimpleAutocomplete implements OnDestroy {
  stateCtrl = new FormControl();
  filteredStates: any[];
  valueSub: Subscription;
  width: number;
  autocompleteDisabled = false;
  openedSpy = jasmine.createSpy('autocomplete opened spy');
  closedSpy = jasmine.createSpy('autocomplete closed spy');

  @ViewChild(DtAutocompleteTrigger) trigger: DtAutocompleteTrigger<any>;
  @ViewChild(DtAutocomplete) panel: DtAutocomplete<any>;
  @ViewChild(DtFormField) formField: DtFormField<any>;
  @ViewChildren(DtOption) options: QueryList<DtOption<any>>;

  states = [
    { code: 'AL', name: 'Alabama' },
    { code: 'CA', name: 'California' },
    { code: 'FL', name: 'Florida' },
    { code: 'KS', name: 'Kansas' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'NY', name: 'New York' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WY', name: 'Wyoming' },
  ];

  constructor() {
    this.filteredStates = this.states;
    this.valueSub = this.stateCtrl.valueChanges.subscribe((val) => {
      this.filteredStates = val ? this.states.filter((s) => s.name.match(new RegExp(val, 'gi'))) : this.states;
    });
  }

  displayFn(value: any): string {
    return value ? value.name : value;
  }

  ngOnDestroy(): void {
    this.valueSub.unsubscribe();
  }
}

@Component({
  template: `
    <input autocomplete="changed" [(ngModel)]="value" [dtAutocomplete]="auto"/>
    <dt-autocomplete #auto="dtAutocomplete"></dt-autocomplete>
  `,
})
class AutocompleteWithNativeAutocompleteAttribute {
  value: string;
}

@Component({
  template: '<input [dtAutocomplete]="null" dtAutocompleteDisabled>',
})
class InputWithoutAutocompleteAndDisabled { }

@Component({
  template: `
    <input [formControl]="formControl" [dtAutocomplete]="auto"/>
    <dt-autocomplete #auto="dtAutocomplete"></dt-autocomplete>
  `,
})
class PlainAutocompleteInputWithFormControl {
  formControl = new FormControl();
}

@Component({
  template: `
    <input placeholder="Choose" [dtAutocomplete]="auto" [formControl]="optionCtrl">
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let option of filteredOptions | async" [value]="option">
         {{option}}
      </dt-option>
    </dt-autocomplete>
  `,
})
class AutocompleteWithNativeInput {
  optionCtrl = new FormControl();
  filteredOptions: Observable<any>;
  options = ['En', 'To', 'Tre', 'Fire', 'Fem'];

  @ViewChild(DtAutocompleteTrigger) trigger: DtAutocompleteTrigger<any>;
  @ViewChildren(DtOption) dtOptions: QueryList<DtOption<any>>;

  constructor() {
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((val: string) => val ? this.options.filter((option) => new RegExp(val, 'gi').test(option)) : this.options.slice())
    );
  }
}

@Component({
  template: `
    <dt-form-field>
      <input dtInput placeholder="State" [dtAutocomplete]="auto"
      (input)="onInput($event.target?.value)">
    </dt-form-field>
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let state of filteredStates" [value]="state">
        <span> {{ state }}  </span>
      </dt-option>
    </dt-autocomplete>
  `,
})
class AutocompleteWithoutForms {
  filteredStates: any[];
  states = ['Alabama', 'California', 'Florida'];

  constructor() {
    this.filteredStates = this.states.slice();
  }

  onInput(value: any): void {
    this.filteredStates = this.states.filter((s) => new RegExp(value, 'gi').test(s));
  }
}

@Component({
  template: `
    <dt-form-field>
      <input dtInput placeholder="State" [dtAutocomplete]="auto" [(ngModel)]="selectedState"
      (ngModelChange)="onInput($event)">
    </dt-form-field>
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let state of filteredStates" [value]="state">
        <span>{{ state }}</span>
      </dt-option>
    </dt-autocomplete>
  `,
})
class AutocompleteWithNgModel {
  filteredStates: any[];
  selectedState: string;
  states = ['New York', 'Washington', 'Oregon'];

  constructor() {
    this.filteredStates = this.states.slice();
  }

  onInput(value: any): void {
    this.filteredStates = this.states.filter((s) => new RegExp(value, 'gi').test(s));
  }
}

@Component({
  template: `
    <dt-form-field>
      <input dtInput placeholder="Number" [dtAutocomplete]="auto" [(ngModel)]="selectedNumber">
    </dt-form-field>
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let number of numbers" [value]="number">
        <span>{{ number }}</span>
      </dt-option>
    </dt-autocomplete>
  `,
})
class AutocompleteWithNumbers {
  selectedNumber: number;
  numbers = [0, 1, 2];
}

@Component({
  template: `
    <dt-form-field *ngIf="isVisible">
      <input dtInput placeholder="Choose" [dtAutocomplete]="auto" [formControl]="optionCtrl">
    </dt-form-field>
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let option of filteredOptions | async" [value]="option">
         {{option}}
      </dt-option>
    </dt-autocomplete>
  `,
})
class NgIfAutocomplete {
  optionCtrl = new FormControl();
  filteredOptions: Observable<any>;
  isVisible = true;
  options = ['One', 'Two', 'Three'];

  @ViewChild(DtAutocompleteTrigger) trigger: DtAutocompleteTrigger<any>;
  @ViewChildren(DtOption) dtOptions: QueryList<DtOption<any>>;

  constructor() {
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((val: string) => val ? this.options.filter((option) => new RegExp(val, 'gi').test(option)) : this.options.slice()));
  }
}

@Component({
  template: `<input placeholder="Choose" [dtAutocomplete]="auto" [formControl]="control">`,
})
class AutocompleteWithoutPanel {
  @ViewChild(DtAutocompleteTrigger) trigger: DtAutocompleteTrigger<any>;
  control = new FormControl();
}

@Component({
  template: `
    <dt-form-field>
      <input type="number" dtInput [dtAutocomplete]="auto" [(ngModel)]="selectedValue">
    </dt-form-field>
    <dt-autocomplete #auto="dtAutocomplete">
      <dt-option *ngFor="let value of values" [value]="value">{{value}}</dt-option>
    </dt-autocomplete>
  `,
})
class AutocompleteWithNumberInputAndNgModel {
  selectedValue: number;
  values = [1, 2, 3];
}

// tslint:enabule:no-any no-magic-numbers max-file-line-count